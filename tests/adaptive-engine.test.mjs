import test from 'node:test';
import assert from 'node:assert/strict';

const AdaptiveEngine = await import('../dist/adaptive-engine.js').catch(() => ({}));

test('引導式學習引擎提供可測試的公開介面', () => {
  assert.equal(typeof AdaptiveEngine.createGuidedSession, 'function');
  assert.equal(typeof AdaptiveEngine.answerGuidedStep, 'function');
  assert.equal(typeof AdaptiveEngine.advanceGuidedStep, 'function');
  assert.equal(typeof AdaptiveEngine.currentGuidedStep, 'function');
});

const sampleQuestions = [
  {
    id: 'whole-1', skillId: 'part-whole',
    steps: [
      { id: 'listen', prompt: '聽題目', kind: 'listen' },
      { id: 'relationship', prompt: '哪個是全體？', kind: 'choice', options: [75, 48], answer: 75, errorTag: 'whole-part-confusion', hints: ['找原來全部的數。', '看全體圖。', '全體是 75。'] },
      { id: 'answer', prompt: '還剩多少？', kind: 'choice', options: [27, 123], answer: 27, errorTag: 'operation-choice', hints: ['是變多還是變少？', '用全體減掉送出的。', '75－48＝27。'] },
    ],
  },
  {
    id: 'whole-2', skillId: 'part-whole',
    steps: [
      { id: 'listen', prompt: '聽題目', kind: 'listen' },
      { id: 'answer', prompt: '共有多少？', kind: 'choice', options: [64, 12], answer: 64, errorTag: 'operation-choice', hints: ['合起來。', '用加法。', '38＋26＝64。'] },
    ],
  },
];

test('建立回合時從聽題開始且沒有預先發獎', () => {
  const session = AdaptiveEngine.createGuidedSession(sampleQuestions, 'part-whole');
  assert.deepEqual(session, {
    skillId: 'part-whole', questionIndex: 0, stepIndex: 0, hintLevel: 0,
    usedHintOnQuestion: false, independentCorrectStreak: 0,
    status: 'guided', completed: false, errorCounts: {}, masteredSkill: null,
  });
  assert.equal(AdaptiveEngine.currentGuidedStep(session, sampleQuestions).id, 'listen');
});

test('答錯時留在原步驟並逐層提示與累計錯誤類型', () => {
  let session = AdaptiveEngine.createGuidedSession(sampleQuestions, 'part-whole');
  session = AdaptiveEngine.advanceGuidedStep(session, sampleQuestions);

  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 48);
  assert.equal(session.stepIndex, 1);
  assert.equal(session.hintLevel, 1);
  assert.equal(session.usedHintOnQuestion, true);
  assert.equal(session.errorCounts['whole-part-confusion'], 1);
  assert.equal(session.feedback.hint, '找原來全部的數。');

  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 48);
  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 48);
  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 48);
  assert.equal(session.hintLevel, 3);
  assert.equal(session.errorCounts['whole-part-confusion'], 4);
  assert.equal(session.feedback.hint, '全體是 75。');
});

test('使用提示完成不算精熟，兩題無提示的新情境才精熟', () => {
  let session = AdaptiveEngine.createGuidedSession(sampleQuestions, 'part-whole');
  session = AdaptiveEngine.advanceGuidedStep(session, sampleQuestions);
  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 48);
  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 75);
  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 27);

  assert.equal(session.questionIndex, 1);
  assert.equal(session.independentCorrectStreak, 0);
  assert.equal(session.status, 'guided');
  assert.equal(session.completed, false);

  session = AdaptiveEngine.advanceGuidedStep(session, sampleQuestions);
  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 64);
  assert.equal(session.independentCorrectStreak, 1);
  assert.equal(session.completed, false);
  assert.equal(session.questionIndex, 0);

  session = AdaptiveEngine.advanceGuidedStep(session, sampleQuestions);
  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 75);
  session = AdaptiveEngine.answerGuidedStep(session, sampleQuestions, 27);
  assert.equal(session.independentCorrectStreak, 2);
  assert.equal(session.completed, true);
  assert.equal(session.status, 'mastered');
  assert.equal(session.masteredSkill, 'part-whole');
});

test('學習者資料介面支援舊進度遷移與多角色', () => {
  assert.equal(typeof AdaptiveEngine.restoreLearnerStore, 'function');
  assert.equal(typeof AdaptiveEngine.addLearnerProfile, 'function');
  assert.equal(typeof AdaptiveEngine.setActiveLearner, 'function');
  assert.equal(typeof AdaptiveEngine.recordGuidedSession, 'function');
  assert.equal(typeof AdaptiveEngine.buildParentReport, 'function');
});

test('家長報告只顯示能力狀態、常見錯誤與下次建議', () => {
  const profile = {
    skills: {
      'part-whole': { state: 'guided', errorCounts: { 'whole-part-confusion': 3, calculation: 1 } },
      'choose-operation': { state: 'mastered', errorCounts: {} },
    },
  };
  const definitions = [
    { id: 'part-whole', title: '找到全體與部分', recommendation: '再畫一次關係圖。' },
    { id: 'choose-operation', title: '選擇加減', recommendation: '練習新情境。' },
  ];
  assert.deepEqual(AdaptiveEngine.buildParentReport(profile, definitions), [
    { skillId: 'part-whole', title: '找到全體與部分', state: 'guided', stateLabel: '需要引導', commonError: '容易混淆全體與部分', recommendation: '再畫一次關係圖。' },
    { skillId: 'choose-operation', title: '選擇加減', state: 'mastered', stateLabel: '已精熟', commonError: '尚未發現固定迷思', recommendation: '練習新情境。' },
  ]);
});

