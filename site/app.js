/* Java Atlas: all content is imported from the local files by build.py. */
const $ = (selector) => document.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const truncate = (value, length = 140) => value.length > length ? value.slice(0, length).trimEnd() + '…' : value;
const asset = path => '/assets/' + path.split('/').map(encodeURIComponent).join('/');
const original = source => asset(source.path);
const labels = ['Java Core · основы','Java Core · коллекции','Многопоточность','SQL и базы данных','Hibernate / JPA','Spring Framework','Паттерны','Алгоритмы','Дополнительные темы','Лайвкодинг','Вопросы работодателю'];
const icons = ['◇','▦','⌁','▤','⬡','✳','◈','⌘','◎','</>','☷'];
const descriptions = [
  'ООП, JVM, память, строки, классы и исключения',
  'Дженерики, коллекции, Stream API и Java 8',
  'Потоки, синхронизация, JMM и concurrency',
  'Запросы, индексы, транзакции и оптимизация',
  'Сущности, связи, кеширование и проблема N+1',
  'Бины, DI, MVC, транзакции, Security и Boot',
  'Порождающие, структурные и поведенческие шаблоны',
  'Сложность, структуры данных, поиск и сортировка',
  'HTTP, инструменты, тестирование и микросервисы',
  'Решайте задачи и сравнивайте решения',
  'Чеклист вопросов на собеседовании'
];
const groups = {
  1: [['ООП и SOLID', /ооп|solid|инкапсуляц|наследован|полиморф|ассоциац|композиц|агрегац|связыван/i],['JVM и память', /jvm|jdk|jre|byte.?code|байт|classloader|загрузчик|jit|сборщик|garbage|stack|heap|ссылок|ссылки/i],['Типы и строки', /примитив|char|boolean|оберт|упаков|приведен|пул |строк|string|массив|переменн|сигнатур|main|методы/i],['Классы и интерфейсы', /класс|конструктор|интерфейс|enum|модификатор|static|final|абстракт|переопредел|блок.*инициализац/i],['Object, equals и hashCode', /object|equals|hashcode|хэш-код|hashCode/i],['Исключения', /исключен|catch|finally|throws|try-with/i],['Сериализация и копирование', /сериализац|clone|клонирован|копи[яи]/i]],
  2: [['Дженерики', /дженерик|стирани|сыры[ех]|вайлдкард|pecs/i],['Коллекции и Map', /коллекц|collection|map|set|list|queue|deque|iterator|итератор|arraylist|linkedlist|hash|tree|коллизи|fifo|lifo|емкост|ёмкост/i],['Функциональный стиль', /функциональн|лямбда|ссылка на метод/i],['Stream API', /stream|стрим|peek|flatmap|filter|limit|skip|sorted|distinct|collect|reduce/i],['Java 8 и даты', /java 8|optional|дата|date|base64|nashorn|jjs|localdatetime|zoneddatetime/i]],
  3: [['Потоки и жизненный цикл', /процесс|поток|thread|runnable|callable|daemon|демон|приоритет|join|start|sleep|interrupt/i],['Синхронизация и JMM', /монитор|синхрониз|synchronized|wait|notify|volatile|atomic|memory model|семафор/i],['Конкурентность и проблемы', /deadlock|livelock|race|fork|future|concurrent/i]],
  4: [['Язык запросов', /ddl|dml|tcl|dcl|join|union|where|having|group|order|distinct|limit|exists|between|like|merge|агрегат|null/i],['Схема и объекты БД', /constraint|ограничен|ключ|индекс|таблиц|представлен|view|процедур|триггер|нормализац/i],['Транзакции и производительность', /транзакц|acid|изоляц|шардирован|explain|оптимизац|быстр/i]],
  5: [['ORM и сущности', /orm|jpa|hibernate|entitymanager|entity|embeddable|mapped|наследован|enum|даты/i],['Связи и жизненный цикл', /связ|каскад|persist|merge|fetch|жизненн|remove|refresh|detach/i],['Аннотации и маппинг', /аннотац|ключ|column|cacheable|order|transient|joincolumn|jointable/i],['Запросы и оптимизация', /jpql|hql|criteria|n\+1|кэш|кеш|блокиров/i]],
  6: [['Контейнер и бины', /ioc|di|контейнер|applicationcontext|beanfactory|бин|bean|component|service|repository|inject|autowired|qualifier|primary|resource|profile|conditional/i],['Транзакции и Web', /транзакц|controller|view|mvc|front|request|filter|interceptor|listener/i],['AOP и Security', /аоп|aop|security/i],['Spring Boot и версии', /boot|spring 5|нововведен/i]],
  7: [['Основы паттернов', /характеристик|групп/i],['Порождающие', /singleton|одиноч|строител|builder|factory|фабрик|прототип|prototype/i],['Структурные', /адаптер|adapter|декоратор|decorator|заместител|proxy/i],['Поведенческие', /итератор|iterator|шаблонн|template|цепочк|chain/i],['Паттерны в экосистеме', /spring|hibernate|grasp|saga/i]],
  8: [['Сложность и подходы', /big o|сложност|рекурс|жадн/i],['Сортировка и поиск', /сортиров|поиск/i],['Структуры данных', /дерево|очеред|стек|arraylist|linkedlist/i]],
  9: [['Инструменты и процесс', /легенд|maven|git|unix|tdd|ddd|bdd|ci\/cd|code first|design first/i],['HTTP и API', /rest|soap|http|идемпотент|статус|код[ыов]* ошибок|метод[ыа]* get|метод[ыа]* post/i],['Базы данных', /репликац|dirty checking|nosql|statement|cap|repository|dao/i],['Java и тестирование', /утечк|java 8|рефлекс|компиляц|mock|spy|мемоизац/i],['Микросервисы и сообщения', /микросервис|обмен|очеред|rpc|jms|mom/i]],
  10: [['Практические задачи', /./]],11: [['Чеклист собеседования', /./]]
};

