import { SEMESTER_COURSE } from './course-data.js';
import {
  answerPracticeQuestion,
  buildPracticeSet,
  buildVisualModel,
  canOpenSemesterLesson,
  createPracticeSession,
  recordSemesterCompletion,
  restoreSemesterProgress,
} from './semester-engine.js';

const $ = (selector) => document.querySelector(selector);
const storageKey = 'grade2-semester1-math-progress-v1';
let progress = restoreSemesterProgress(localStorage.getItem(storageKey), SEMESTER_COURSE);
let currentUnitIndex = 0;
let currentLessonIndex = 0;
let soundOn = true;
let currentQuestions = [];
let practiceSession = null;

const elements = {
  home: $('#home-view'), unit: $('#unit-view'), lesson: $('#lesson-view'), unitGrid: $('#unit-grid'),
  star: $('#star-count'), total: $('#star-total'), lessonMap: $('#lesson-map'), nav: $('#lesson-nav'),
  celebration: $('#celebration'), sound: $('#sound-toggle'), visual: $('#math-visual'), feedback: $('#feedback'),
};

const unitProgress = (unit) => progress.units[unit.id];
const completedTotal = () => Object.values(progress.units).reduce((sum, item) => sum + item.stars, 0);
const lessonTotal = () => SEMESTER_COURSE.units.reduce((sum, unit) => sum + unit.lessons.length, 0);

function saveProgress() {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

function show(view) {
  elements.home.hidden = view !== 'home';
  elements.unit.hidden = view !== 'unit';
  elements.lesson.hidden = view !== 'lesson';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStars() {
  elements.star.textContent = completedTotal();
  elements.total.textContent = `/ ${lessonTotal()}`;
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
  elements.lessonMap.innerHTML = unit.lessons.map((item, index) => {
    const open = canOpenSemesterLesson(progress, unit.id, index);
    const done = state.completed[index];
    return `<button class="lesson-map-card" data-lesson="${index}" ${open ? '' : 'disabled'}>
      <span class="lesson-status">${done ? '★' : open ? String(index + 1) : '🔒'}</span>
      <div><small>${item.kind === 'challenge' ? '統整挑戰 · 10 題' : `${item.code} · 4 題練習`}</small><h3>${item.title}</h3><p>${item.goal}</p></div>
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
  $('#question-options').innerHTML = question.options.map((option) => `<button data-answer="${String(option)}">${option}</button>`).join('');
  $('#practice-next').hidden = true;
  elements.feedback.textContent = '';
  elements.feedback.className = 'feedback';
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
$('#question-options').addEventListener('click', (event) => {
  const button = event.target.closest('[data-answer]');
  if (!button) return;
  const unit = SEMESTER_COURSE.units[currentUnitIndex];
  const item = unit.lessons[currentLessonIndex];
  const question = currentQuestions[practiceSession.current];
  practiceSession = answerPracticeQuestion(practiceSession, currentQuestions, button.dataset.answer);
  const correct = practiceSession.lastCorrect;
  [...$('#question-options').children].forEach((option) => { option.disabled = true; });
  button.classList.add(correct ? 'correct' : 'wrong');
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
        $('#celebration-title').textContent = `${unit.title}，10 題總挑戰完成！`;
        setTimeout(() => elements.celebration.showModal(), 650);
      }
    } else {
      $('#practice-next').hidden = false;
    }
  } else {
    elements.feedback.textContent = `還差一點點。${question.explain} 再想一次，你可以的。`;
    elements.feedback.className = 'feedback retry';
    tone(false);
    setTimeout(() => { [...$('#question-options').children].forEach((option) => { option.disabled = false; option.classList.remove('wrong'); }); }, 900);
  }
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

renderUnitGrid();
