import {
  LESSON_BLUEPRINT,
  createProgress,
  recordAnswer,
  canOpenLesson,
  evaluateChoice,
  scoreQuiz,
  restoreProgress,
  getCoursePath,
  LESSON_ENRICHMENTS,
  createRulerMeasurement,
} from './lesson-engine.js';

const LESSONS = [
  {
    eyebrow: '暖身站 · 比較長短',
    goal: '先用眼睛觀察，再用「同一個起點」公平比較兩個物品。',
    narration: '歡迎來到長度偵探站！比較長短時，要先讓兩個物品的一端對齊同一個起點，再看看誰伸得比較遠。長、短、高、矮和厚、薄，都是在說長度。',
    concept: [
      ['先對齊起點', '如果起點不同，只看終點很容易被騙。把左邊排整齊，再比較另一端。'],
      ['生活中的長度', '鉛筆有長短、樹木有高矮、書本有厚薄，這些都可以比較。'],
    ],
    activity: 'compare',
  },
  {
    eyebrow: '3-1 · 個別單位',
    goal: '理解用不同大小的單位測量同一物品，得到的數量可能不同。',
    narration: '同一張桌子，用小積木量會得到比較大的數字，用大積木量會得到比較小的數字。測量時，每個單位要一樣大，還要一個接一個，不能重疊，也不能留下空隙。',
    concept: [
      ['首尾相接', '測量單位要從物品的一端開始，緊緊排好，不重疊、不留縫。'],
      ['單位大小會影響數量', '同一段長度，用較短的單位量，需要的個數比較多。'],
    ],
    activity: 'units',
  },
  {
    eyebrow: '3-2 · 認識公分',
    goal: '認識公分記作 cm，並建立 1 公分的正確概念。',
    narration: '公分是大家約定好的長度單位，也可以寫成英文字母 c m。直尺上，相鄰兩個整數刻度之間的距離，就是一公分。注意，一公分是一段距離，不是一條刻度線。',
    concept: [
      ['公分是共同單位', '大家都用同樣的公分測量，結果才能公平比較。公分也寫作 cm。'],
      ['看「刻度間的距離」', '從刻度 3 到刻度 4，中間這一段是 1 公分。'],
    ],
    activity: 'centimeter',
  },
  {
    eyebrow: '3-3 · 量一量',
    goal: '會用公分直尺測量，也能處理物品沒有對準 0 的情況。',
    narration: '最簡單的量法，是把物品一端對準直尺的零，再讀另一端的刻度。如果物品從刻度二開始，到刻度九結束，就要用九減二，得到七公分。讀到的終點數字不一定等於物品長度。',
    concept: [
      ['從 0 開始', '物品一端對準 0，另一端指到幾，通常就是幾公分。'],
      ['不是從 0 開始', '用「終點刻度－起點刻度」算出真正長度。'],
    ],
    activity: 'measure',
  },
  {
    eyebrow: '3-3 · 畫一畫',
    goal: '能用直尺畫出指定長度的線段，並標示單位。',
    narration: '畫六公分線段時，先在零的位置點出起點，再找到刻度六點出終點，最後沿著直尺把兩點連起來。畫完別忘了寫上六公分。',
    concept: [
      ['三個步驟', '起點對 0、找到終點刻度、連起兩個端點。'],
      ['最後要檢查', '重新數一數刻度間隔，並在答案後面寫上「公分」。'],
    ],
    activity: 'draw',
  },
  {
    eyebrow: '3-4 · 長度的加減',
    goal: '在生活情境中做長度的合成與分解，並用算式記錄。',
    narration: '兩條彩帶接起來，要用加法算全部的長度。從長紙條剪掉一段，要用減法算剩下的長度。計算時數字後面的單位也要一起看。',
    concept: [
      ['合起來用加法', '把 8 公分和 5 公分接在一起，可以寫成 8 加 5。'],
      ['拿走或比較用減法', '15 公分剪掉 6 公分，剩下 9 公分。兩物相差多少也用減法。'],
    ],
    activity: 'calculate',
  },
  {
    eyebrow: '統整任務 · 公分挑戰',
    goal: '綜合運用比較、單位、測量、畫線與長度計算。',
    narration: '最後一站要挑戰五個任務。先看清楚每題問的是什麼，再選答案。答對四題以上，就能獲得公分達人徽章。準備好再開始！',
    concept: [
      ['先想再選', '圈出題目裡的起點、終點、數字和單位，會更容易找到答案。'],
      ['錯誤是線索', '如果第一次沒成功，回到前面的關卡找提示，再挑戰一次。'],
    ],
    activity: 'challenge',
  },
];

