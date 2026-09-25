"""Serve the course and original documents without duplicating large files."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        route = unquote(urlsplit(path).path)
        if route.startswith("/assets/"):
            base, candidate = ROOT, route[len("/assets/"):]
        else:
            base, candidate = SITE, route.lstrip("/") or "index.html"
        target = (base / candidate).resolve()
        return str(target if target.is_relative_to(base) else base / "__invalid__")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Java course development server")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="127.0.0.1", help="Interface to listen on (Docker: 0.0.0.0)")
    args = parser.parse_args()
    print(f"Course: http://{args.host}:{args.port}", flush=True)
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
