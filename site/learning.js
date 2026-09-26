/* Interactive explanations are illustrative models, not running infrastructure. */
(() => {
  const lessons = window.courseLessons;
  const escape = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const byId = id => lessons.find(lesson => lesson.id === id);
  const link = id => `#/lesson/${id}`;
  const questionPatterns = {
    stack:/микросервис|http протокол|ci\/cd/i,architecture:/микросервис|saga/i,
    saga:/saga|транзакц/i,kafka:/обмен сообщениями|jms|очеред/i,
    kubernetes:/ci\/cd|maven/i,observability:/случаи утечки|http|gc/i,
    'postgres-index':/индекс|explain|оптимизац/i,
    'postgres-mvcc':/транзакц|изоляц|блокиров/i,
    'postgres-ops':/репликац|шардирован|транзакц/i,
    'hibernate-n1':/n\+1|fetch/i,delivery:/ci\/cd|maven/i,
    redis:/кэш|кеш|nosql/i,testing:/mock|spy|tdd/i,
    'java-memory':/сборщик мусора|stack и heap|ссылок/i,
    concurrency:/volatile|atomic|race condition/i,
    'spring-di':/ioc|внедрен|контейнер|transactional/i
  };
  const defaultStates = {
    stack:{stage:'request'}, architecture:{mode:'mono',failure:'none',latency:20},
    saga:{failure:'none',outbox:'yes',step:0}, kafka:{partitions:3,consumers:2,key:'order-42',commit:'after',crash:'no'},
    kubernetes:{replicas:3,capacity:4,failed:'no',update:'no'}, index:{rows:100000,match:1,index:'right'},
    mvcc:{isolation:'read',mode:'versions',step:0}, n1:{orders:20,strategy:'lazy',batch:10},
    observability:{incident:'sql',view:'metrics',diagnosis:''}, concurrency:{mode:'unsafe',step:0},
    redis:{invalidate:'no',elapsed:'before'},memory:{objects:3,retain:'yes',step:0},
    'spring-di':{implementations:'one',qualifier:'no',call:'external'},
    pool:{requests:8,connections:4,blocked:0}
  };
  let current = null, state = null;
  const control = (label, name, options) => `<label class="lab-field"><span>${escape(label)}</span><select data-setting="${name}">${options.map(([value,title])=>`<option value="${escape(value)}" ${String(state[name])===String(value)?'selected':''}>${escape(title)}</option>`).join('')}</select></label>`;
  const number = (label,name,min,max) => `<label class="lab-field"><span>${escape(label)}: <strong>${state[name]}</strong></span><input type="range" min="${min}" max="${max}" value="${state[name]}" data-setting="${name}"></label>`;
  const node = (label,cls='') => `<span class="lab-node ${cls}">${escape(label)}</span>`;
  const arrow = '<span class="lab-arrow" aria-hidden="true">→</span>';
  const output = (visual,explanation,extra='') => `<div class="lab-visual">${visual}</div><p class="lab-explain">${escape(explanation)}</p>${extra}`;
  const reset = '<button class="lab-reset" type="button" data-lab-action="reset">↺ Сбросить эксперимент</button>';
  const actions = (text='Следующий шаг →') => `<button class="btn btn-primary" type="button" data-lab-action="step">${escape(text)}</button>`;
  const badge = (text,kind='')=>`<span class="lab-badge ${kind}">${escape(text)}</span>`;
  const bars = items => `<div class="lab-bars">${items.map(([label,value,max])=>`<div class="lab-bar"><span>${escape(label)}</span><div><i style="width:${Math.max(2,Math.min(100,100*value/max))}%"></i></div><strong>${escape(value)}</strong></div>`).join('')}</div>`;
  function simulator(type) {
    const s=state;
    switch(type) {
      case 'stack': {
        const stages={
          request:{active:['app','data','messaging'],path:'Клиент → Spring Boot → PostgreSQL → Kafka → обработчик',why:'HTTP-запрос записывает заказ; событие позволяет другой части системы реагировать независимо. Redis нужен только при осмысленном сценарии кеширования.'},
          deploy:{active:['testing','ci','containers','infra'],path:'Коммит → тесты → образ → registry → Deployment → готовые Pod',why:'Pipeline проверяет код, образ фиксирует версию, Kubernetes сравнивает желаемое и фактическое состояние. Готовность Pod влияет на доступность сервиса.'},
          operate:{active:['app','metrics','infra'],path:'Spring / JVM → Micrometer → Prometheus → Grafana → алерт',why:'Micrometer инструментирует приложение; Prometheus собирает метрики; Grafana показывает их, Alertmanager отправляет уведомления.'},
          incident:{active:['metrics','traces','logs','data','infra'],path:'Алерт → метрика p95 → trace → span БД → лог с trace ID',why:'Один график показывает симптом, но причину ищут в конкретных traces и логах. Корреляция по trace ID связывает записи разных сервисов.'}
        };
        const p=stages[s.stage];
        const layers=[
          ['app','Приложение и API','Java · Spring Boot · Security · JPA','spring-di'],
          ['data','Данные','PostgreSQL · Redis · S3','postgres-index'],
          ['messaging','Интеграции','Kafka · RabbitMQ · Debezium','kafka'],
          ['containers','Контейнеры','Docker · Kubernetes · Helm','kubernetes'],
          ['ci','CI/CD','GitHub Actions · GitLab CI · Argo CD','delivery'],
          ['metrics','Метрики и алерты','Micrometer · Prometheus · Grafana','observability'],
          ['logs','Логи','ELK · Fluent Bit · Loki','observability'],
          ['traces','Трассировка','OpenTelemetry · Jaeger · Tempo','observability'],
          ['testing','Тестирование','JUnit · Mockito · Testcontainers','testing'],
          ['infra','Инфраструктура','Terraform · Ingress / Gateway API','delivery']
        ];
        return `<div class="lab-controls">${control('Этап работы приложения','stage',[['request','Запрос и данные'],['deploy','Развёртывание'],['operate','Эксплуатация'],['incident','Инцидент']])}</div>${output(`<div class="layer-grid">${layers.map(([key,name,tools,lesson])=>`<a class="layer-tile ${p.active.includes(key)?'lit':''}" href="#/lesson/${lesson}"><strong>${escape(name)}</strong><span>${escape(tools)}</span><small>К уроку ↗</small></a>`).join('')}</div><div class="lab-path">${escape(p.path)}</div>`,p.why)}${reset}`;
      }
      case 'architecture': {
        const modes={mono:['Один процесс','Заказы + оплата + склад → общая БД','Локальные вызовы и общий релиз'],modular:['Один процесс с контрактами','Модуль заказов | модуль оплаты | модуль склада','Границы кода яснее, но деплой по-прежнему общий'],micro:['Несколько сервисов','Orders API → Payment API → Stock API','Независимые релизы, сеть и раздельное владение данными']};
        const [title,path,base]=modes[s.mode];
        const failed=s.failure==='payment';
        const impact=failed?(s.mode==='micro'?'Платёжный сервис недоступен: заказ может остаться в состоянии ожидания/отказа; нужны таймаут и компенсация. Остальные сервисы могут продолжать часть работы.':'Сбой оплаты внутри общего развёртывания влияет на сценарий заказа; другие сценарии зависят от изоляции ошибок в коде.'):'Все зависимости отвечают: сценарий заказа завершается.';
        return `<div class="lab-controls">${control('Архитектура','mode',[['mono','Монолит'],['modular','Модульный монолит'],['micro','Микросервисы']])}${control('Оплата','failure',[['none','Доступна'],['payment','Сбой оплаты']])}${number('Сетевая задержка одного вызова, мс','latency',0,200)}</div>${output(`<div class="lab-path">${node('Клиент')}${arrow}${node(title,failed?'warning':'lit')}${arrow}${node('Данные')}</div><p>${escape(path)}</p>${badge(s.mode==='micro'?`~${Number(s.latency)*2} мс на два дополнительных сетевых перехода (упрощённо)`:'Межмодульные вызовы без сетевого перехода')}`,`${base}. ${impact} Упрощение: модель не учитывает реальные хвостовые задержки, кеш и ретраи.`)}${reset}`;
      }
      case 'saga': {
        const start=s.outbox==='yes'?'Атомарно записать заказ и outbox':'Записать заказ без outbox';
        const sequences={none:[start,'Опубликовать OrderCreated','Зарезервировать товар','Списать платёж','Подтвердить заказ'],payment:[start,'Опубликовать OrderCreated','Зарезервировать товар','Платёж отклонён','Компенсация: снять резерв и отменить заказ'],event:s.outbox==='yes'?['Атомарно записать заказ и outbox','Relay не смог опубликовать','Relay повторяет публикацию','Consumer получает событие (возможен дубль)','Продолжить обработку']:['Сохранить заказ (COMMIT)','Публикация события не удалась','Заказ есть, события нет','Нужна ручная сверка или механизм outbox']};
        const steps=sequences[s.failure];const shown=Math.min(s.step+1,steps.length);
        return `<div class="lab-controls">${control('Сценарий','failure',[['none','Без ошибки'],['payment','Платёж отклонён'],['event','Сбой публикации']])}${control('Transactional outbox','outbox',[['yes','Есть'],['no','Нет']])}</div>${output(`<ol class="lab-steps">${steps.map((t,i)=>`<li class="${i<shown?'active':''}">${escape(t)}</li>`).join('')}</ol>`,s.failure==='event'?(s.outbox==='yes'?'Событие и заказ записаны в одной БД. Relay повторит публикацию, но consumer должен выдерживать дубли.':'После COMMIT заказ остался без события: две независимые записи не атомарны.'):(s.failure==='payment'?'Компенсация — новая операция бизнес-процесса, не откат чужой транзакции.':'Saga продвигается через локальные транзакции и события.'),`${s.step<steps.length-1?actions():badge('Сценарий завершён','good')} ${reset}`)}`;
      }
      case 'kafka': {
        const n=Number(s.partitions),c=Number(s.consumers);
        const hash=[...s.key].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7);
        const target=s.key==='none'?0:hash%n;
        const assignment=Array.from({length:n},(_,p)=>p%Math.min(n,c));
        const diagram=Array.from({length:n},(_,p)=>`<div class="partition ${target===p?'chosen':''}"><strong>Партиция ${p}</strong><small>Consumer ${assignment[p]+1} · offset ${p===target?'42':'…'}</small>${p===target?badge(s.key==='none'?'запись без ключа':s.key,'good'):''}</div>`).join('');
        const duplicate=s.crash==='yes'&&s.commit==='after';
        const explanation=`${n} партиций, ${c} consumers: активны ${Math.min(n,c)}, без назначения ${Math.max(0,c-n)}. ${s.key==='none'?'Запись без ключа показана в партиции 0 для примера; реальный producer выбирает по своей стратегии.':`Ключ ${s.key} направлен в партицию ${target} по учебному хешу; Kafka Java producer использует собственный partitioner.`} ${s.crash==='yes'?(duplicate?'Consumer упал после обработки до commit: сообщение может прийти повторно.':'Commit сделан до обработки: при падении обработка может быть пропущена.'): 'Группа продолжает чтение. Порядок гарантирован внутри партиции, а не всего topic.'}`;
        return `<div class="lab-controls">${number('Партиций','partitions',1,6)}${number('Consumers в одной группе','consumers',1,6)}${control('Ключ записи','key',[['order-42','order-42'],['order-43','order-43'],['none','Без ключа']])}${control('Commit offset','commit',[['after','После обработки'],['before','До обработки']])}${control('Сбой consumer','crash',[['no','Нет'],['yes','После получения записи']])}</div>${output(`<div class="partitions">${diagram}</div>`,explanation)}${reset}`;
      }
      case 'kubernetes': {
        const desired=Number(s.replicas),running=Math.min(desired,Number(s.capacity)),unready=s.failed==='yes'?Math.min(1,running):0;
        const ready=running-unready;
        const pods=Array.from({length:desired},(_,i)=>node(i>=running?`Pod ${i+1}: Pending`:i<unready?`Pod ${i+1}: NotReady`:`Pod ${i+1}: Ready`,i>=running?'muted-node':i<unready?'warning':'lit')).join('');
        return `<div class="lab-controls">${number('Желаемые реплики','replicas',1,6)}${number('Вместимость node (Pod)','capacity',1,6)}${control('Отказ одного Pod','failed',[['no','Нет'],['yes','NotReady']])}${control('Rolling update','update',[['no','Нет'],['yes','Новая версия выкатывается']])}</div>${output(`<div class="lab-kube"><div>${node(`Deployment: desired ${desired}`,'lit')}${arrow}${node(`Running ${running}`)}${arrow}${node(`Service: ${ready} endpoint(s)`,ready?'lit':'warning')}</div><div class="stack-map">${pods}</div></div>`,`${desired-running} Pod не размещены из-за нехватки места, ${unready} запущенный Pod исключён из endpoint-ов. ${s.update==='yes'?'При rolling update новые Pod получают трафик только после readiness; при недостатке ресурсов обновление может ждать.':'Service выбирает только готовые endpoint-ы.'} Это учебная модель: реальные стратегии maxSurge/maxUnavailable и ограничения scheduler сложнее.`)}${reset}`;
      }
      case 'index': {
        const rows=Number(s.rows),fraction=Number(s.match)/100,selected=Math.max(1,Math.round(rows*fraction));
        const seq=rows,index=Math.round(Math.log2(rows)+selected*4);
        const suitable=s.index==='right';
        const choice=suitable&&index<seq?'Index Scan (условная оценка)':'Seq Scan (условная оценка)';
        return `<div class="lab-controls">${control('Размер таблицы','rows',[[1000,'1 000 строк'],[100000,'100 000 строк'],[1000000,'1 000 000 строк']])}${control('Доля подходящих строк','match',[[1,'1%'],[10,'10%'],[50,'50%']])}${control('Индекс','index',[['none','Отсутствует'],['right','(customer_id, created_at)'],['wrong','(created_at, customer_id) при фильтре только по customer_id']])}</div>${output(`${bars([['Последовательное чтение',seq,Math.max(seq,index)],['Индекс + строки',index,Math.max(seq,index)]])}<div class="lab-path">${badge(choice,suitable&&index<seq?'good':'')}${badge(`${selected.toLocaleString('ru')} подходящих строк`)}</div>`,`${suitable?'Индекс подходит под предикат customer_id.':'Для этого фильтра выбранный индекс не даёт простого поиска по ведущей колонке.'} Условная модель: Seq Scan ≈ число строк, Index Scan ≈ log₂(N) + 4×результат. Реальный PostgreSQL учитывает статистику, страницы, кэш, типы сканирования и LIMIT; проверяйте EXPLAIN (ANALYZE, BUFFERS).`)}${reset}`;
      }
      case 'mvcc': {
        const dead=s.mode==='deadlock';
        const steps=dead?['T1 берёт блокировку строки A','T2 берёт блокировку строки B','T1 ждёт строку B','T2 ждёт A → цикл ожидания; PostgreSQL отменяет одну транзакцию']:['T1: SELECT balance → 10','T2: UPDATE balance = 20; COMMIT',s.isolation==='read'?'T1: повторный SELECT → 20 (новый снимок)':'T1: повторный SELECT → 10 (снимок транзакции)','T1: COMMIT'];
        return `<div class="lab-controls">${control('Сценарий','mode',[['versions','Версии строки'],['deadlock','Дедлок']])}${control('Уровень T1','isolation',[['read','READ COMMITTED'],['repeat','REPEATABLE READ']])}</div>${output(`<div class="lab-path">${node('Транзакция T1','lit')}${arrow}${node('PostgreSQL')}${arrow}${node('Транзакция T2','lit')}</div><ol class="lab-steps">${steps.map((v,i)=>`<li class="${i<=s.step?'active':''}">${escape(v)}</li>`).join('')}</ol>`,dead?'Дедлок — цикл ожиданий; сервер прервёт одну транзакцию, её нужно обработать или повторить целиком.':'MVCC определяет видимость версий. В PostgreSQL Read Committed новый снимок берётся для каждого выражения; Repeatable Read удерживает снимок транзакции. Упрощение: здесь нет конкурирующих UPDATE одной строки.',`${s.step<steps.length-1?actions():badge('Сценарий завершён','good')} ${reset}`)}`;
      }
      case 'n1': {
        const n=Number(s.orders),b=Number(s.batch);
        const count=s.strategy==='lazy'?1+n:s.strategy==='join'?1:1+Math.ceil(n/b);
        const caveat=s.strategy==='lazy'?'Один SELECT по заказам и по одному SELECT на каждую связь.':s.strategy==='join'?'Один JOIN может вернуть много повторяющихся строк родителей; пагинация по to-many требует особого подхода.':`Один SELECT по заказам и ${Math.ceil(n/b)} запросов групповой загрузки при размере пачки ${b}.`;
        return `<div class="lab-controls">${number('Заказов','orders',1,60)}${control('Стратегия','strategy',[['lazy','Ленивая по одному'],['join','JOIN FETCH'],['batch','Batch fetch']])}${control('Размер пачки','batch',[[5,'5'],[10,'10'],[20,'20']])}</div>${output(`${bars([['Текущая стратегия',count,1+n],['1 + N без оптимизации',1+n,1+n]])}${node(`≈ ${count} SQL-запросов`,count>10?'warning':'lit')}`,`${caveat} Условная оценка для одной связи и N загруженных родителей; время запроса и число строк тоже нужно измерять.`)}${reset}`;
      }
      case 'observability': {
        const incidents={sql:{metrics:'p95 HTTP: 950 мс; ошибки: 2%; пул БД занят: 95%; Kafka lag: 0',traces:'orders-api 980 мс → PostgreSQL SELECT 830 мс; Kafka publish 12 мс',logs:'trace=abc service=orders-api SQL query took 830ms; wait_event=Lock',answer:'sql'},kafka:{metrics:'p95 HTTP: 110 мс; Kafka lag: 24 000; consumer throughput упал',traces:'orders-api 95 мс → Kafka publish 12 мс; consumer span 4 500 мс',logs:'trace=abc service=orders-consumer обработка повторяется после timeout',answer:'kafka'},pod:{metrics:'Ошибки HTTP: 28%; p95: 200 мс; ready replicas 1/3',traces:'orders-api: соединение с payment-api недоступно',logs:'pod=payment-2 readiness failed; CrashLoopBackOff',answer:'pod'}};
        const i=incidents[s.incident],views={metrics:i.metrics,traces:i.traces,logs:i.logs};
        const names={sql:'Ожидание блокировки / медленный SQL',kafka:'Отставание Kafka consumer',pod:'Недоступный Pod'};
        const feedback=s.diagnosis?`<p class="lab-feedback ${s.diagnosis===i.answer?'correct':'wrong'}">${s.diagnosis===i.answer?'Верно.':'Пока нет.'} Причина: ${escape(names[i.answer])}. Сопоставьте метрики, трассу и лог, прежде чем делать вывод.</p>`:'';
        return `<div class="lab-controls">${control('Инцидент','incident',[['sql','Алерт A'],['kafka','Алерт B'],['pod','Алерт C']])}${control('Исследовать','view',[['metrics','Метрики'],['traces','Traces'],['logs','Логи']])}</div>${output(`<div class="lab-signal"><strong>${escape(s.view==='metrics'?'Grafana / Prometheus':s.view==='traces'?'OpenTelemetry / Tempo':'ELK / Loki')}</strong><p>${escape(views[s.view])}</p></div><p>Предположите причину, затем проверьте все три сигнала:</p><div class="lab-choices">${Object.entries(names).map(([key,label])=>`<button type="button" data-lab-action="diagnose" data-value="${key}">${escape(label)}</button>`).join('')}</div>${feedback}`,'Метрики показывают масштаб симптома, trace локализует медленный span, лог содержит контекст конкретного события. Диагноз требует сопоставления сигналов.')}${reset}`;
      }
      case 'concurrency': {
        const unsafe=s.mode==='unsafe';const steps=unsafe?['counter = 0','T1 читает 0','T2 читает 0','T1 пишет 1','T2 пишет 1 → потеряно обновление']:['counter = 0','T1 выполняет атомарный increment → 1','T2 выполняет атомарный increment → 2'];
        return `<div class="lab-controls">${control('Реализация','mode',[['unsafe','volatile counter++'],['safe','AtomicInteger.incrementAndGet()']])}</div>${output(`<ol class="lab-steps">${steps.map((v,i)=>`<li class="${i<=s.step?'active':''}">${escape(v)}</li>`).join('')}</ol>${node(`Результат: ${unsafe&&s.step>=4?'1':!unsafe&&s.step>=2?'2':s.step>0?'в процессе':'0'}`,unsafe&&s.step>=4?'warning':'lit')}`,unsafe?'volatile делает отдельные значения видимыми, но инкремент состоит из отдельных чтения и записи. Здесь показано одно из возможных чередований.':'Атомарный инкремент даёт обоим потокам отдельное изменение счётчика.',`${s.step<steps.length-1?actions():badge('Сценарий завершён','good')} ${reset}`)}`;
      }
      case 'redis': {
        const expired=s.elapsed==='after',invalidated=s.invalidate==='yes';
        const value=expired||invalidated?'NEW (из PostgreSQL)':'OLD (из Redis)';
        return `<div class="lab-controls">${control('Инвалидация после обновления БД','invalidate',[['no','Не выполнена'],['yes','Выполнена']])}${control('Время после записи','elapsed',[['before','TTL ещё действует'],['after','TTL истёк']])}</div>${output(`<div class="lab-path">${node('PostgreSQL: NEW','lit')}${arrow}${node(`Redis: ${expired?'ключ истёк':invalidated?'ключ удалён':'OLD'}`,expired||invalidated?'lit':'warning')}${arrow}${node(`Читатель: ${value}`,expired||invalidated?'lit':'warning')}</div>`,expired||invalidated?'Промах в кеше ведёт к чтению новой версии из БД и повторному заполнению кеша.':'Кеш содержит устаревшее значение, хотя источник истины уже обновился. Укороченный TTL ограничивает период, но не заменяет продуманную инвалидацию.')}${reset}`;
      }
      case 'memory': {
        const count=Number(s.objects),held=s.retain==='yes',after=s.step>0;
        const roots=after?(held?count:0):count;
        return `<div class="lab-controls">${number('Создано объектов','objects',1,6)}${control('Сохранить ссылки в static CACHE','retain',[['yes','Да'],['no','Нет']])}</div>${output(`<div class="lab-path">${node(after?'Локальный метод завершён':'Активный метод / stack',after?'muted-node':'lit')}${arrow}${node(held?'static CACHE удерживает ссылки':'Нет static ссылок',held?'warning':'lit')}</div><div class="stack-map">${Array.from({length:count},(_,i)=>node(`объект ${i+1}`,roots>i?'lit':'muted-node')).join('')}</div>${badge(`Достижимы: ${roots} из ${count}`,roots?'':'good')}`,after?(held?'После выхода из метода объекты ещё достижимы через static CACHE, GC их не освободит.':'После выхода из метода и без других ссылок объекты становятся недостижимыми и могут быть собраны позднее.'):'Пока локальные ссылки в активном stack frame достижимы, объекты остаются в heap.',`${s.step===0?actions('Завершить метод →'):badge('Локальный метод завершён','good')} ${reset}`)}`;
      }
      case 'spring-di': {
        const ambiguous=s.implementations==='two'&&s.qualifier==='no';
        const proxy=s.call==='external';
        const explanation=ambiguous?'Две реализации интерфейса без указания кандидата делают внедрение неоднозначным: контекст не сможет собрать такой бин.':proxy?'Внешний вызов проходит через Spring-прокси; транзакционный advice может открыть транзакцию до вызова метода.':'Вызов this.save() внутри того же объекта обходит прокси в стандартной proxy-модели; advice @Transactional на save() не сработает.';
        return `<div class="lab-controls">${control('Реализаций репозитория','implementations',[['one','Одна'],['two','Две']])}${control('Выбор через @Qualifier','qualifier',[['no','Нет'],['yes','Да']])}${control('Вызов @Transactional save()','call',[['external','Из другого бина'],['self','Через this.save()']])}</div>${output(`<div class="lab-path">${node('OrderService',ambiguous?'warning':'lit')}${arrow}${node(ambiguous?'Неоднозначный Repository':'OrderRepository',ambiguous?'warning':'lit')}${arrow}${node(proxy?'Spring proxy → save()':'this.save() напрямую',proxy?'lit':'warning')}</div>`,explanation)}${reset}`;
      }
      case 'pool': {
        const requests=Number(s.requests),size=Number(s.connections),blocked=Math.min(Number(s.blocked),size);
        const running=Math.min(requests,size),waiting=Math.max(0,requests-running);
        return `<div class="lab-controls">${number('Параллельных запросов','requests',1,16)}${number('Размер пула HikariCP','connections',1,10)}${number('Соединений ждут блокировку','blocked',0,8)}</div>${output(`<div class="lab-path">${node(`${running} заняли соединение`,running?'lit':'')}${arrow}${node(`${Math.min(blocked,running)} ждут блокировку`,blocked?'warning':'')}${arrow}${node(`${waiting} ждут слот пула`,waiting?'warning':'lit')}</div>${bars([['Свободные слоты',Math.max(0,size-running),Math.max(size,1)],['Очередь запросов',waiting,Math.max(requests,1)]])}`,`${Math.min(blocked,running)} из ${running} занятых соединений не выполняют полезную работу, а ждут БД. ${waiting} HTTP-запросов ожидают слот и могут получить timeout. Упрощение: одновременные запросы, без учёта времени SQL и конфигурации ожидания.`)}${reset}`;
      }
      default: return '';
    }
  }
  function sourceLinks(lesson,data) {
    return (lesson.sources||[]).map(name=>{
      const source=data.sources.find(s=>s.name===name);
      return source?`<a class="lesson-source" href="#/source/${source.id}">${escape(name)} <span>Материал проекта ↗</span></a>`:'';
    }).join('')+(lesson.docs||[]).map(([title,url])=>`<a class="lesson-source" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(title)} <span>Документация ↗</span></a>`).join('');
  }
  function catalog(prefs) {
    const groups=[...new Set(lessons.map(l=>l.group))];
    const done=prefs.lessonDone||{};
    return `<div class="learning-hero"><span class="eyebrow">ПРАКТИКА ПОСЛЕ ВОПРОСОВ</span><h1>Интерактивные уроки</h1><p>Меняйте параметры моделей, когда познакомитесь с основными понятиями соответствующего раздела.</p><a class="btn btn-primary" href="#/learn">Начать с определений →</a><span class="learning-progress">${lessons.filter(l=>done[l.id]).length} / ${lessons.length} уроков пройдено</span></div>${groups.map(group=>`<section class="learning-section"><div class="section-heading"><div><h2>${escape(group)}</h2><p>Выберите эксперимент по изученной теме</p></div></div><div class="learning-grid">${lessons.filter(l=>l.group===group).map(l=>`<a class="learning-card" href="${link(l.id)}"><span class="learning-icon">${l.icon}</span><span class="tag ${done[l.id]?'green':''}">${done[l.id]?'✓ Пройден':'Урок · '+l.minutes+' мин'}</span><h3>${escape(l.title)}</h3><p>${escape(l.summary)}</p><small>${l.sim?'◉ Интерактивная модель · ':''}Самопроверка →</small></a>`).join('')}</div></section>`).join('')}`;
  }
  function lessonPage(id,prefs,data,save) {
    const lesson=byId(id);if(!lesson)return '<div class="empty-state">Урок не найден. <a href="#/learn">К маршруту →</a></div>';
    current=lesson; state={...(defaultStates[lesson.sim]||{})};
    prefs.lessonQuiz ||= {};prefs.lessonDone ||= {};
    const i=lessons.indexOf(lesson);
    const sections=lesson.sections.map((item,j)=>`<section class="panel lesson-section"><span class="eyebrow">РАЗБОР ${String(j+1).padStart(2,'0')}</span><h2>${escape(item.title)}</h2>${item.text.map(t=>`<p>${escape(t)}</p>`).join('')}${item.code?`<div class="code-title">ПРИМЕР · ${lesson.id==='kubernetes'?'YAML':lesson.id==='postgres-index'||lesson.id==='postgres-mvcc'?'SQL':'JAVA / СХЕМА'}</div><pre class="lesson-code"><code>${escape(item.code)}</code></pre>`:''}${item.note?`<p class="lesson-note">${escape(item.note)}</p>`:''}</section>`).join('');
    const src=sourceLinks(lesson,data);
    const pattern=questionPatterns[id];
    const relatedQuestions=data.modules.filter(m=>(lesson.related||[]).includes(m.id)).flatMap(m=>m.entries)
      .filter(e=>pattern?.test(e.title)).slice(0,4);
    const quiz=lesson.quiz;
    const selected=prefs.lessonQuiz[id];
    const aside=`<aside><section class="panel lesson-aside"><h3>В этом уроке</h3><ol>${lesson.sections.map((s,j)=>`<li><a href="#lesson-section-${j}" data-scroll="${j}">${escape(s.title)}</a></li>`).join('')}${lesson.sim?'<li><a href="#simulator" data-scroll="sim">Интерактивная модель</a></li>':''}<li><a href="#check" data-scroll="quiz">Самопроверка</a></li></ol></section><section class="panel lesson-aside"><h3>Связанные вопросы</h3>${relatedQuestions.map(e=>`<a class="small-source" href="#/question/${e.id}">${escape(e.title)} <span>${escape(e.cell)} →</span></a>`).join('')}${(lesson.related||[]).map(mid=>{const m=data.modules.find(x=>x.id===mid);return m?`<a class="small-source" href="#/module/${mid}">Все вопросы: ${escape(m.name)} →</a>`:'';}).join('')}<h3 style="margin-top:22px">Источники</h3>${src||'<p class="muted">Авторский урок; см. документацию ниже.</p>'}</section></aside>`;
    const html=`<div class="lesson-heading"><a class="back-link" href="#/learn">← Все темы</a><div class="lesson-title-row"><span class="learning-icon">${lesson.icon}</span><span class="eyebrow">${escape(lesson.group.toUpperCase())} · ${lesson.minutes} МИН · АВТОРСКИЙ УРОК</span></div><h1>${escape(lesson.title)}</h1><p>${escape(lesson.summary)}</p><div class="lesson-goals"><strong>После урока вы сможете</strong><ul>${lesson.goals.map(g=>`<li>${escape(g)}</li>`).join('')}</ul></div></div><div class="detail-layout"><div class="detail-main">${sections}${lesson.sim?`<section class="panel lesson-section" id="simulator"><span class="eyebrow">ЛАБОРАТОРИЯ · УЧЕБНАЯ МОДЕЛЬ</span><h2>Проверьте гипотезу</h2><p>Сначала предположите результат, затем измените параметры. Модель упрощает реальные системы — детали указаны под результатом.</p><div id="lesson-widget">${simulator(lesson.sim)}</div></section>`:''}<section class="panel lesson-section" id="check"><span class="eyebrow">САМОПРОВЕРКА</span><h2>Проверьте понимание</h2><p class="lesson-quiz-question">${escape(quiz.q)}</p><div class="quiz-answers">${quiz.choices.map((c,j)=>`<button type="button" class="quiz-choice ${selected===j?'chosen':''}" data-quiz="${j}">${escape(c)}</button>`).join('')}</div><div id="quiz-feedback" aria-live="polite">${selected!==undefined?`<p class="lab-feedback ${selected===quiz.correct?'correct':'wrong'}">${selected===quiz.correct?'Верно.':'Попробуйте ещё.'} ${escape(quiz.explain)}</p>`:''}</div><button class="btn btn-primary" id="finish-lesson" type="button" ${selected===quiz.correct?'':'disabled'}>${prefs.lessonDone[id]?'✓ Урок пройден':'Завершить урок'}</button><p id="finish-feedback" class="muted" aria-live="polite">${prefs.lessonDone[id]?'Прогресс сохранён в этом браузере.':''}</p></section><div class="practice-controls">${i>0?`<a class="btn btn-outline" href="${link(lessons[i-1].id)}">← Предыдущий урок</a>`:''}<a class="btn btn-outline" href="${link(lesson.next||lessons[(i+1)%lessons.length].id)}">Следующий урок →</a></div></div>${aside}</div>`;
    return html;
  }
  function mount(id,prefs,save) {
    const lesson=byId(id);if(!lesson)return;
    lesson.sections.forEach((_,j)=>{
      const target=document.querySelectorAll('.lesson-section')[j];if(target)target.id=`lesson-section-${j}`;
    });
    document.querySelectorAll('[data-scroll]').forEach(a=>a.addEventListener('click',e=>{
      e.preventDefault();const target=a.dataset.scroll;document.getElementById(target==='quiz'?'check':target==='sim'?'simulator':`lesson-section-${target}`)?.scrollIntoView({behavior:'smooth',block:'start'});
    }));
    const widget=document.querySelector('#lesson-widget');
    if(widget){
      widget.addEventListener('change',e=>{
        const key=e.target.dataset.setting;if(!key)return;
        state[key]=e.target.type==='range'?Number(e.target.value):e.target.value;
        if(key==='failure'||key==='mode')state.step=0;
        if(key==='incident')state.diagnosis='';
        widget.innerHTML=simulator(lesson.sim);
      });
      widget.addEventListener('click',e=>{
        const button=e.target.closest('[data-lab-action]');if(!button)return;
        if(button.dataset.labAction==='reset')state={...defaultStates[lesson.sim]};
        else if(button.dataset.labAction==='step')state.step++;
        else if(button.dataset.labAction==='diagnose')state.diagnosis=button.dataset.value;
        widget.innerHTML=simulator(lesson.sim);
      });
    }
    document.querySelector('.quiz-answers')?.addEventListener('click',e=>{
      const button=e.target.closest('[data-quiz]');if(!button)return;
      const choice=Number(button.dataset.quiz);prefs.lessonQuiz[id]=choice;save();
      document.querySelectorAll('.quiz-choice').forEach(b=>b.classList.toggle('chosen',b===button));
      document.querySelector('#quiz-feedback').innerHTML=`<p class="lab-feedback ${choice===lesson.quiz.correct?'correct':'wrong'}">${choice===lesson.quiz.correct?'Верно.':'Пока неверно.'} ${escape(choice===lesson.quiz.correct?lesson.quiz.explain:`${lesson.quiz.explain} Перечитайте раздел и попробуйте ещё.`)}</p>`;
      document.querySelector('#finish-lesson').disabled=choice!==lesson.quiz.correct;
    });
    document.querySelector('#finish-lesson')?.addEventListener('click',()=>{
      if(prefs.lessonQuiz[id]!==lesson.quiz.correct)return;
      prefs.lessonDone[id]=true;save();
      document.querySelector('#finish-lesson').textContent='✓ Урок пройден';
      document.querySelector('#finish-feedback').textContent='Прогресс сохранён в этом браузере.';
    });
  }
  window.JavaLearning={lessons,byId,catalog,lessonPage,mount};
})();