const quizQuestions = [
  { text: '直尺上從刻度 2 到刻度 8，是幾公分？', options: [6, 8, 10], answer: 6 },
  { text: '同一張桌子，用比較大的積木量，積木的個數通常會怎樣？', options: ['比較少', '比較多', '一樣多'], answer: '比較少' },
  { text: '4 公分和 7 公分的紙條接起來，共有幾公分？', options: [3, 11, 47], answer: 11 },
  { text: '畫 5 公分線段，起點對準刻度 0，終點要在刻度幾？', options: [0, 4, 5], answer: 5 },
  { text: '一條繩子長 13 公分，剪掉 5 公分，剩下幾公分？', options: [8, 13, 18], answer: 8 },
];

const elements = {
  welcome: document.querySelector('#welcome-view'),
  lessonView: document.querySelector('#lesson-view'),
  map: document.querySelector('#mission-map'),
  nav: document.querySelector('#lesson-nav'),
  star: document.querySelector('#star-count'),
  title: document.querySelector('#lesson-title'),
  eyebrow: document.querySelector('#lesson-eyebrow'),
  goal: document.querySelector('#lesson-goal'),
  content: document.querySelector('#lesson-content'),
  activity: document.querySelector('#activity-panel'),
  feedback: document.querySelector('#feedback'),
  position: document.querySelector('#lesson-position'),
  next: document.querySelector('#next-button'),
  prev: document.querySelector('#prev-button'),
  sound: document.querySelector('#sound-toggle'),
  certificate: document.querySelector('#certificate'),
};

const storageKey = 'gongfen-adventure-progress-v1';
let progress = restoreProgress(localStorage.getItem(storageKey), LESSONS.length);
let currentLesson = 0;
let soundOn = true;

function saveProgress() {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

function playTone(type = 'success') {
  if (!soundOn) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = new AudioContext();
  const notes = type === 'success' ? [523, 659, 784] : [330, 294];
  notes.forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.12, audio.currentTime + index * .1 + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + index * .1 + .22);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + index * .1);
    oscillator.stop(audio.currentTime + index * .1 + .24);
  });
}

function speakLesson() {
  if (!soundOn) {
    showFeedback('音效目前已關閉，按右上角的 🔇 就能重新開啟語音。', false);
    return;
  }
  if (!('speechSynthesis' in window)) {
    showFeedback('這個瀏覽器目前沒有語音朗讀功能，可以直接閱讀畫面上的內容。', false);
    return;
  }
  window.speechSynthesis.cancel();
  const story = LESSON_ENRICHMENTS[currentLesson];
  const narration = `${LESSONS[currentLesson].narration} ${story.storyText} ${story.dialogue} ${story.storyClosing} 請記住：${story.remember}`;
  const utterance = new SpeechSynthesisUtterance(narration);
  utterance.lang = 'zh-TW';
  utterance.rate = .9;
  utterance.pitch = 1.05;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang === 'zh-TW');
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function renderMap() {
  elements.map.innerHTML = LESSON_BLUEPRINT.map((lesson, index) => {
    const open = canOpenLesson(progress, index);
    const done = progress.completed[index];
    return `
      <button class="mission-card" style="--stage:${lesson.color}" data-open-lesson="${index}" ${open ? '' : 'disabled'}>
        <span class="mission-number">${index + 1}</span>
        <span class="mission-state" aria-label="${done ? '已完成' : open ? '可以開始' : '尚未開放'}">${done ? '★' : open ? '○' : '🔒'}</span>
        <h3>${lesson.title}</h3>
        <p>${lesson.short}</p>
      </button>`;
  }).join('');
}

