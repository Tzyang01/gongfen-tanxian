import { SEMESTER_COURSE } from './course-data.js';
import {
  answerPracticeQuestion,
  buildPracticeSet,
  buildVisualModel,
  canOpenSemesterLesson,
  createPracticeSession,
  createSemesterProgress,
  recordSemesterCompletion,
  restoreSemesterProgress,
} from './semester-engine.js';
import {
  addLearnerProfile,
  advanceGuidedStep,
  answerGuidedStep,
  buildParentReport,
  createGuidedSession,
  currentGuidedStep,
  recordGuidedSession,
  restoreLearnerStore,
  setActiveLearner,
} from './adaptive-engine.js';
import { ADAPTIVE_COURSE, getAdaptiveUnit } from './adaptive-course-data.js';

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const storageKey = 'grade2-semester1-math-progress-v1';
const learnerStorageKey = 'grade2-semester1-learners-v2';
const skillIds = ADAPTIVE_COURSE.skillIds;
const legacyProgress = restoreSemesterProgress(localStorage.getItem(storageKey), SEMESTER_COURSE);
let learnerStore = restoreLearnerStore(localStorage.getItem(learnerStorageKey), legacyProgress, skillIds);
let progress = learnerStore.profiles[learnerStore.activeProfileId].semesterProgress;
let currentUnitIndex = 0;
let currentLessonIndex = 0;
let soundOn = true;
let currentQuestions = [];
let practiceSession = null;
let adaptiveSkill = null;
let adaptiveSession = null;
let activeAdaptiveUnit = null;

const elements = {
  home: $('#home-view'), unit: $('#unit-view'), lesson: $('#lesson-view'), adaptive: $('#adaptive-view'), unitGrid: $('#unit-grid'),
  star: $('#star-count'), total: $('#star-total'), lessonMap: $('#lesson-map'), nav: $('#lesson-nav'),
  celebration: $('#celebration'), sound: $('#sound-toggle'), visual: $('#math-visual'), feedback: $('#feedback'),
};

const unitProgress = (unit) => progress.units[unit.id];
const completedTotal = () => Object.values(progress.units).reduce((sum, item) => sum + item.stars, 0);
const lessonTotal = () => SEMESTER_COURSE.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
const activeProfile = () => learnerStore.profiles[learnerStore.activeProfileId];

function saveProgress() {
  learnerStore = {
    ...learnerStore,
    profiles: {
      ...learnerStore.profiles,
      [learnerStore.activeProfileId]: { ...activeProfile(), semesterProgress: progress },
    },
  };
  localStorage.setItem(storageKey, JSON.stringify(progress));
  localStorage.setItem(learnerStorageKey, JSON.stringify(learnerStore));
}

