"""Import the local workbook and reference documents into searchable site data.

Only the Python standard library and Poppler's pdftotext are required.
Run: python3 build.py
"""

from __future__ import annotations

import json
import re
import subprocess
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "site" / "data.json"
WORKBOOK = ROOT / "Java Подготовка к интервью.xlsx"
MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
WORD = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"m": MAIN}
HEADINGS = {
    "Core-1": {"Java", "Процедурная Java", "ООП в Java", "Исключения", "Сериализация и копирование"},
    "Core-2": {"Коллекции", "Функциональные интерфейсы", "Stream API", "Java 8"},
}


def cell_value(cell: ET.Element, strings: list[str]) -> str:
    value = cell.find(f"{{{MAIN}}}v")
    kind = cell.get("t")
    if value is not None and value.text is not None:
        return strings[int(value.text)] if kind == "s" else value.text
    inline = cell.find(f"{{{MAIN}}}is")
    return "".join(t.text or "" for t in inline.iter(f"{{{MAIN}}}t")) if inline is not None else ""


def import_workbook() -> list[dict]:
    with zipfile.ZipFile(WORKBOOK) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            strings = ["".join(t.text or "" for t in si.iter(f"{{{MAIN}}}t")) for si in shared]
        book = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {node.get("Id"): node.get("Target") for node in relationships}
        modules = []
        for index, sheet in enumerate(book.findall("m:sheets/m:sheet", NS)):
            name = sheet.get("name")
            target = targets[sheet.get(f"{{{REL}}}id")].lstrip("/")
            if not target.startswith("xl/"):
                target = "xl/" + target
            xml = ET.fromstring(archive.read(target))
            entries = []
            current = None
            section = "ООП и SOLID" if name == "Core-1" else "Дженерики" if name == "Core-2" else ""
            for row in xml.findall(".//m:sheetData/m:row", NS):
                rownum = int(row.get("r"))
                values = {}
                for cell in row.findall("m:c", NS):
                    text = cell_value(cell, strings).strip()
                    column = re.match(r"[A-Z]+", cell.get("r", ""))
                    if text and column:
                        values[column.group()] = text
                if not values:
                    continue
                title = values.pop("A", "").strip()
                answer = values.pop("B", "").strip()
                extra = {key: value for key, value in values.items() if key not in ("C",) or value.strip()}
                if title in HEADINGS.get(name, set()) and not answer:
                    section = title
                    current = None
                    continue
                if title and title not in ("-", name) and not (title == "и" and rownum == 1):
                    current = {
                        "id": f"{index + 1}-{rownum}",
                        "title": title,
                        "answer": answer,
                        "row": rownum,
                        "cell": f"{name}!A{rownum}",
                        "section": section,
                        "extra": extra,
                    }
                    entries.append(current)
                elif current:
                    continuation = "\n".join(part for part in [answer, *extra.values()] if part)
                    if continuation:
                        current["answer"] += ("\n\n" if current["answer"] else "") + continuation
                if current and title and extra:
                    current["extra"] = extra
            modules.append({"id": str(index + 1), "name": name, "entries": entries})
    return modules


def docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    paragraphs = []
    for paragraph in document.iter(f"{{{WORD}}}p"):
        text = "".join(node.text or "" for node in paragraph.iter(f"{{{WORD}}}t"))
        if text.strip():
            paragraphs.append(text.strip())
    return "\n\n".join(paragraphs)


def pdf_text(path: Path) -> tuple[str, int]:
    result = subprocess.run(
        ["pdftotext", "-layout", str(path), "-"], capture_output=True, check=True
    )
    pages = result.stdout.decode("utf-8", errors="replace").strip("\f\n").split("\f")
    return "\n\n".join(f"Страница {i + 1}\n{page.strip()}" for i, page in enumerate(pages)), len(pages)


def import_sources() -> list[dict]:
    paths = sorted([*ROOT.glob("*.pdf"), *ROOT.glob("[1-7]. */*.pdf"), *ROOT.glob("[1-7]. */*.docx")])
    sources = []
    for i, path in enumerate(paths):
        relative = path.relative_to(ROOT).as_posix()
        if path.suffix == ".pdf":
            text, pages = pdf_text(path)
        else:
            text, pages = docx_text(path), None
        group = relative.split("/")[0]
        module = group.split(".")[0] if "/" in relative else "9"
        linked = [module]
        if path.name == "Коллекции.pdf":
            linked = ["2", "8"]
        elif path.name == "Algorithms_BigO.pdf":
            linked = ["8", "2"]
        elif path.name == "CORE вопросы-ответы.docx":
            linked = ["1", "2"]
        elif path.name == "Microservices Patterns.pdf":
            linked = ["9", "7"]
        sources.append({
            "id": f"source-{i + 1}", "name": path.name, "path": relative,
            "type": path.suffix[1:].upper(), "modules": linked,
            "pages": pages, "text": text,
        })
    sources.append({
        "id": "workbook", "name": WORKBOOK.name, "path": WORKBOOK.name,
        "type": "XLSX", "modules": [m for m in map(str, range(1, 12))],
        "pages": None, "text": "Исходный банк вопросов и ответов; структура 11 листов курса.",
    })
    return sources


def normalized(text: str) -> str:
    return re.sub(r"[^a-zа-яё0-9]+", " ", text.casefold()).replace("ё", "е").strip()


def link_pages(modules: list[dict], sources: list[dict]) -> None:
    """Attach likely PDF pages when the original question text occurs on a page."""
    pages_by_module = {}
    for source in sources:
        if source["type"] != "PDF":
            continue
        pages = re.split(r"Страница \d+\n", source["text"])[1:]
        for module_id in source["modules"]:
            pages_by_module.setdefault(module_id, []).extend(
                (source["id"], number, normalized(text))
                for number, text in enumerate(pages, 1)
            )
    for module in modules:
        for entry in module["entries"]:
            title = normalized(entry["title"])
            if len(title) < 24:
                entry["references"] = []
                continue
            needle = title[: min(len(title), 85)]
            matched = []
            seen = set()
            for source_id, page_number, page_text in pages_by_module.get(module["id"], []):
                if needle in page_text and source_id not in seen:
                    matched.append({"source": source_id, "page": page_number})
                    seen.add(source_id)
            entry["references"] = matched


def main() -> None:
    if not WORKBOOK.exists():
        raise SystemExit(f"Workbook not found: {WORKBOOK}")
    modules = import_workbook()
    sources = import_sources()
    link_pages(modules, sources)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"modules": modules, "sources": sources}, ensure_ascii=False), encoding="utf-8")
    print(f"Imported {sum(len(m['entries']) for m in modules)} questions from {len(modules)} sheets, "
          f"{len(sources)} original files, "
          f"{sum(len(e['references']) for m in modules for e in m['entries'])} PDF page links "
          f"→ {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