function renderNav() {
  elements.nav.innerHTML = LESSON_BLUEPRINT.map((lesson, index) => {
    const open = canOpenLesson(progress, index);
    return `
      <button class="nav-lesson ${index === currentLesson ? 'active' : ''}" style="--stage:${lesson.color}" data-open-lesson="${index}" ${open ? '' : 'disabled'} aria-current="${index === currentLesson ? 'step' : 'false'}">
        <span class="nav-index">${index + 1}</span><small>${lesson.short}</small><span class="nav-state">${progress.completed[index] ? '★' : open ? '' : '🔒'}</span>
      </button>`;
  }).join('');
}

function animationVisual(enrichment) {
  const { demoType: type, demoData } = enrichment;
  if (type === 'compare') {
    return `<div class="demo-compare" aria-hidden="true"><span class="start-line"></span><div class="demo-object pencil-long"><span>長鉛筆</span></div><div class="demo-object pencil-short"><span>短鉛筆</span></div></div>`;
  }
  if (type === 'units') {
    return `<div class="demo-units" aria-hidden="true"><div><small>小單位：${demoData.smallUnitCount} 個</small><div class="demo-unit-row small">${'<span></span>'.repeat(demoData.smallUnitCount)}</div></div><div><small>大單位：${demoData.largeUnitCount} 個</small><div class="demo-unit-row big">${'<span></span>'.repeat(demoData.largeUnitCount)}</div></div></div>`;
  }
  if (type === 'centimeter') {
    return `<div class="demo-centimeter" aria-hidden="true"><div class="demo-cm-ruler"><span class="cm-zero">0</span><span class="cm-one">1</span><i></i></div><strong>這一段就是 1 cm</strong></div>`;
  }
  if (type === 'measure') {
    const measurement = createRulerMeasurement(demoData.start, demoData.end, demoData.max);
    const ticks = Array.from({ length: measurement.max + 1 }, (_, tick) => `<span style="--tick:${(tick / measurement.max) * 100}">${tick}</span>`).join('');
    return `<div class="demo-measure" aria-hidden="true"><div class="demo-scale" style="--measure-start:${measurement.startPercent};--measure-span:${measurement.spanPercent};--measure-end:${measurement.endPercent}">${ticks}<i class="demo-pencil"></i></div><strong>${measurement.end}－${measurement.start}＝${measurement.length} 公分</strong></div>`;
  }
  if (type === 'draw') {
    return `<div class="demo-draw" aria-hidden="true"><span class="draw-dot start"></span><i></i><span class="draw-dot end"></span><strong>0</strong><strong>6 cm</strong></div>`;
  }
  if (type === 'calculate') {
    const joinPercent = (demoData.firstLength / demoData.totalLength) * 100;
    return `<div class="demo-calculate" style="--first:${demoData.firstLength}fr;--second:${demoData.secondLength}fr;--join:${joinPercent}" aria-hidden="true"><span class="demo-ribbon blue">${demoData.firstLength} cm</span><span class="demo-plus">＋</span><span class="demo-ribbon coral">${demoData.secondLength} cm</span><strong>＝ ${demoData.totalLength} cm</strong></div>`;
  }
  return `<div class="demo-challenge" aria-hidden="true">${demoData.clues.map((label) => `<span>${label}</span>`).join('')}<strong>準備完成！</strong></div>`;
}