function show(view) {
  elements.home.hidden = view !== 'home';
  elements.unit.hidden = view !== 'unit';
  elements.lesson.hidden = view !== 'lesson';
  elements.adaptive.hidden = view !== 'adaptive';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStars() {
  elements.star.textContent = completedTotal();
  elements.total.textContent = `/ ${lessonTotal()}`;
  $('#profile-avatar').textContent = activeProfile().avatar;
  $('#profile-name').textContent = activeProfile().nickname;
}

function renderUnitGrid() {
  elements.unitGrid.innerHTML = SEMESTER_COURSE.units.map((unit) => {
    const state = unitProgress(unit);
    const percentage = Math.round((state.stars / unit.lessons.length) * 100);
    return `<button class="unit-card" data-unit="${unit.number - 1}" style="--unit:${unit.color}">
      <span class="unit-number">${String(unit.number).padStart(2, '0')}</span><span class="unit-icon" aria-hidden="true">${unit.icon}</span>
      <h3>${unit.title}</h3><p>${unit.summary}</p>
      <div class="card-progress"><span><b>${state.stars}</b> / ${unit.lessons.length} 顆星</span><i><u style="width:${percentage}%"></u></i></div>
      <span class="enter-label">進入小島 <b aria-hidden="true">→</b></span>
    </button>`;
  }).join('');
  updateStars();
}

function renderUnit() {
  const unit = SEMESTER_COURSE.units[currentUnitIndex];
  const state = unitProgress(unit);
  const percentage = Math.round((state.stars / unit.lessons.length) * 100);
  $('#unit-hero').style.setProperty('--unit', unit.color);
  $('#unit-eyebrow').textContent = `第 ${unit.number} 單元 · ${SEMESTER_COURSE.grade}${SEMESTER_COURSE.semester}`;
  $('#unit-name').textContent = `${unit.icon} ${unit.title}`;
  $('#unit-summary').textContent = unit.summary;
  $('#unit-progress-text').textContent = `${state.stars} / ${unit.lessons.length} 顆星 · ${percentage}%`;
  $('#unit-progress-bar').style.width = `${percentage}%`;
  $('#unit-image').src = unit.image;
  $('#unit-image').alt = unit.imageAlt;
  $('#unit-image-note').textContent = unit.imageNote;
  $('#story-title').textContent = unit.story.title;
  $('#story-opening').textContent = unit.story.opening;
  $('#story-dialogue').textContent = unit.story.dialogue;
  $('#story-closing').textContent = unit.story.closing;
  $('#curriculum-sections').textContent = `課程內容：${unit.curriculumSections.join('、')}`;
  const adaptiveUnit = getAdaptiveUnit(unit.id);
  $('#adaptive-entry').hidden = !adaptiveUnit;
  if (adaptiveUnit) {
    $('#adaptive-entry-title').textContent = `${unit.title}也可以一步一步學`;
    $('#adaptive-entry-description').textContent = adaptiveUnit.intro;
    $('#adaptive-start').textContent = `開始${adaptiveUnit.title} →`;
  }
  elements.lessonMap.innerHTML = unit.lessons.map((item, index) => {
    const open = canOpenSemesterLesson(progress, unit.id, index);
    const done = state.completed[index];
    return `<button class="lesson-map-card" data-lesson="${index}" ${open ? '' : 'disabled'}>
      <span class="lesson-status">${done ? '★' : open ? String(index + 1) : '🔒'}</span>
      <div><small>${item.kind === 'challenge' ? '統整挑戰 · 15 題' : `${item.code} · 8 題練習`}</small><h3>${item.title}</h3><p>${item.goal}</p></div>
      <b aria-hidden="true">${open ? '→' : ''}</b>
    </button>`;
  }).join('');
  updateStars();
}

function renderNav() {
  const unit = SEMESTER_COURSE.units[currentUnitIndex];
  $('#rail-title').textContent = `第 ${unit.number} 單元　${unit.title}`;
  elements.nav.innerHTML = unit.lessons.map((item, index) => {
    const open = canOpenSemesterLesson(progress, unit.id, index);
    const done = unitProgress(unit).completed[index];
    return `<button class="nav-item ${index === currentLessonIndex ? 'active' : ''}" data-nav="${index}" ${open ? '' : 'disabled'}>
      <span>${done ? '★' : open ? index + 1 : '🔒'}</span><b>${item.title}</b>
    </button>`;
  }).join('');
}

function renderLesson() {
  const unit = SEMESTER_COURSE.units[currentUnitIndex];
  const item = unit.lessons[currentLessonIndex];
  $('#lesson-position').textContent = `第 ${currentLessonIndex + 1} 課，共 ${unit.lessons.length} 課`;
  $('#lesson-code').textContent = item.kind === 'challenge' ? `${item.code} · 統整挑戰` : item.code;
  $('#lesson-name').textContent = item.title;
  $('#lesson-goal').textContent = item.goal;
  $('#story-beat').textContent = item.storyBeat;
  $('#lesson-steps').innerHTML = item.steps.map((step) => `<li>${step}</li>`).join('');
  $('#lesson-mistake').textContent = item.mistake;
  $('#lesson-remember').textContent = item.remember;
  currentQuestions = buildPracticeSet(item, unit.lessons);
  practiceSession = createPracticeSession(currentQuestions);
  renderPracticeQuestion();
  renderVisual(item.visual);
  renderNav();
  $('#prev-button').disabled = currentLessonIndex === 0;
  const nextOpen = currentLessonIndex < unit.lessons.length - 1 && canOpenSemesterLesson(progress, unit.id, currentLessonIndex + 1);
  $('#next-button').disabled = currentLessonIndex === unit.lessons.length - 1 || !nextOpen;
}

function renderPracticeQuestion() {
  const question = currentQuestions[practiceSession.current];
  const total = currentQuestions.length;
  $('#practice-progress').textContent = `第 ${practiceSession.current + 1} 題，共 ${total} 題`;
  $('#practice-progress-bar').style.width = `${(practiceSession.current / total) * 100}%`;
  $('#question-level').textContent = question.level;
  $('#question-title').textContent = question.prompt;
  renderPracticeVisual(question.visual);
  const isInput = question.responseType === 'input';
  $('#question-options').hidden = isInput;
  $('#question-options').innerHTML = isInput ? '' : question.options.map((option) => {
    const value = escapeHtml(option);
    return `<button data-answer="${value}">${value}</button>`;
  }).join('');
  $('#question-input-form').hidden = !isInput;
  $('#question-input').value = '';
  $('#question-input').disabled = false;
  $('#question-input').className = '';
  $('#question-submit').disabled = false;
  $('#question-input').inputMode = typeof question.answer === 'number' ? 'numeric' : 'text';
  $('#practice-next').hidden = true;
  elements.feedback.textContent = '';
  elements.feedback.className = 'feedback';
}

function renderPracticeVisual(spec) {
  const container = $('#question-visual');
  if (!spec) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }
  const safe = (value) => escapeHtml(value ?? '');
  const dots = (count, icon = '●') => Array.from({ length: Math.min(Number(count) || 0, 10) }, () => `<i>${safe(icon)}</i>`).join('');
  let html = '';
  switch (spec.type) {
    case 'sequence':
      html = `<div class="practice-sequence">${spec.values.map((value, index) => `${index ? `<b>${safe(spec.connector ?? '—')}</b>` : ''}<span class="${value === null ? 'blank' : ''}">${value === null ? '?' : safe(value)}</span>`).join('')}</div>`;
      break;
    case 'place-value':
      html = `<div class="practice-place-value">${[['百', spec.hundreds], ['十', spec.tens], ['一', spec.ones]].map(([label, count]) => `<div><strong>${safe(label)}</strong><span>${safe(count)}</span><i>${dots(count, spec.money ? '＄' : '■')}</i></div>`).join('')}</div>`;
      break;
    case 'money':
      html = `<div class="practice-money"><div><strong>100 元</strong><i>${Array.from({ length: spec.hundreds }, () => '<span class="bill">100</span>').join('')}</i><b>${safe(spec.hundreds)} 張</b></div><div><strong>10 元</strong><i>${Array.from({ length: spec.tens }, () => '<span class="coin ten">10</span>').join('')}</i><b>${safe(spec.tens)} 個</b></div><div><strong>1 元</strong><i>${Array.from({ length: spec.ones }, () => '<span class="coin one">1</span>').join('')}</i><b>${safe(spec.ones)} 個</b></div></div>`;
      break;
    case 'vertical':
      html = `<div class="practice-vertical"><span>${safe(spec.a)}</span><span><b>${safe(spec.operator)}</b>${safe(Math.abs(spec.b))}</span><i></i><strong>□</strong></div>${spec.trail ? `<div class="practice-trail">${spec.trail.map((value) => `<span>${safe(value)}</span>`).join('<b>→</b>')}</div>` : ''}`;
      break;
    case 'groups': {
      const counts = spec.counts || Array.from({ length: spec.groups }, () => spec.each);
      html = `<div class="practice-groups">${counts.map((count, index) => `<div><small>第 ${index + 1} 組</small><i>${dots(count, spec.icon)}</i><strong>${safe(count)} 個</strong></div>`).join('')}</div>`;
      break;
    }
    case 'ruler': {
      const max = Math.max(1, Number(spec.max) || 10);
      html = `<div class="practice-ruler"><div class="practice-ruler-segment" style="--left:${(spec.start / max) * 100}%;--width:${(Math.abs(spec.end - spec.start) / max) * 100}%"></div>${Array.from({ length: max + 1 }, (_, index) => `<span><i></i><b>${index}</b></span>`).join('')}</div>`;
      break;
    }
    case 'capacity': {
      const max = Math.max(...spec.values, 1);
      html = `<div class="practice-capacity">${spec.values.map((value, index) => `<div><strong>${safe(spec.labels[index])}</strong><i><u style="height:${(value / max) * 100}%"></u></i><span>${safe(value)} 杯</span></div>`).join('')}</div>`;
      break;
    }
    case 'clock': {
      const hourAngle = ((spec.hour % 12) + spec.minute / 60) * 30;
      const minuteAngle = spec.minute * 6;
      html = `<div class="practice-clock"><i class="hour" style="transform:rotate(${hourAngle}deg)"></i><i class="minute" style="transform:rotate(${minuteAngle}deg)"></i><b></b>${Array.from({ length: 12 }, (_, index) => `<span style="--n:${index + 1}">${index + 1}</span>`).join('')}</div>`;
      break;
    }
    case 'timeline':
      html = `<div class="practice-timeline"><strong>${safe(spec.start)}</strong><i><span>${safe(spec.minutes)} 分鐘</span></i><strong>${safe(spec.end)}</strong></div>`;
      break;
    case 'area-grid':
      html = `<div class="practice-areas">${spec.areas.map((area, index) => `<div><strong>${safe(spec.labels[index])}</strong><i>${Array.from({ length: Math.min(area, 24) }, () => '<span></span>').join('')}</i><b>${safe(area)} 格</b></div>`).join('')}</div>`;
      break;
    default:
      html = '<p>仔細看圖，再想一想。</p>';
  }
  container.innerHTML = html;
  container.hidden = false;
}

