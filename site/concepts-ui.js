/* Definitions-first route, kept separate from the imported Excel workbook. */
(() => {
  const topics = window.techTopics;
  const questions = topics.flatMap(topic => topic.groups.flatMap(group => group.questions.map((question, index) => ({...question, topic, group, index}))));
  const escape = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const topicLink = topic => `#/topic/${topic.id}`;
  const questionLink = question => `#/concept/${question.id}`;
  const topicQuestions = topic => questions.filter(question => question.topic === topic);
  const saved = prefs => prefs.conceptDone || {};
  const count = (topic,prefs) => topicQuestions(topic).filter(question => saved(prefs)[question.id]).length;
  const sourceLinks = (topic,data) => {
    const originals = topic.sources.map(name => data.sources.find(source => source.name === name)).filter(Boolean);
    return [...originals.map(source => `<a class="small-source" href="#/source/${escape(source.id)}">${escape(source.name)} <span>Оригинальный материал →</span></a>`),
      ...topic.docs.map(([name,url]) => `<a class="small-source" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(name)} <span>Документация ↗</span></a>`) ].join('');
  };
  const workbookLinks = (topic,data) => topic.excel.map(id => {
    const module = data.modules.find(item => item.id === id);
    return module ? `<a class="small-source" href="#/module/${id}">${escape(module.name)} <span>Вопросы Excel →</span></a>` : '';
  }).join('');
  const labLinks = topic => topic.labs.map(id => {
    const lesson = window.JavaLearning.byId(id);
    return lesson ? `<a class="small-source" href="#/lesson/${id}">${escape(lesson.title)} <span>Углубление и модель →</span></a>` : '';
  }).join('');
  function catalog(prefs) {
    const total = questions.length, completed = questions.filter(question => saved(prefs)[question.id]).length;
    return `<div class="learning-hero"><span class="eyebrow">АРХИТЕКТУРА И ПРОМЫШЛЕННЫЙ JAVA-СТЕК</span><h1>Начните с вопроса</h1><p>Каждая тема начинается с определения. Читайте короткий ответ, разбирайте пример, проверяйте себя — затем переходите к следующему вопросу. Интерактивные модели доступны после основ.</p><a class="btn btn-primary" href="${questionLink(questions.find(q => !saved(prefs)[q.id]) || questions[0])}">Продолжить с вопроса →</a><span class="learning-progress">${completed} / ${total} вопросов изучено</span></div><div class="learning-grid">${topics.map(topic => `<a class="learning-card" href="${topicLink(topic)}"><span class="learning-icon">${escape(topic.icon)}</span><span class="tag ${count(topic,prefs)===topicQuestions(topic).length?'green':''}">${count(topic,prefs)} / ${topicQuestions(topic).length} вопросов</span><h3>${escape(topic.title)}</h3><p>${escape(topic.summary)}</p><small>Начать с определения →</small></a>`).join('')}</div><section class="learning-section panel"><h2>После определений — практика</h2><p>Каждый раздел ведёт к подходящим интерактивным моделям. Большую карту стека используйте, когда освоите отдельные инструменты.</p><a class="text-link" href="#/lesson/stack">Карта и итоговый сценарий →</a></section>`;
  }
  function topicPage(id,prefs,data) {
    const topic = topics.find(t => t.id === id); if(!topic) return null;
    const first = topicQuestions(topic).find(question => !saved(prefs)[question.id]) || topicQuestions(topic)[0];
    return `<div class="page-header"><div><a class="back-link" href="#/learn">← Все темы</a><div class="lesson-title-row"><span class="learning-icon">${escape(topic.icon)}</span><span class="eyebrow">${count(topic,prefs)} / ${topicQuestions(topic).length} ВОПРОСОВ ИЗУЧЕНО</span></div><h1>${escape(topic.title)}</h1><p>${escape(topic.summary)}</p><a class="btn btn-primary" href="${questionLink(first)}">${count(topic,prefs)?'Продолжить':'Первый вопрос'} →</a></div></div><div class="detail-layout"><div class="detail-main">${topic.groups.map(group => `<section class="panel"><div class="panel-head"><h2>${escape(group.name)}</h2><span class="tag">${group.questions.length}</span></div><div class="section-list">${group.questions.map(question => `<a class="section-row" href="${questionLink(question)}"><span class="row-state ${saved(prefs)[question.id]?'done':''}">${saved(prefs)[question.id]?'✓':'○'}</span><span class="row-body"><span class="row-title">${escape(question.title)}</span><span class="row-meta">${escape(question.brief)}</span></span><span class="row-arrow">↗</span></a>`).join('')}</div></section>`).join('')}<section class="panel"><h2>Применить знания</h2><p>После вопросов попробуйте изменить параметры в моделях и объяснить результат.</p>${labLinks(topic)}</section></div><aside><section class="panel"><h3>Связь с Excel</h3>${workbookLinks(topic,data)}</section><section class="panel"><h3>Источники</h3>${sourceLinks(topic,data)}</section></aside></div>`;
  }
  function questionPage(id,prefs,data) {
    const question = questions.find(q => q.id === id); if(!question) return null;
    const siblings = topicQuestions(question.topic), position = siblings.indexOf(question);
    const previous = siblings[position-1], next = siblings[position+1];
    const choices = position % 2 ? [['wrong',question.wrong],['right',question.brief]] : [['right',question.brief],['wrong',question.wrong]];
    return `<div class="page-header"><div><a class="back-link" href="${topicLink(question.topic)}">← ${escape(question.topic.title)}</a><div class="lesson-title-row"><span class="tag">${escape(question.group.name)}</span><span class="tag">ВОПРОС ${position+1} / ${siblings.length}</span></div><h1>${escape(question.title)}</h1></div></div><div class="detail-layout"><div class="detail-main"><section class="panel concept-answer"><span class="eyebrow">КРАТКО · ШПАРГАЛКА</span><p class="concept-brief">${escape(question.brief)}</p><h2>Разберём по шагам</h2><p>${escape(question.detail)}</p><h3>Небольшой пример</h3><pre class="lesson-code"><code>${escape(question.example)}</code></pre><h3>Типичная ошибка</h3><p class="lesson-note">${escape(question.misconception)}</p></section><section class="panel concept-check"><span class="eyebrow">САМОПРОВЕРКА</span><h2>Какое утверждение верно?</h2><div class="quiz-answers">${choices.map(([kind,text])=>`<button type="button" class="quiz-choice" data-concept-choice="${kind}">${escape(text)}</button>`).join('')}</div><div id="concept-feedback" aria-live="polite"></div><button class="btn btn-primary" id="finish-concept" type="button" ${saved(prefs)[id]?'':'disabled'}>${saved(prefs)[id]?'✓ Вопрос изучен':'Отметить изученным'}</button></section><div class="practice-controls">${previous?`<a class="btn btn-outline" href="${questionLink(previous)}">← Предыдущий вопрос</a>`:''}${next?`<a class="btn btn-outline" href="${questionLink(next)}">Следующий вопрос →</a>`:`<a class="btn btn-outline" href="${topicLink(question.topic)}">К разделу →</a>`}</div></div><aside><section class="panel"><h3>Последовательность</h3><p class="muted">${escape(question.group.name)}</p>${siblings.slice(Math.max(0,position-2),Math.min(siblings.length,position+3)).map(item => `<a class="small-source ${item.id===id?'concept-current':''}" href="${questionLink(item)}">${saved(prefs)[item.id]?'✓ ':''}${escape(item.title)}</a>`).join('')}</section><section class="panel"><h3>Из Excel</h3>${workbookLinks(question.topic,data)}</section><section class="panel"><h3>Углубление и источники</h3>${labLinks(question.topic)}${sourceLinks(question.topic,data)}</section></aside></div>`;
  }
  function mount(id,prefs,save) {
    const question = questions.find(q => q.id === id); if(!question) return;
    document.querySelector('.concept-check')?.addEventListener('click', event => {
      const choice = event.target.closest('[data-concept-choice]');
      if(choice) {
        const correct = choice.dataset.conceptChoice === 'right';
        document.querySelectorAll('[data-concept-choice]').forEach(button => button.classList.toggle('chosen',button===choice));
        document.querySelector('#concept-feedback').innerHTML = `<p class="lab-feedback ${correct?'correct':'wrong'}">${correct?'Верно.':'Пока неверно.'} ${escape(correct?question.detail:question.misconception)}</p>`;
        document.querySelector('#finish-concept').disabled = !correct;
      }
      if(event.target.closest('#finish-concept') && !document.querySelector('#finish-concept').disabled) {
        prefs.conceptDone ||= {}; prefs.conceptDone[id] = true; save();
        document.querySelector('#finish-concept').textContent='✓ Вопрос изучен';
      }
    });
  }
  window.JavaConcepts = {topics,questions,catalog,topicPage,questionPage,mount};
})();