function renderAnimationDemo(enrichment) {
  return `<section class="animation-card is-replaying" data-animation-demo="${enrichment.demoType}">
    <div class="animation-copy">
      <span class="micro-label">動畫演示</span>
      <h2>${enrichment.demoTitle}</h2>
      <p>${enrichment.demoCaption}</p>
    </div>
    <div class="animation-stage" role="img" aria-label="${enrichment.demoCaption}">${animationVisual(enrichment)}</div>
    <button class="replay-button" type="button" data-replay-animation><span aria-hidden="true">↻</span> 重播動畫</button>
  </section>`;
}

function renderConcepts(concepts) {
  const enrichment = LESSON_ENRICHMENTS[currentLesson];
  return `
    <section class="story-card">
      <figure class="story-figure">
        <img src="${enrichment.image}" alt="${enrichment.imageAlt}" loading="lazy" />
        <figcaption>${enrichment.imageNote}</figcaption>
      </figure>
      <div class="story-copy">
        <span class="story-kicker">栗栗的發現</span>
        <h2>${enrichment.storyTitle}</h2>
        <p>${enrichment.storyText}</p>
        <blockquote>${enrichment.dialogue}</blockquote>
        <p class="story-closing">${enrichment.storyClosing}</p>
      </div>
    </section>
    <div class="concept-grid">${concepts.map((item, index) => `
    <section class="concept-card ${index % 2 ? 'warm' : ''}"><h2>${item[0]}</h2><p>${item[1]}</p>${currentLesson === 2 && index === 0 ? '<span class="mini-rule">1 公分 = 1 cm</span>' : ''}</section>
    `).join('')}</div>
    <div class="teaching-deck">
      <section class="steps-card">
        <span class="micro-label">跟著做</span>
        <h2>三步驟學會</h2>
        <ol>${enrichment.steps.map((step, index) => `<li><span>${index + 1}</span><p>${step}</p></li>`).join('')}</ol>
      </section>
      <div class="tip-stack">
        <aside class="mistake-card">
          <span class="micro-label">小心這個陷阱</span>
          <p>${enrichment.mistake}</p>
        </aside>
        <aside class="remember-card">
          <span class="micro-label">一句話記住</span>
          <p>${enrichment.remember}</p>
        </aside>
      </div>
    </div>
    ${renderAnimationDemo(enrichment)}`;
}

function rulerMarkup(start, length, showObject = true) {
  const cells = Array.from({ length: 10 }, (_, index) => `<span class="ruler-cell"><span class="ruler-label">${index}</span></span>`).join('');
  return `<div class="ruler-wrap" aria-label="${showObject ? `物品從刻度 ${start} 到刻度 ${start + length}` : '0 到 10 公分的直尺圖'}"><div class="ruler" style="--start:${start};--length:${length}">${showObject ? '<span class="measure-object"></span>' : ''}${cells}<span class="ruler-end">10</span></div></div>`;
}