function renderVisual(spec) {
  const model = buildVisualModel(spec);
  const dots = (count) => Array.from({ length: count }, () => '<i></i>').join('');
  let html = '';
  switch (model.type) {
    case 'numberline':
      html = `<div class="numberline">${Array.from({ length: model.end - model.start + 1 }, (_, i) => `<span class="${model.start + i === model.focus ? 'focus' : ''}">${model.start + i}</span>`).join('')}</div>`;
      break;
    case 'place-value':
      html = `<div class="place-value"><div><b>${model.hundreds}</b><span>百</span><i>${dots(model.hundreds)}</i></div><div><b>${model.tens}</b><span>十</span><i>${dots(model.tens)}</i></div><div><b>${model.ones}</b><span>一</span><i>${dots(model.ones)}</i></div></div><p class="visual-answer">${model.value}＝${model.hundreds * 100}＋${model.tens * 10}＋${model.ones}</p>`;
      break;
    case 'money':
      html = `<div class="money"><div>${Array.from({ length: model.hundreds }, () => '<i class="bill">100</i>').join('')}</div><div>${Array.from({ length: model.tens }, () => '<i>10</i>').join('')}</div><div>${Array.from({ length: model.ones }, () => '<i>1</i>').join('')}</div></div><p class="visual-answer">${model.hundreds * 100 + model.tens * 10 + model.ones} 元</p>`;
      break;
    case 'arithmetic':
      html = `<div class="arithmetic"><span>${model.a}</span><span><small>${model.operator}</small>${model.b}</span><b>${model.result}${model.unit ? ` ${model.unit}` : ''}</b></div>`;
      break;
    case 'comparison':
      html = `<div class="comparison"><b>${model.left}</b><em>${model.left > model.right ? '＞' : model.left < model.right ? '＜' : '＝'}</em><b>${model.right}</b></div>`;
      break;
    case 'part-whole':
      html = `<div class="part-whole"><b>${model.total}<small>全體</small></b><span>＝</span>${model.parts.map((part) => `<i>${part}<small>部分</small></i>`).join('<span>＋</span>')}</div>`;
      break;
    case 'compare-bars':
      html = `<div class="compare-bars">${model.lengths.map((length, index) => `<div><span>${index ? '橡皮擦' : '鉛筆'}</span><i style="width:${length * 9}%"></i><b>${length} 格</b></div>`).join('')}</div>`;
      break;
    case 'units':
      html = `<div class="unit-strips"><div><span>小單位</span><i>${dots(model.smallCount)}</i><b>${model.smallCount} 個</b></div><div class="large"><span>大單位</span><i>${dots(model.largeCount)}</i><b>${model.largeCount} 個</b></div></div>`;
      break;
    case 'ruler': {
      html = `<div class="ruler-wrap"><div class="measured-object ${model.object || ''}" style="--left:${model.leftPercent}%;--width:${model.widthPercent}%">${model.object === 'pencil' ? '<span></span>' : ''}</div><div class="ruler">${Array.from({ length: model.max + 1 }, (_, i) => `<span><i></i><b>${i}</b></span>`).join('')}</div><p>從 ${model.start} 到 ${model.end}：${Math.max(model.start, model.end)}－${Math.min(model.start, model.end)}＝<strong>${model.length} 公分</strong></p></div>`;
      break;
    }
    case 'capacity': {
      const max = Math.max(...model.values);
      html = `<div class="capacity">${model.values.map((value, index) => `<div><span>${model.labels[index]}</span><i><u style="height:${(value / max) * 100}%"></u></i><b>${value} 杯</b></div>`).join('')}</div>`;
      break;
    }
    case 'two-step':
      html = `<div class="two-step">${model.values.map((value, index) => `${index ? `<span>${model.steps[index - 1] >= 0 ? '+' : ''}${model.steps[index - 1]}</span>` : ''}<b>${value}</b>`).join('')}</div>`;
      break;
    case 'groups':
      html = `<div class="groups">${Array.from({ length: model.groups }, (_, i) => `<div aria-label="第 ${i + 1} 組">${dots(model.each)}</div>`).join('')}</div><p class="visual-answer">${model.each} × ${model.groups}＝${model.total}</p>`;
      break;
    case 'clock':
      html = `<div class="clock"><div class="hand hour" style="transform:rotate(${model.hourAngle}deg)"></div><div class="hand minute" style="transform:rotate(${model.minuteAngle}deg)"></div><i></i>${Array.from({ length: 12 }, (_, i) => `<span style="--n:${i + 1}">${i + 1}</span>`).join('')}</div><p class="visual-answer">${model.hour} 時 ${String(model.minute).padStart(2, '0')} 分</p>`;
      break;
    case 'timeline':
      html = `<div class="time-line"><b>${model.start}</b><i><u></u></i><b>${model.end}</b></div><p class="visual-answer">經過 ${model.minutes} 分鐘</p>`;
      break;
    case 'area-compare':
      html = `<div class="area-compare"><i style="--size:${model.areas[0]}">${model.labels[0]}</i><i style="--size:${model.areas[1]}">${model.labels[1]}</i></div>`;
      break;
    case 'area':
      html = `<div class="area-grid" style="--columns:${model.columns}">${Array.from({ length: model.unitCount }, (_, i) => `<i>${i + 1}</i>`).join('')}</div><p class="visual-answer">${model.rows} × ${model.columns}＝${model.unitCount} 格</p>`;
      break;
    default:
      html = '<p>仔細觀察，再把想法說出來。</p>';
  }
  elements.visual.innerHTML = html;
  elements.visual.classList.remove('is-replaying');
  requestAnimationFrame(() => elements.visual.classList.add('is-replaying'));
}