let data, modules, sources, allEntries;
let prefs;
try { prefs = JSON.parse(localStorage.getItem('java-atlas-progress') || '{}'); } catch { prefs = {}; }
prefs.done ||= {}; prefs.star ||= {}; prefs.repeat ||= {}; prefs.notes ||= {}; prefs.code ||= {};
let practiceIndex = 0, practiceOpen = false, practiceModule = 'all', libraryFilter = 'all';
const save = () => localStorage.setItem('java-atlas-progress', JSON.stringify(prefs));
const sourceFor = moduleID => sources.filter(s => s.modules.includes(moduleID));
const entryLink = e => `#/question/${e.id}`;
const moduleLink = m => `#/module/${m.id}`;
const moduleOf = e => modules[Number(e.id.split('-')[0]) - 1];
const category = (entry, moduleID) => (groups[moduleID] || []).find(([, regex]) => regex.test(entry.title))?.[0] || 'Другие вопросы';
const countDone = m => m.entries.filter(e => prefs.done[e.id]).length;
const section = (name, subtitle = '') => `<div class="section-heading"><div><h2>${esc(name)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div></div>`;
function nav() {
  $('#main-nav').innerHTML = `<a class="nav-item" data-nav="home" href="#/"><span class="nav-icon">⌂</span>Обзор курса</a><a class="nav-item" data-nav="practice" href="#/practice"><span class="nav-icon">◉</span>Практика</a><a class="nav-item" data-nav="cheats" href="#/cheats"><span class="nav-icon">▥</span>Быстрые таблицы</a><a class="nav-item" data-nav="saved" href="#/saved"><span class="nav-icon">☆</span>Избранное и повторение</a><a class="nav-item" data-nav="library" href="#/library"><span class="nav-icon">▣</span>Библиотека</a><div class="nav-divider"></div>${modules.map((m,i) => `<a class="nav-item" data-nav="${m.id}" href="${moduleLink(m)}"><span class="nav-icon">${icons[i]}</span>${esc(labels[i])}<span class="nav-count">${m.entries.length}</span></a>`).join('')}`;
}
function breadcrumbs(text) { $('#breadcrumbs').innerHTML = `Курс <span>/</span> ${esc(text)}`; }
function activate(id) { document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === id)); }
function stats() {
  const total = allEntries.length, done = allEntries.filter(e => prefs.done[e.id]).length;
  return `<div class="stats"><div class="stat"><span class="stat-icon">▦</span><div><strong>${modules.length}</strong><small>разделов курса</small></div></div><div class="stat"><span class="stat-icon">◇</span><div><strong>${total}</strong><small>вопрос для изучения</small></div></div><div class="stat"><span class="stat-icon">✓</span><div><strong>${done} / ${total}</strong><small>отмечено изученным</small></div></div></div>`;
}
function home() {
  activate('home'); breadcrumbs('Обзор');
  $('#content').innerHTML = `<div class="hero"><span class="eyebrow">ВАШ МАРШРУТ В JAVA-РАЗРАБОТКУ</span><h1>Учитесь глубже.<br>Вспоминайте быстрее.</h1><p>Вопросы из реальной подборки для собеседований, конспекты и практика — структурированы в одном месте. Начните с основ или сразу найдите нужный ответ.</p><div class="hero-actions"><a class="btn btn-primary" href="#/module/1">Начать изучение →</a><a class="btn btn-light" href="#/practice">Режим практики ↗</a><a class="btn btn-light" href="#/cheats">Быстрые таблицы ↗</a></div></div>${stats()}${section('Путь обучения','Проходите по порядку или выбирайте тему, которая нужна прямо сейчас.')}<div class="module-grid">${modules.map((m,i) => `<a class="module-card" href="${moduleLink(m)}"><div class="card-head"><span class="module-icon">${icons[i]}</span><span class="module-index">${String(i+1).padStart(2,'0')} / 11</span></div><h3>${esc(labels[i])}</h3><p>${esc(descriptions[i])}</p><div class="progress-track"><i style="width:${m.entries.length ? 100*countDone(m)/m.entries.length : 0}%"></i></div><footer><span>${m.entries.length} вопросов</span><span>${countDone(m)} изучено →</span></footer></a>`).join('')}</div>`;
}
function row(e) { return `<a class="section-row" href="${entryLink(e)}"><span class="row-state ${prefs.done[e.id]?'done':''}">${prefs.done[e.id]?'✓':'○'}</span><span class="row-body"><span class="row-title">${esc(e.title)}</span><span class="row-meta">${esc(category(e,moduleOf(e).id))} · ${esc(e.cell)}${!e.answer?' · без ответа':''}</span></span><span class="row-arrow">↗</span></a>`; }
function modulePage(id) {
  const m = modules.find(x => x.id === id); if (!m) return notFound();
  activate(id); breadcrumbs(labels[Number(id)-1]);
  const grouped = new Map(); m.entries.forEach(e => { const key = e.section || category(e,id); if (!grouped.has(key)) grouped.set(key,[]); grouped.get(key).push(e); });
  const src = sourceFor(id);
  $('#content').innerHTML = `<div class="page-header"><div><span class="eyebrow">РАЗДЕЛ ${String(id).padStart(2,'0')} / 11 · ${m.entries.length} ВОПРОСОВ</span><h1>${esc(labels[Number(id)-1])}</h1><p>${esc(descriptions[Number(id)-1])}</p></div><a class="btn btn-outline" href="#/practice/${id}">Тренировать ответы ↗</a></div><div class="split"><div>${[...grouped].map(([name,entries]) => `<section class="panel"><div class="panel-head"><h2>${esc(name)}</h2><span class="tag">${entries.length}</span></div><div class="section-list">${entries.map(row).join('')}</div></section>`).join('')}</div><aside><section class="panel"><h3>Ваш прогресс</h3><div class="progress-track"><i style="width:${100*countDone(m)/m.entries.length}%"></i></div><p class="muted" style="font-size:12px">${countDone(m)} из ${m.entries.length} вопросов изучено</p></section><section class="panel"><div class="panel-head"><h3>Материалы по теме</h3><span class="tag">${src.length}</span></div>${src.map(s => `<a class="small-source" href="#/source/${s.id}">${esc(s.name)}<span>${s.type}${s.pages ? ' · '+s.pages+' стр.' : ''}</span></a>`).join('')}</section>${id === '9' ? `<section class="panel"><h3>Микросервисы</h3><p class="muted" style="font-size:12px;line-height:1.6">Отдельный набор конспектов об архитектуре, взаимодействии сервисов и паттернах.</p><a class="text-link" href="#/source/${sources.find(s=>s.name==='Microservices.pdf')?.id}">Открыть конспект →</a></section>` : ''}</aside></div>`;
}
function questionPage(id) {
  const e = allEntries.find(x => x.id === id); if (!e) return notFound();
  const m = moduleOf(e), ix = m.entries.indexOf(e), src = sourceFor(m.id).filter(s => s.type !== 'XLSX');
  const pages = (e.references || []).map(ref => ({source:sources.find(s=>s.id===ref.source),page:ref.page})).filter(ref=>ref.source);
  activate(m.id); breadcrumbs(labels[Number(m.id)-1] + ' / Вопрос ' + e.row);
  const preview = e.answer.trim().split(/\n\s*\n/)[0] || '';
  $('#content').innerHTML = `<div class="page-header"><div><a class="back-link" href="${moduleLink(m)}">← ${esc(labels[Number(m.id)-1])}</a><div style="margin-top:19px"><span class="tag">${esc(category(e,m.id))}</span> <span class="tag amber">${esc(e.cell)}</span></div><h1 class="question-title">${esc(e.title)}</h1></div></div><div class="detail-layout"><div class="detail-main"><section class="panel"><div class="panel-head"><h2>Коротко по сути</h2><span class="tag green">ШПАРГАЛКА</span></div>${preview ? `<p class="answer-preview">${esc(truncate(preview,380))}</p>` : `<div class="empty-answer">В исходной таблице нет ответа на этот вопрос. Откройте связанные материалы для самостоятельного изучения.</div>`}<div class="action-strip"><button data-action="done" data-id="${e.id}" class="${prefs.done[e.id]?'selected':''}">${prefs.done[e.id]?'✓ Изучено':'○ Отметить изученным'}</button><button data-action="repeat" data-id="${e.id}" class="${prefs.repeat[e.id]?'selected':''}">↻ ${prefs.repeat[e.id]?'На повторении':'Повторить позже'}</button><button data-action="star" data-id="${e.id}" class="${prefs.star[e.id]?'starred':''}">${prefs.star[e.id]?'★ В избранном':'☆ В избранное'}</button></div></section><section class="panel"><div class="panel-head"><h2>Ответ из конспекта</h2><span class="tag">${esc(m.name)} · B${e.row}</span></div>${e.answer ? `<div class="answer-text answer-short" id="full-answer">${esc(e.answer)}</div><button class="inline-action" id="expand-answer">Показать ответ полностью ↓</button>` : `<div class="empty-answer">Ответ в исходной ячейке отсутствует.</div>`}${Object.keys(e.extra).length ? `<div class="source-hint">Дополнительные поля исходной строки: ${Object.entries(e.extra).map(([k,v])=>`<strong>${esc(k)}:</strong> ${esc(truncate(v,220))}`).join(' · ')}</div>` : ''}<div class="source-hint">Исходник: <a class="text-link" href="${asset('Java Подготовка к интервью.xlsx')}" download>${esc(e.cell)} · скачать Excel ↗</a>. Текст сохранён как в таблице; проверяйте версии Java и библиотек в исторических заметках.</div></section>${m.id === '10' ? `<section class="panel"><h2>Ваше решение</h2><p class="muted" style="font-size:12px">Черновик сохраняется локально. Запуск кода в браузере не предусмотрен.</p><textarea class="code-input" id="code-note" spellcheck="false" aria-label="Черновик Java-решения" placeholder="// Напишите решение здесь…">${esc(prefs.code[e.id]||'')}</textarea></section>` : ''}<section class="panel"><h3>Личные заметки</h3><p class="muted" style="font-size:12px">Сохраняются в этом браузере по мере ввода.</p><textarea class="notes" id="note" aria-label="Заметки по вопросу" placeholder="Свой пример, мнемоника, что повторить…">${esc(prefs.notes[e.id]||'')}</textarea></section><div class="practice-controls">${ix>0?`<a class="btn btn-outline" href="${entryLink(m.entries[ix-1])}">← Предыдущий</a>`:''}${ix<m.entries.length-1?`<a class="btn btn-outline" href="${entryLink(m.entries[ix+1])}">Следующий вопрос →</a>`:''}</div></div><aside><section class="panel"><h3>Вопрос в контексте</h3><div class="meta-list">Раздел: <strong>${esc(labels[Number(m.id)-1])}</strong><br>Категория: <strong>${esc(category(e,m.id))}</strong><br>Лист / строка: <strong>${esc(e.cell)}</strong></div><a class="text-link" href="#/practice/${m.id}">Тренировать тему →</a></section>${pages.length?`<section class="panel"><h3>Страницы по вопросу</h3><p class="muted" style="font-size:11px;line-height:1.5">Совпадение по формулировке вопроса; проверьте содержимое страницы.</p>${pages.map(ref=>`<a class="source-link" target="_blank" rel="noopener" href="${original(ref.source)}#page=${ref.page}">${esc(ref.source.name)} · стр. ${ref.page} ↗</a>`).join('')}</section>`:''}<section class="panel"><div class="panel-head"><h3>Связанные источники</h3><span class="tag">${src.length}</span></div><p class="muted" style="font-size:11px;line-height:1.5">Документы раздела. Для точного места используйте поиск внутри оригинала.</p>${src.map(s=>`<a class="source-link" href="#/source/${s.id}"><span>${esc(s.name)}<br><small>${s.type}${s.pages?' · '+s.pages+' стр.':''}</small></span>↗</a>`).join('')}</section></aside></div>`;
  $('#note').addEventListener('input',ev=>{prefs.notes[e.id]=ev.target.value;save();});
  $('#code-note')?.addEventListener('input',ev=>{prefs.code[e.id]=ev.target.value;save();});
  $('#expand-answer')?.addEventListener('click',ev=>{const box=$('#full-answer');box.classList.toggle('answer-short');ev.target.textContent=box.classList.contains('answer-short')?'Показать ответ полностью ↓':'Свернуть ↑';});
}
function library() {
  activate('library'); breadcrumbs('Библиотека');
  const filtered = libraryFilter === 'all' ? sources : sources.filter(s => s.modules.includes(libraryFilter));
  $('#content').innerHTML = `<div class="page-header"><div><span class="eyebrow">ПЕРВОИСТОЧНИКИ</span><h1>Библиотека материалов</h1><p>Все ${sources.length} оригинальных файла и их извлечённый текст. PDF доступны для просмотра в браузере.</p></div></div><div class="filter-bar"><button class="filter ${libraryFilter==='all'?'active':''}" data-filter="all">Все · ${sources.length}</button>${modules.map((m,i)=>`<button class="filter ${libraryFilter===m.id?'active':''}" data-filter="${m.id}">${esc(labels[i])}</button>`).join('')}</div><div class="library-grid">${filtered.map(s=>`<article class="library-card"><span class="file-icon">${s.type}</span><div><h3>${esc(s.name)}</h3><p>${esc(s.path)}${s.pages?' · '+s.pages+' стр.':''}</p><a href="#/source/${s.id}">Читать текст →</a><a href="${original(s)}" target="_blank" rel="noopener">Оригинал ↗</a></div></article>`).join('')}</div>`;
}
function savedPage() {
  activate('saved'); breadcrumbs('Избранное и повторение');
  const starred=allEntries.filter(e=>prefs.star[e.id]), repeat=allEntries.filter(e=>prefs.repeat[e.id]);
  $('#content').innerHTML=`<div class="page-header"><div><span class="eyebrow">ВАШ СПИСОК</span><h1>Избранное и повторение</h1><p>Выбранные вопросы сохраняются в этом браузере.</p></div></div><div class="split"><div><section class="panel"><div class="panel-head"><h2>☆ Избранное</h2><span class="tag">${starred.length}</span></div>${starred.length?starred.map(row).join(''):'<div class="empty-state">Отмечайте интересные вопросы звездой на их карточках.</div>'}</section><section class="panel"><div class="panel-head"><h2>↻ Повторить позже</h2><span class="tag">${repeat.length}</span></div>${repeat.length?repeat.map(row).join(''):'<div class="empty-state">Добавьте сложные вопросы в список повторения.</div>'}</section></div><aside class="panel"><h3>Продолжить тренировку</h3><p class="muted" style="font-size:12px;line-height:1.6">Сверяйте свои ответы с первоисточником в режиме практики.</p><a class="text-link" href="#/practice">Перейти к вопросам →</a></aside></div>`;
}
function cheatsPage() {
  activate('cheats'); breadcrumbs('Быстрые таблицы');
  const table=(headers,rows)=>`<div class="table-scroll"><table class="cheat-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const blocks=[
    ['Коллекции и Big O','2',['Структура','Доступ / поиск','Добавление / удаление'],[['ArrayList','по индексу O(1); поиск O(n)','в конец амортиз. O(1); в середину O(n)'],['LinkedList','поиск / индекс O(n)','у известного узла O(1); поиск узла O(n)'],['HashMap','по ключу в среднем O(1)','в среднем O(1); худший случай зависит от коллизий'],['TreeMap','по ключу O(log n)','O(log n)'],['HashSet','проверка в среднем O(1)','в среднем O(1)']]],
    ['SQL JOIN','4',['Тип','Что возвращает'],[['INNER JOIN','Только совпавшие строки обеих таблиц'],['LEFT JOIN','Все строки слева и совпавшие справа; иначе NULL справа'],['RIGHT JOIN','Все строки справа и совпавшие слева; иначе NULL слева'],['FULL OUTER JOIN','Все строки обеих сторон; где нет пары — NULL']]],
    ['Уровни изоляции','4',['Уровень','Кратко'],[['READ UNCOMMITTED','Допускает чтение незакоммиченных изменений (если поддерживается СУБД)'],['READ COMMITTED','Не допускает грязное чтение; повторное чтение может отличаться'],['REPEATABLE READ','Стабилизирует повторное чтение строки; детали фантомов зависят от СУБД'],['SERIALIZABLE','Эффект последовательного выполнения транзакций, максимальная изоляция']]],
    ['Жизненный цикл JPA Entity','5',['Состояние','Значение'],[['New / Transient','Объект создан, но не связан с persistence context'],['Managed','Отслеживается контекстом; изменения могут попасть в БД при flush'],['Detached','Был управляемым, но больше не отслеживается текущим контекстом'],['Removed','Помечен к удалению; SQL DELETE выполняется при синхронизации']]],
    ['Аннотации Spring','6',['Аннотация','Назначение'],[['@Component','Обнаруживаемый компонент приложения'],['@Service / @Repository','Специализированные компоненты сервиса / доступа к данным'],['@Bean','Регистрация бина методом конфигурации'],['@Autowired / @Qualifier','Внедрение зависимости / уточнение кандидата'],['@Transactional','Декларативная граница транзакции через инфраструктуру Spring'],['@RestController','Контроллер с сериализацией возвращаемого значения в HTTP-ответ']]]
  ];
  const refs=sources.filter(s=>['Коллекции.pdf','Algorithms_BigO.pdf','Задача N plus One.pdf'].includes(s.name));
  $('#content').innerHTML=`<div class="page-header"><div><span class="eyebrow">КОРОТКО И ПО ДЕЛУ</span><h1>Быстрые таблицы</h1><p>Опорные схемы для повторения. Условия и исключения разбираются в вопросах и оригинальных конспектах.</p></div></div><div class="split"><div>${blocks.map(([title,id,headers,rows])=>`<section class="panel"><div class="panel-head"><h2>${esc(title)}</h2><a class="text-link" href="#/module/${id}">К разделу →</a></div>${table(headers,rows)}</section>`).join('')}</div><aside class="panel"><h3>Исходные справочники</h3>${refs.map(s=>`<a class="small-source" href="#/source/${s.id}">${esc(s.name)}<span>${esc(s.path)}</span></a>`).join('')}<p class="muted" style="font-size:12px;line-height:1.6">Таблицы — краткие редакционные памятки; оригиналы доступны по ссылкам. Поддержка функций SQL и детали алгоритмов зависят от реализации.</p></aside></div>`;
}
function sourcePage(id) {
  const s = sources.find(x=>x.id===id); if (!s) return notFound();
  activate('library'); breadcrumbs('Библиотека / ' + s.name);
  $('#content').innerHTML = `<div class="page-header"><div><a class="back-link" href="#/library">← Все материалы</a><h1>${esc(s.name)}</h1><p>${esc(s.path)} · ${s.type}${s.pages?' · '+s.pages+' страниц':''}</p></div><a class="btn btn-primary" href="${original(s)}" target="_blank" rel="noopener">Открыть оригинал ↗</a></div><div class="split"><section class="panel"><div class="panel-head"><h2>Текст материала</h2><span class="tag">${s.type}</span></div>${s.type==='PDF'?'<p class="source-hint">Для таблиц, схем и изображений сверьтесь с оригинальным PDF. Номера страниц указаны в извлечённом тексте.</p>':''}<div class="reader">${esc(s.text)}</div></section><aside><section class="panel"><h3>Связанные разделы</h3>${s.modules.map(id=>`<a class="small-source" href="#/module/${id}">${esc(labels[Number(id)-1])} →</a>`).join('')}</section><section class="panel"><h3>Исходный файл</h3><p class="muted" style="font-size:12px;line-height:1.6">Формат ${s.type}. Откройте или сохраните документ для просмотра в исходном виде.</p><a class="text-link" href="${original(s)}" target="_blank" rel="noopener">Открыть файл ↗</a></section></aside></div>`;
}
function practice(id = 'all') {
  practiceModule=id; activate('practice'); breadcrumbs('Практика');
  const pool = id==='all' ? allEntries : modules.find(m=>m.id===id)?.entries || allEntries;
  const e=pool[practiceIndex%pool.length];
  $('#content').innerHTML=`<div class="page-header"><div><span class="eyebrow">ТРЕНИРОВКА ПЕРЕД СОБЕСЕДОВАНИЕМ</span><h1>Вспомните ответ сами</h1><p>Прочитайте вопрос, сформулируйте ответ, затем сверяйтесь с исходным конспектом.</p></div></div><div class="filter-bar"><button class="filter ${id==='all'?'active':''}" data-practice="all">Все темы</button>${modules.map((m,i)=>`<button class="filter ${id===m.id?'active':''}" data-practice="${m.id}">${esc(labels[i])}</button>`).join('')}</div><div class="split"><section class="panel"><div class="panel-head"><span class="tag">${esc(moduleOf(e).name)}</span><span class="practice-counter">${practiceIndex%pool.length+1} / ${pool.length}</span></div><div class="practice-question">${esc(e.title)}</div>${practiceOpen?(e.answer?`<div class="practice-answer">${esc(e.answer)}</div>`:`<div class="empty-answer">В исходнике ответ не заполнен. Изучите связанные материалы.</div>`):`<div class="empty-answer">Попробуйте ответить вслух или мысленно, прежде чем открыть ответ.</div>`}<div class="practice-controls">${!practiceOpen?'<button class="btn btn-primary" id="reveal">Показать ответ ↓</button>':`<button class="btn btn-outline" data-action="done" data-id="${e.id}">${prefs.done[e.id]?'✓ Изучено':'✓ Я знаю ответ'}</button>`}<button class="btn btn-outline" id="next">Следующий →</button><a class="btn btn-outline" href="${entryLink(e)}">Открыть карточку ↗</a></div></section><aside><section class="panel"><h3>Быстрый доступ</h3><p class="muted" style="font-size:12px;line-height:1.6">Ответы взяты из Excel. Развёрнутые конспекты доступны по ссылкам на каждой карточке.</p><a class="text-link" href="#/library">Открыть библиотеку →</a></section></aside></div>`;
  $('#reveal')?.addEventListener('click',()=>{practiceOpen=true;practice(id)});
  $('#next').addEventListener('click',()=>{practiceIndex++;practiceOpen=false;practice(id)});
}
function searchPage(query) {
  activate(''); breadcrumbs('Поиск');
  const q=query.toLocaleLowerCase('ru').trim();
  const matches=q?allEntries.filter(e=>(e.title+' '+e.answer).toLocaleLowerCase('ru').includes(q)):[];
  const docs=q?sources.filter(s=>(s.name+' '+s.text).toLocaleLowerCase('ru').includes(q)):[];
  const excerpt = text => {const pos=text.toLocaleLowerCase('ru').indexOf(q);return pos<0?'':truncate(text.slice(Math.max(0,pos-55),pos+150).replace(/\s+/g,' '),195);};
  $('#content').innerHTML=`<div class="page-header"><div><span class="eyebrow">ПОИСК ПО ВСЕМ МАТЕРИАЛАМ</span><h1>${q?'Результаты поиска':'Что ищем?'}</h1><p>${q?`По запросу «${esc(query)}» найдено ${matches.length} вопросов и ${docs.length} материалов.`:'Введите тему, вопрос или термин в поле поиска сверху.'}</p></div></div>${q?`<div class="split"><div>${section('Вопросы',`${matches.length} совпадений`)}${matches.slice(0,150).map(e=>`<a class="result-card" href="${entryLink(e)}"><span class="tag">${esc(moduleOf(e).name)}</span><strong>${esc(e.title)}</strong><p>${esc(truncate(e.answer.replace(/\s+/g,' '),180))}</p></a>`).join('')||'<div class="empty-state">Вопросы не найдены.</div>'}${matches.length>150?'<p class="muted">Показаны первые 150 результатов; уточните запрос.</p>':''}</div><aside class="panel"><h3>Материалы (${docs.length})</h3>${docs.map(s=>`<a class="small-source" href="#/source/${s.id}">${esc(s.name)}<span>${s.type} · ${esc(s.path)}${excerpt(s.text)?' · «'+esc(excerpt(s.text))+'»':''}</span></a>`).join('')||'<p class="muted">Совпадений нет.</p>'}</aside></div>`:''}`;
}
function notFound() { $('#content').innerHTML='<div class="empty-state">Страница не найдена. <a class="text-link" href="#/">На главную →</a></div>'; }
function route() {
  const [rawPath, querystring='']=(location.hash.slice(1) || '/').split('?');
  const parts=decodeURIComponent(rawPath).split('/').filter(Boolean);
  if (!parts.length) home();
  else if(parts[0]==='module') modulePage(parts[1]);
  else if(parts[0]==='question') questionPage(parts[1]);
  else if(parts[0]==='library') library();
  else if(parts[0]==='cheats') cheatsPage();
  else if(parts[0]==='saved') savedPage();
  else if(parts[0]==='source') sourcePage(parts[1]);
  else if(parts[0]==='practice'){practiceIndex=0;practiceOpen=false;practice(parts[1]||'all');}
  else if(parts[0]==='search') searchPage(new URLSearchParams(querystring).get('q')||'');
  else notFound();
  const searchParam=parts[0]==='search'?new URLSearchParams(querystring).get('q')||'':'';
  if ($('#search').value!==searchParam) $('#search').value=searchParam;
  $('#sidebar').classList.remove('open');$('#sidebar-backdrop').classList.remove('open');
  window.scrollTo(0,0);
}
document.addEventListener('click',ev=>{
  const button=ev.target.closest('[data-action]');if(!button)return;
  const {action,id}=button.dataset; prefs[action][id]=!prefs[action][id];save();
  if(location.hash.startsWith('#/question/'))questionPage(id);
  else if(location.hash.startsWith('#/practice/'))practice(practiceModule);
});
document.addEventListener('click',ev=>{
  const filter=ev.target.closest('[data-filter]');if(filter){libraryFilter=filter.dataset.filter;library();}
  const practiceFilter=ev.target.closest('[data-practice]');if(practiceFilter){practiceIndex=0;practiceOpen=false;location.hash=`/practice/${practiceFilter.dataset.practice}`;if(location.hash===`#/practice/${practiceFilter.dataset.practice}`)practice(practiceFilter.dataset.practice);}
});
$('#menu-btn').addEventListener('click',()=>{$('#sidebar').classList.toggle('open');$('#sidebar-backdrop').classList.toggle('open');});
$('#sidebar-backdrop').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#sidebar-backdrop').classList.remove('open');});
$('#library-btn').addEventListener('click',()=>location.hash='/library');
let searchTimer;
$('#search').addEventListener('input',ev=>{const query=ev.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{location.hash=query?'#/search?q='+encodeURIComponent(query):'#/';if(location.hash.startsWith('#/search'))searchPage(query);},240);});
document.addEventListener('keydown',ev=>{if(ev.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)){ev.preventDefault();$('#search').focus();}if(ev.key==='Escape'&&document.activeElement===$('#search'))$('#search').blur();});
window.addEventListener('hashchange',route);
fetch('/data.json').then(r=>{if(!r.ok)throw new Error('data.json');return r.json();}).then(payload=>{data=payload;modules=data.modules;sources=data.sources;allEntries=modules.flatMap(m=>m.entries);nav();route();}).catch(error=>{$('#content').innerHTML=`<div class="empty-state">Не удалось загрузить материалы (${esc(error.message)}). Запустите <code>python3 build.py</code>, затем <code>python3 server.py</code>.</div>`;});