function activityMarkup(type) {
  const heading = '<span class="activity-label">動手任務</span>';
  if (type === 'compare') return `${heading}<h2 id="activity-title">哪一個物品比較長？</h2><p class="activity-hint">兩個物品已經從同一個起點排好。</p><div class="compare-visual"><div class="object-row"><span class="object-icon">✏️</span><div class="length-track"><div class="length-fill" style="--length:88%;--object-color:#2585d8"></div></div><strong>藍鉛筆</strong></div><div class="object-row"><span class="object-icon">▰</span><div class="length-track"><div class="length-fill" style="--length:38%;--object-color:#ef6a55"></div></div><strong>橡皮擦</strong></div></div><div class="choice-grid"><button class="choice" data-answer="藍鉛筆" data-correct="true">藍鉛筆</button><button class="choice" data-answer="橡皮擦">橡皮擦</button></div>`;
  if (type === 'units') return `${heading}<h2 id="activity-title">同一段長度，為什麼個數不同？</h2><p class="activity-hint">上排用 8 個小單位，下排用 4 個大單位，兩排總長一樣。</p><div class="unit-demo"><div class="unit-row"><strong>小方塊：8 個</strong><div class="units">${'<span class="unit"></span>'.repeat(8)}</div></div><div class="unit-row"><strong>大積木：4 個</strong><div class="units big">${'<span class="unit"></span>'.repeat(4)}</div></div></div><div class="choice-grid"><button class="choice" data-correct="true">單位越長，需要的個數越少</button><button class="choice">單位越長，需要的個數越多</button></div>`;
  if (type === 'centimeter') return `${heading}<h2 id="activity-title">請找出 1 公分</h2><p class="activity-hint">想一想：一公分是一條線，還是兩條相鄰刻度之間的距離？</p>${rulerMarkup(0, 0, false)}<div class="cm-bracket">相鄰兩條整數刻度之間</div><div class="choice-grid"><button class="choice">刻度 3 這一條線</button><button class="choice" data-correct="true">刻度 3 到 4 的距離</button><button class="choice">刻度 3 到 5 的距離</button></div>`;
  if (type === 'measure') return `${heading}<h2 id="activity-title">這枝鉛筆長幾公分？</h2><p class="activity-hint">鉛筆從刻度 2 開始，到刻度 9 結束。</p>${rulerMarkup(2, 7)}<div class="choice-grid"><button class="choice">9 公分</button><button class="choice" data-correct="true">7 公分</button><button class="choice">11 公分</button></div>`;
  if (type === 'draw') return `${heading}<h2 id="activity-title">畫出 6 公分的線段</h2><p class="activity-hint">拖曳控制鈕調整長度，完成後按「檢查長度」。</p><div class="draw-area"><div class="draw-line" id="draw-line" style="--draw-length:4"></div><span class="draw-label" id="draw-label">4 公分</span></div><div class="range-row"><input id="length-range" type="range" min="1" max="10" value="4" aria-label="調整線段長度" /><output class="range-value" id="range-value">4 公分</output></div><button class="primary-button" id="check-drawing">檢查長度</button>`;
  if (type === 'calculate') return `${heading}<h2 id="activity-title">兩條彩帶接起來，共有多長？</h2><p class="activity-hint">藍彩帶 8 公分，紅彩帶 5 公分。</p><div class="ribbon-model"><div class="ribbon-a">8 cm</div><div class="ribbon-b">5 cm</div></div><div class="choice-grid"><button class="choice">3 公分</button><button class="choice" data-correct="true">13 公分</button><button class="choice">85 公分</button></div>`;
  return `${heading}<h2 id="activity-title">五題總挑戰</h2><p class="activity-hint">答對 4 題以上，就能完成探險。</p><form id="quiz-form"><div class="quiz-list">${quizQuestions.map((question, index) => `<fieldset class="quiz-question"><p>${index + 1}. ${question.text}</p><div class="quiz-options">${question.options.map((option) => `<label><input type="radio" name="q${index}" value="${option}" /> ${option}${typeof option === 'number' && index !== 1 ? ' 公分' : ''}</label>`).join('')}</div></fieldset>`).join('')}</div><button class="primary-button quiz-submit" type="submit">送出總挑戰</button></form>`;
}