function openUnit(index) {
  currentUnitIndex = index;
  renderUnit();
  show('unit');
}

function openLesson(index) {
  const unit = SEMESTER_COURSE.units[currentUnitIndex];
  if (!canOpenSemesterLesson(progress, unit.id, index)) return;
  currentLessonIndex = index;
  renderLesson();
  show('lesson');
}

function speak(text) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const voiceText = new SpeechSynthesisUtterance(text);
  voiceText.lang = 'zh-TW';
  voiceText.rate = 0.88;
  voiceText.pitch = 1.05;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('zh-TW'));
  if (voice) voiceText.voice = voice;
  window.speechSynthesis.speak(voiceText);
}

function tone(success) {
  if (!soundOn) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = new AudioContext();
  (success ? [523, 659, 784] : [330, 294]).forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, audio.currentTime + index * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + index * 0.1 + 0.2);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + index * 0.1);
    oscillator.stop(audio.currentTime + index * 0.1 + 0.22);
  });
}

const skillStateLabels = {
  not_started: '還沒開始', guided: '需要引導', practicing: '再練一次', mastered: '已精熟', needs_review: '需要複習',
};

function saveLearnerStore() {
  localStorage.setItem(learnerStorageKey, JSON.stringify(learnerStore));
}

function persistAdaptiveSession() {
  if (!adaptiveSession || adaptiveSession.completed) return;
  learnerStore = recordGuidedSession(learnerStore, learnerStore.activeProfileId, adaptiveSession);
  saveLearnerStore();
  adaptiveSkill = null;
  adaptiveSession = null;
}