test('舊版單一進度會轉入預設角色且新角色互不影響', () => {
  const oldProgress = { units: { 'unit-4': { stars: 1, completed: [true, false, false] } } };
  let store = AdaptiveEngine.restoreLearnerStore(null, oldProgress, ['part-whole', 'choose-operation', 'inverse-check']);
  assert.equal(store.schemaVersion, 2);
  assert.equal(store.activeProfileId, 'learner-1');
  assert.equal(store.profiles['learner-1'].nickname, '小小探險家');
  assert.deepEqual(store.profiles['learner-1'].semesterProgress, oldProgress);
  assert.equal(store.profiles['learner-1'].skills['part-whole'].state, 'not_started');

  store = AdaptiveEngine.addLearnerProfile(store, { nickname: '小晴', avatar: '🐰' }, { units: {} });
  assert.equal(store.activeProfileId, 'learner-2');
  assert.equal(store.profiles['learner-2'].nickname, '小晴');
  assert.deepEqual(store.profiles['learner-2'].semesterProgress, { units: {} });
  assert.deepEqual(store.profiles['learner-1'].semesterProgress, oldProgress);

  store = AdaptiveEngine.setActiveLearner(store, 'learner-1');
  assert.equal(store.activeProfileId, 'learner-1');
});

test('已有的 v2 學習者資料會自動補上新能力與預設欄位', () => {
  const saved = {
    schemaVersion: 2,
    activeProfileId: 'learner-7',
    profiles: {
      'learner-7': {
        id: 'learner-7', nickname: '小宇', avatar: '🐯', semesterProgress: { units: {} },
        skills: { 'part-whole': { state: 'practicing', attempts: 2 } },
      },
    },
  };

  const restored = AdaptiveEngine.restoreLearnerStore(saved, { units: { legacy: true } }, ['part-whole', 'choose-operation']);
  const profile = restored.profiles['learner-7'];
  assert.equal(profile.skills['part-whole'].state, 'practicing');
  assert.equal(profile.skills['part-whole'].attempts, 2);
  assert.deepEqual(profile.skills['part-whole'].errorCounts, {});
  assert.equal(profile.skills['choose-operation'].state, 'not_started');
  assert.deepEqual(profile.restoredScenes, []);
  assert.deepEqual(profile.semesterProgress, { units: {} });
});

test('精熟能力只修復一次場景並合併錯誤統計', () => {
  const base = AdaptiveEngine.restoreLearnerStore(null, { units: {} }, ['part-whole']);
  const mastered = {
    ...AdaptiveEngine.createGuidedSession(sampleQuestions, 'part-whole'),
    completed: true,
    status: 'mastered',
    masteredSkill: 'part-whole',
    errorCounts: { 'whole-part-confusion': 2 },
  };
  const once = AdaptiveEngine.recordGuidedSession(base, 'learner-1', mastered, '2026-09-27T10:00:00.000Z');
  const twice = AdaptiveEngine.recordGuidedSession(once, 'learner-1', mastered, '2026-09-27T10:05:00.000Z');
  assert.equal(twice.profiles['learner-1'].skills['part-whole'].state, 'mastered');
  assert.equal(twice.profiles['learner-1'].skills['part-whole'].errorCounts['whole-part-confusion'], 4);
  assert.deepEqual(twice.profiles['learner-1'].restoredScenes, ['part-whole']);
  assert.equal(twice.profiles['learner-1'].skills['part-whole'].lastPracticedAt, '2026-09-27T10:05:00.000Z');

  const review = AdaptiveEngine.recordGuidedSession(twice, 'learner-1', {
    ...AdaptiveEngine.createGuidedSession(sampleQuestions, 'part-whole'),
    errorCounts: { calculation: 1 },
  }, '2026-09-27T10:10:00.000Z');
  assert.equal(review.profiles['learner-1'].skills['part-whole'].state, 'mastered');
  assert.equal(review.profiles['learner-1'].skills['part-whole'].independentCorrectStreak, 2);
  assert.deepEqual(review.profiles['learner-1'].restoredScenes, ['part-whole']);
});

test('中途離開時也會保留需要引導的狀態與錯誤紀錄', () => {
  const base = AdaptiveEngine.restoreLearnerStore(null, { units: {} }, ['part-whole']);
  const unfinished = {
    ...AdaptiveEngine.createGuidedSession(sampleQuestions, 'part-whole'),
    status: 'guided',
    errorCounts: { 'whole-part-confusion': 1 },
  };

  const stored = AdaptiveEngine.recordGuidedSession(base, 'learner-1', unfinished, '2026-09-27T11:00:00.000Z');
  const skill = stored.profiles['learner-1'].skills['part-whole'];
  assert.equal(skill.state, 'guided');
  assert.equal(skill.attempts, 1);
  assert.equal(skill.errorCounts['whole-part-confusion'], 1);
  assert.deepEqual(stored.profiles['learner-1'].restoredScenes, []);
});