function renderLesson(index) {
  currentLesson = index;
  const lesson = LESSONS[index];
  const blueprint = LESSON_BLUEPRINT[index];
  elements.lessonView.style.setProperty('--stage', blueprint.color);
  elements.eyebrow.textContent = lesson.eyebrow;
  elements.title.textContent = blueprint.title;
  elements.goal.textContent = lesson.goal;
  elements.position.textContent = `第 ${index + 1} 關，共 ${LESSONS.length} 關`;
  elements.content.innerHTML = renderConcepts(lesson.concept);
  elements.activity.innerHTML = activityMarkup(lesson.activity);
  elements.feedback.className = 'feedback';
  elements.feedback.textContent = '';
  elements.prev.disabled = index === 0;
  elements.next.disabled = !progress.completed[index];
  elements.next.querySelector('span:first-child').textContent = index === LESSONS.length - 1 ? '查看成果' : '下一關';
  renderNav();
  window.speechSynthesis?.cancel();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openLesson(index) {
  if (!canOpenLesson(progress, index)) return;
  elements.welcome.hidden = true;
  elements.lessonView.hidden = false;
  renderLesson(index);
}

function goHome() {
  window.speechSynthesis?.cancel();
  elements.lessonView.hidden = true;
  elements.welcome.hidden = false;
  renderMap();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showFeedback(message, success) {
  elements.feedback.className = `feedback ${success ? 'success' : 'try'}`;
  elements.feedback.textContent = message;
}

function completeCurrent(message) {
  progress = recordAnswer(progress, currentLesson, true);
  saveProgress();
  elements.star.textContent = progress.stars;
  elements.next.disabled = false;
  renderNav();
  showFeedback(`答對了！${message} 你得到第 ${progress.stars} 顆公分星。`, true);
  playTone('success');
}

function handleChoice(button) {
  const choices = [...elements.activity.querySelectorAll('.choice')];
  choices.forEach((item) => item.classList.remove('correct', 'wrong'));
  const correct = button.dataset.correct === 'true';
  button.classList.add(correct ? 'correct' : 'wrong');
  if (correct) {
    choices.forEach((item) => { item.disabled = true; });
    const messages = [
      '從同一個起點看，藍鉛筆伸得比較遠。',
      '同樣長度用大單位量，數量會比較少。',
      '一公分是相鄰兩個整數刻度之間的距離。',
      '終點 9 減去起點 2，長度是 7 公分。',
      '六公分線段完成了。',
      '8 加 5 等於 13，記得寫上公分。',
    ];
    completeCurrent(messages[currentLesson]);
  } else {
    showFeedback(currentLesson === 3 ? '再看一次：鉛筆不是從 0 開始，要算 9－2。' : '再觀察一次畫面上的提示，你已經很接近了！', false);
    playTone('try');
  }
}

function handleQuiz(form) {
  const formData = new FormData(form);
  const results = quizQuestions.map((question, index) => evaluateChoice(formData.get(`q${index}`), question.answer));
  const answered = results.filter((_, index) => formData.has(`q${index}`)).length;
  if (answered < quizQuestions.length) {
    showFeedback(`還有 ${quizQuestions.length - answered} 題沒有作答喔！`, false);
    playTone('try');
    return;
  }
  const score = scoreQuiz(results);
  if (score >= 4) {
    completeCurrent(`你答對 ${score} 題，已經能把公分用在不同問題裡。`);
  } else {
    showFeedback(`這次答對 ${score} 題。先回前面的關卡複習，再來挑戰一次！`, false);
    playTone('try');
  }
}

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const registrations = [
    context.registerTool({
      name: 'read_learning_progress',
      title: '查看公分探險進度',
      description: '讀取學生目前完成的關卡數與星星數，不會更改進度。',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute() {
        return { stars: progress.stars, total: LESSONS.length, completed: [...progress.completed] };
      },
    }, { signal: lifecycle.signal }),
    context.registerTool({
      name: 'start_learning_lesson',
      title: '開始指定的公分關卡',
      description: '開啟一個已解鎖的公分學習關卡，關卡編號為 1 到 7。',
      inputSchema: {
        type: 'object',
        properties: { lessonNumber: { type: 'integer', minimum: 1, maximum: 7 } },
        required: ['lessonNumber'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const lessonNumber = Number(input?.lessonNumber);
        if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > LESSONS.length) {
          throw new Error('lessonNumber 必須是 1 到 7 的整數');
        }
        const index = lessonNumber - 1;
        if (!canOpenLesson(progress, index)) throw new Error('這一關尚未解鎖');
        openLesson(index);
        return { opened: true, lessonNumber, title: LESSON_BLUEPRINT[index].title };
      },
    }, { signal: lifecycle.signal }),
  ];
  Promise.allSettled(registrations).then((results) => {
    results.filter((result) => result.status === 'rejected').forEach((result) => console.warn('WebMCP registration failed', result.reason));
  });
}

document.addEventListener('click', (event) => {
  const openButton = event.target.closest('[data-open-lesson]');
  if (openButton) openLesson(Number(openButton.dataset.openLesson));

  const choice = event.target.closest('.choice');
  if (choice) handleChoice(choice);
});

elements.activity.addEventListener('input', (event) => {
  if (event.target.id !== 'length-range') return;
  const value = event.target.value;
  document.querySelector('#draw-line').style.setProperty('--draw-length', value);
  document.querySelector('#draw-label').textContent = `${value} 公分`;
  document.querySelector('#range-value').value = `${value} 公分`;
});

elements.activity.addEventListener('click', (event) => {
  if (event.target.id !== 'check-drawing') return;
  const value = document.querySelector('#length-range').value;
  if (evaluateChoice(value, 6)) completeCurrent('起點在 0，終點在 6，正好是 6 公分。');
  else {
    showFeedback(`現在是 ${value} 公分，請把終點調到刻度 6。`, false);
    playTone('try');
  }
});

elements.activity.addEventListener('submit', (event) => {
  if (event.target.id !== 'quiz-form') return;
  event.preventDefault();
  handleQuiz(event.target);
});

elements.content.addEventListener('click', (event) => {
  const replayButton = event.target.closest('[data-replay-animation]');
  if (!replayButton) return;
  const demo = replayButton.closest('[data-animation-demo]');
  demo.classList.remove('is-replaying');
  void demo.offsetWidth;
  demo.classList.add('is-replaying');
});

document.querySelector('#start-button').addEventListener('click', () => openLesson(progress.completed.findIndex((item) => !item) < 0 ? 0 : progress.completed.findIndex((item) => !item)));
document.querySelector('#home-button').addEventListener('click', goHome);
document.querySelector('#back-home').addEventListener('click', goHome);
document.querySelector('#listen-button').addEventListener('click', speakLesson);
elements.prev.addEventListener('click', () => openLesson(currentLesson - 1));
elements.next.addEventListener('click', () => {
  if (currentLesson < LESSONS.length - 1) openLesson(currentLesson + 1);
  else elements.certificate.showModal();
});
elements.sound.addEventListener('click', () => {
  soundOn = !soundOn;
  elements.sound.textContent = soundOn ? '🔊' : '🔇';
  elements.sound.setAttribute('aria-pressed', String(soundOn));
  elements.sound.setAttribute('aria-label', soundOn ? '關閉音效' : '開啟音效');
  if (!soundOn) window.speechSynthesis?.cancel();
});
document.querySelector('#reset-button').addEventListener('click', () => {
  if (!window.confirm('要清除 7 關的星星，重新開始嗎？')) return;
  progress = createProgress(LESSONS.length);
  saveProgress();
  elements.star.textContent = '0';
  openLesson(0);
});
document.querySelector('#dialog-close').addEventListener('click', () => elements.certificate.close());
document.querySelector('#certificate-home').addEventListener('click', () => { elements.certificate.close(); goHome(); });

elements.star.textContent = progress.stars;
const selectedCourse = getCoursePath('grade2-math-centimeter');
document.querySelector('#selected-grade').textContent = selectedCourse.grade;
document.querySelector('#selected-age').textContent = selectedCourse.age;
document.querySelector('#selected-category').textContent = selectedCourse.category;
document.querySelector('#selected-unit').textContent = selectedCourse.unit;
document.querySelector('#selected-unit-title').textContent = selectedCourse.title;
document.querySelector('#course-unit-label').textContent = selectedCourse.unit;
renderMap();
registerWebMCP();