function renderAdaptiveHub(message = '') {
  if (!activeAdaptiveUnit) return;
  const profile = activeProfile();
  $('#adaptive-learner-label').textContent = `${profile.avatar} ${profile.nickname}，今天想修復哪一個地方？`;
  $('#island-restoration').innerHTML = activeAdaptiveUnit.skills.map((skill) => {
    const restored = profile.restoredScenes.includes(skill.id);
    return `<div class="island-scene ${restored ? 'restored' : ''}"><span aria-hidden="true">${restored ? '✨' : '🌫️'}</span><strong>${skill.scene}</strong><small>${restored ? '已修復' : '等你點亮'}</small></div>`;
  }).join('');
  const title = message || '選一個能力開始練習';
  $('#adaptive-hub-title').textContent = title;
  $('#adaptive-skill-list').innerHTML = activeAdaptiveUnit.skills.map((skill) => {
    const state = profile.skills[skill.id]?.state || 'not_started';
    return `<button class="adaptive-skill-card ${state === 'mastered' ? 'mastered' : ''}" data-adaptive-skill="${skill.id}">
      <span aria-hidden="true">${skill.icon}</span><div><small>${skillStateLabels[state] || '正在學習'}</small><h3>${skill.title}</h3><p>${skill.goal}</p></div><b aria-hidden="true">→</b>
    </button>`;
  }).join('');
  $('#adaptive-hub').hidden = false;
  $('#adaptive-question').hidden = true;
}

function openAdaptive() {
  const unit = SEMESTER_COURSE.units[currentUnitIndex];
  activeAdaptiveUnit = getAdaptiveUnit(unit.id);
  if (!activeAdaptiveUnit) return;
  adaptiveSkill = null;
  adaptiveSession = null;
  $('#back-adaptive-unit').textContent = `← 回到第 ${unit.number} 單元`;
  $('#adaptive-unit-label').textContent = activeAdaptiveUnit.title;
  $('#adaptive-title').textContent = activeAdaptiveUnit.intro;
  renderAdaptiveHub();
  show('adaptive');
}

function startAdaptiveSkill(skillId) {
  adaptiveSkill = activeAdaptiveUnit?.skills.find((skill) => skill.id === skillId);
  if (!adaptiveSkill) return;
  adaptiveSession = createGuidedSession(adaptiveSkill.questions, adaptiveSkill.id);
  $('#adaptive-hub').hidden = true;
  $('#adaptive-question').hidden = false;
  renderAdaptiveStep();
  speak(`現在練習${adaptiveSkill.title}。${adaptiveSkill.questions[0].narration}`);
}

function renderAdaptiveStep(feedbackText = '', feedbackKind = '') {
  if (!adaptiveSkill || !adaptiveSession) return;
  const question = adaptiveSkill.questions[adaptiveSession.questionIndex];
  const step = currentGuidedStep(adaptiveSession, adaptiveSkill.questions);
  const stepNames = activeAdaptiveUnit?.stepLabels || {};
  $('#adaptive-step-label').textContent = `第 ${adaptiveSession.stepIndex + 1} 步，共 5 步`;
  $('#adaptive-step-track').innerHTML = question.steps.map((item, index) =>
    `<i class="${index < adaptiveSession.stepIndex ? 'done' : index === adaptiveSession.stepIndex ? 'current' : ''}"><span>${index + 1}</span><small>${stepNames[item.id]}</small></i>`).join('');
  $('#adaptive-narration-text').textContent = question.narration;
  $('#adaptive-kind-label').textContent = stepNames[step.id];
  $('#adaptive-prompt').textContent = step.prompt;
  const model = question.steps.find((item) => item.id === 'model')?.answer;
  $('#adaptive-model').hidden = adaptiveSession.stepIndex < 2;
  $('#adaptive-model').textContent = model || '';
  $('#adaptive-options').innerHTML = step.kind === 'listen' ? '' : step.options.map((option, index) =>
    `<button class="adaptive-option" data-adaptive-option="${index}">${option}</button>`).join('');
  $('#adaptive-continue').hidden = step.kind !== 'listen';
  const feedback = $('#adaptive-feedback');
  feedback.textContent = feedbackText;
  feedback.className = `adaptive-feedback ${feedbackKind}`.trim();
}

function answerAdaptive(choiceIndex) {
  const step = currentGuidedStep(adaptiveSession, adaptiveSkill.questions);
  const choice = step.options[choiceIndex];
  adaptiveSession = answerGuidedStep(adaptiveSession, adaptiveSkill.questions, choice);
  if (!adaptiveSession.feedback?.correct) {
    tone(false);
    renderAdaptiveStep(`需要一個小線索：${adaptiveSession.feedback.hint}`, 'retry');
    return;
  }
  tone(true);
  if (adaptiveSession.completed) {
    learnerStore = recordGuidedSession(learnerStore, learnerStore.activeProfileId, adaptiveSession);
    saveProgress();
    renderAdaptiveHub(`答對了！${adaptiveSkill.scene}已經修復 ✨`);
    speak(`答對了！你已經學會${adaptiveSkill.title}，${adaptiveSkill.scene}修復了。`);
    return;
  }
  const message = adaptiveSession.feedback?.questionCompleted
    ? '答對了！接著試試不同的新情境。'
    : '答對了！我們再往下一小步。';
  renderAdaptiveStep(message, 'success');
  if (adaptiveSession.stepIndex === 0) speak(adaptiveSkill.questions[adaptiveSession.questionIndex].narration);
}

function renderProfiles() {
  $('#profile-list').innerHTML = Object.values(learnerStore.profiles).map((profile) =>
    `<button data-profile-id="${escapeHtml(profile.id)}" class="profile-choice ${profile.id === learnerStore.activeProfileId ? 'active' : ''}"><span>${escapeHtml(profile.avatar)}</span><strong>${escapeHtml(profile.nickname)}</strong><small>${profile.id === learnerStore.activeProfileId ? '目前使用' : '切換到這裡'}</small></button>`).join('');
}

function switchProfile(profileId) {
  learnerStore = setActiveLearner(learnerStore, profileId);
  progress = activeProfile().semesterProgress;
  saveLearnerStore();
  $('#profile-dialog').close();
  renderUnitGrid();
  show('home');
}

function renderParentReport() {
  const profile = activeProfile();
  const allSkills = ADAPTIVE_COURSE.units.flatMap((unit) => unit.skills);
  const mastered = allSkills.filter((skill) => profile.skills[skill.id]?.state === 'mastered').length;
  const started = allSkills.filter((skill) => (profile.skills[skill.id]?.state || 'not_started') !== 'not_started').length;
  $('#parent-report-title').textContent = `${profile.avatar} ${profile.nickname}的二上數學進度`;
  $('#parent-report-summary').textContent = `已開始 ${started} / ${allSkills.length} 項能力，其中 ${mastered} 項已精熟。`;
  $('#parent-report-content').innerHTML = ADAPTIVE_COURSE.units.map((unit, index) => {
    const report = buildParentReport(profile, unit.skills);
    const unitStarted = report.filter((item) => item.state !== 'not_started').length;
    return `<details class="parent-report-unit" ${unitStarted > 0 || index === 0 ? 'open' : ''}>
      <summary><strong>${escapeHtml(unit.title.replace('引導探險', ''))}</strong><span>${unitStarted} / ${report.length} 已開始</span></summary>
      <div>${report.map((item) => `<article>
        <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.stateLabel)}</span></div>
        <p><b>目前觀察：</b>${escapeHtml(item.commonError)}</p><p><b>下次建議：</b>${escapeHtml(item.recommendation)}</p>
      </article>`).join('')}</div>
    </details>`;
  }).join('');
}

elements.unitGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-unit]');
  if (button) openUnit(Number(button.dataset.unit));
});
elements.lessonMap.addEventListener('click', (event) => {
  const button = event.target.closest('[data-lesson]');
  if (button) openLesson(Number(button.dataset.lesson));
});
elements.nav.addEventListener('click', (event) => {
  const button = event.target.closest('[data-nav]');
  if (button) openLesson(Number(button.dataset.nav));
});
$('#adaptive-start').addEventListener('click', openAdaptive);
$('#adaptive-skill-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-adaptive-skill]');
  if (button) startAdaptiveSkill(button.dataset.adaptiveSkill);
});
$('#adaptive-options').addEventListener('click', (event) => {
  const button = event.target.closest('[data-adaptive-option]');
  if (button) answerAdaptive(Number(button.dataset.adaptiveOption));
});
$('#adaptive-continue').addEventListener('click', () => {
  adaptiveSession = advanceGuidedStep(adaptiveSession, adaptiveSkill.questions);
  renderAdaptiveStep('聽完了！現在先看清楚這題的關鍵。', 'success');
});
$('#adaptive-listen').addEventListener('click', () => {
  if (adaptiveSkill && adaptiveSession) speak(adaptiveSkill.questions[adaptiveSession.questionIndex].narration);
});
$('#adaptive-exit').addEventListener('click', () => {
  persistAdaptiveSession();
  renderAdaptiveHub();
});
$('#back-adaptive-unit').addEventListener('click', () => {
  persistAdaptiveSession();
  renderUnit();
  show('unit');
});
function submitPracticeAnswer(answer, sourceElement = null) {
  const unit = SEMESTER_COURSE.units[currentUnitIndex];
  const question = currentQuestions[practiceSession.current];
  practiceSession = answerPracticeQuestion(practiceSession, currentQuestions, answer);
  const correct = practiceSession.lastCorrect;
  [...$('#question-options').children].forEach((option) => { option.disabled = true; });
  $('#question-input').disabled = true;
  $('#question-submit').disabled = true;
  sourceElement?.classList.add(correct ? 'correct' : 'wrong');
  if (correct) {
    elements.feedback.textContent = `答對了！${question.explain}`;
    elements.feedback.className = 'feedback success';
    tone(true);
    $('#practice-progress-bar').style.width = `${(practiceSession.correct / currentQuestions.length) * 100}%`;
    $('#practice-progress').textContent = `答對 ${practiceSession.correct} / ${currentQuestions.length} 題`;
    if (practiceSession.completed) {
      progress = recordSemesterCompletion(progress, unit.id, currentLessonIndex);
      saveProgress();
      renderNav();
      updateStars();
      const last = currentLessonIndex === unit.lessons.length - 1;
      $('#next-button').disabled = last;
      elements.feedback.textContent = `整組完成！${question.explain} 你把每一題都想清楚了。`;
      if (last) {
        $('#celebration-title').textContent = `${unit.title}，15 題總挑戰完成！`;
        setTimeout(() => elements.celebration.showModal(), 650);
      }
    } else {
      $('#practice-next').hidden = false;
    }
  } else {
    elements.feedback.textContent = `還差一點點。${question.explain} 再想一次，你可以的。`;
    elements.feedback.className = 'feedback retry';
    tone(false);
    setTimeout(() => {
      [...$('#question-options').children].forEach((option) => { option.disabled = false; option.classList.remove('wrong'); });
      $('#question-input').disabled = false;
      $('#question-input').classList.remove('wrong');
      $('#question-submit').disabled = false;
      if (question.responseType === 'input') {
        $('#question-input').select();
      }
    }, 900);
  }
}

$('#question-options').addEventListener('click', (event) => {
  const button = event.target.closest('[data-answer]');
  if (button) submitPracticeAnswer(button.dataset.answer, button);
});
$('#question-input-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#question-input');
  if (!input.value.trim()) {
    elements.feedback.textContent = '先把答案填進空格，再按送出。';
    elements.feedback.className = 'feedback retry';
    input.focus();
    return;
  }
  submitPracticeAnswer(input.value, input);
});

$('#home-button').addEventListener('click', () => { renderUnitGrid(); show('home'); });
$('#back-home').addEventListener('click', () => { renderUnitGrid(); show('home'); });
$('#back-unit').addEventListener('click', () => { renderUnit(); show('unit'); });
$('#prev-button').addEventListener('click', () => openLesson(currentLessonIndex - 1));
$('#next-button').addEventListener('click', () => openLesson(currentLessonIndex + 1));
$('#practice-next').addEventListener('click', renderPracticeQuestion);
$('#replay-button').addEventListener('click', () => renderVisual(SEMESTER_COURSE.units[currentUnitIndex].lessons[currentLessonIndex].visual));
$('#story-listen').addEventListener('click', () => { const s = SEMESTER_COURSE.units[currentUnitIndex].story; speak(`${s.title}。${s.opening}${s.dialogue}${s.closing}`); });
$('#lesson-listen').addEventListener('click', () => { const l = SEMESTER_COURSE.units[currentUnitIndex].lessons[currentLessonIndex]; speak(`${l.title}。${l.goal}${l.storyBeat}${l.steps.join('。')}請記住：${l.remember}`); });
elements.sound.addEventListener('click', () => {
  soundOn = !soundOn;
  elements.sound.textContent = soundOn ? '🔊' : '🔇';
  elements.sound.setAttribute('aria-pressed', String(soundOn));
  elements.sound.setAttribute('aria-label', soundOn ? '關閉聲音' : '開啟聲音');
  if (!soundOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
});
$('#dialog-close').addEventListener('click', () => elements.celebration.close());
$('#celebration-home').addEventListener('click', () => { elements.celebration.close(); renderUnitGrid(); show('home'); });

$('#profile-button').addEventListener('click', () => { renderProfiles(); $('#profile-dialog').showModal(); });
$('#profile-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-profile-id]');
  if (button) switchProfile(button.dataset.profileId);
});
$('#profile-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const nickname = $('#profile-nickname').value.trim();
  if (!nickname) return;
  learnerStore = addLearnerProfile(
    learnerStore,
    { nickname, avatar: $('#profile-avatar-choice').value },
    createSemesterProgress(SEMESTER_COURSE),
    skillIds,
  );
  progress = activeProfile().semesterProgress;
  saveLearnerStore();
  $('#profile-form').reset();
  $('#profile-dialog').close();
  renderUnitGrid();
  show('home');
});

$('#parent-report-button').addEventListener('click', () => {
  $('#gate-feedback').textContent = '';
  $('#adult-gate').showModal();
});
$('#adult-gate').addEventListener('click', (event) => {
  const button = event.target.closest('[data-gate-answer]');
  if (!button) return;
  if (button.dataset.gateAnswer !== '12') {
    $('#gate-feedback').textContent = '答案不對，請大人再試一次。';
    return;
  }
  $('#adult-gate').close();
  renderParentReport();
  $('#parent-report').showModal();
});
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => {
  $(`#${button.dataset.closeDialog}`).close();
}));

renderUnitGrid();
