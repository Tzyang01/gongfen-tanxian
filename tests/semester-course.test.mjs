import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { SEMESTER_COURSE } from '../dist/course-data.js';
import * as SemesterEngine from '../dist/semester-engine.js';

const {
  buildVisualModel,
  canOpenSemesterLesson,
  createSemesterProgress,
  recordSemesterCompletion,
} = SemesterEngine;

const expectedUnits = [
  ['200 以內的數', ['1-1 數到 200', '1-2 幾個百、幾個十、幾個一', '1-3 付錢']],
  ['二位數的加減法', ['2-1 二位數的加法', '2-2 二位數的減法', '2-3 等於、大於和小於']],
  ['認識公分', ['3-1 個別單位', '3-2 認識公分', '3-3 量一量，畫一畫']],
  ['加減應用', ['4-1 加法和減法的關係', '4-2 解題和驗算']],
  ['容量', ['5-1 認識容量', '5-2 容量的比較']],
  ['加減兩步驟', ['6-1 加法兩步驟', '6-2 減法兩步驟', '6-3 加減兩步驟']],
  ['乘法（一）', ['7-1 幾的幾倍', '7-2 2 和 5 的乘法', '7-3 4 的乘法']],
  ['時間', ['8-1 認識鐘面', '8-2 報讀時刻', '8-3 點數經過的時間']],
  ['乘法（二）', ['9-1 3 的乘法', '9-2 6 的乘法', '9-3 7 的乘法']],
  ['面的大小比較', ['10-1 面的直接比較', '10-2 面的間接比較']],
];

test('二上數學依序包含十個單元與公開課程小節', () => {
  assert.equal(SEMESTER_COURSE.units.length, 10);
  assert.deepEqual(
    SEMESTER_COURSE.units.map((unit) => [unit.title, unit.curriculumSections]),
    expectedUnits,
  );
});

test('每個單元都有完整敘事、圖片、分段課程與總挑戰', () => {
  for (const unit of SEMESTER_COURSE.units) {
    assert.ok(unit.story.title.length >= 5);
    assert.ok(unit.story.opening.length >= 55);
    assert.ok(unit.story.dialogue.length >= 12);
    assert.ok(unit.story.closing.length >= 30);
    assert.match(unit.image, /^assets\/.+\.(jpg|png)$/);
    assert.ok(unit.lessons.length >= unit.curriculumSections.length + 1);
    assert.equal(unit.lessons.at(-1).kind, 'challenge');
    for (const lesson of unit.lessons) {
      assert.equal(lesson.steps.length, 3);
      assert.ok(lesson.remember.length >= 8);
      assert.ok(lesson.visual.type);
      assert.ok(lesson.question.options.length >= 2);
      assert.ok(lesson.question.options.includes(lesson.question.answer));
    }
  }
});

test('各單元進度分開保存，完成一課只增加一次星星', () => {
  const original = createSemesterProgress(SEMESTER_COURSE);
  const once = recordSemesterCompletion(original, 'unit-1', 0);
  const twice = recordSemesterCompletion(once, 'unit-1', 0);

  assert.equal(once.units['unit-1'].stars, 1);
  assert.equal(twice.units['unit-1'].stars, 1);
  assert.equal(once.units['unit-2'].stars, 0);
  assert.equal(canOpenSemesterLesson(once, 'unit-1', 1), true);
  assert.equal(canOpenSemesterLesson(original, 'unit-1', 1), false);
});

test('精確視覺模型會計算加減、乘法、時間與面積', () => {
  assert.deepEqual(buildVisualModel({ type: 'arithmetic', a: 47, b: 35, operator: '+' }).result, 82);
  assert.deepEqual(buildVisualModel({ type: 'arithmetic', a: 83, b: 46, operator: '-' }).result, 37);
  assert.deepEqual(buildVisualModel({ type: 'groups', groups: 4, each: 6 }).total, 24);
  assert.deepEqual(buildVisualModel({ type: 'clock', hour: 7, minute: 30 }), {
    type: 'clock', hour: 7, minute: 30, minuteAngle: 180, hourAngle: 225,
  });
  assert.deepEqual(buildVisualModel({ type: 'area', rows: 3, columns: 5 }).unitCount, 15);
});

test('兩步驟與位值模型不依賴畫面猜答案', () => {
  assert.deepEqual(buildVisualModel({ type: 'two-step', start: 46, steps: [18, -29] }).values, [46, 64, 35]);
  assert.deepEqual(buildVisualModel({ type: 'place-value', value: 146 }), {
    type: 'place-value', value: 146, hundreds: 1, tens: 4, ones: 6,
  });
});

test('公分尺模型的物件兩端精確落在起點與終點刻度', () => {
  assert.deepEqual(buildVisualModel({ type: 'ruler', start: 2, end: 9, max: 10 }), {
    type: 'ruler', start: 2, end: 9, max: 10,
    length: 7, leftPercent: 20, widthPercent: 70, rightPercent: 90,
  });
});

test('一般課程固定八題，單元挑戰固定十五題，並混合輸入與圖像題', () => {
  assert.equal(typeof SemesterEngine.buildPracticeSet, 'function');
  for (const unit of SEMESTER_COURSE.units) {
    for (const lesson of unit.lessons) {
      const questions = SemesterEngine.buildPracticeSet(lesson, unit.lessons);
      assert.equal(questions.length, lesson.kind === 'challenge' ? 15 : 8);
      assert.equal(new Set(questions.map((question) => question.prompt)).size, questions.length);
      assert.ok(new Set(questions.map((question) => question.level)).size >= 4);
      assert.ok(questions.every((question) => ['choice', 'input'].includes(question.responseType)));
      assert.ok(questions.filter((question) => question.visual).length >= 2);
      if (lesson.kind !== 'challenge') {
        assert.ok(questions.filter((question) => question.responseType === 'input').length >= 2);
      }
      for (const question of questions) {
        if (question.responseType === 'choice') {
          assert.ok(question.options.length >= 2);
          assert.equal(new Set(question.options.map(String)).size, question.options.length);
          assert.ok(question.options.includes(question.answer));
        }
        assert.ok(question.explain.length >= 8);
      }
    }
  }
});

test('每一節選擇題的正確答案平均分散，不能靠固定選第一個通關', () => {
  for (const unit of SEMESTER_COURSE.units) {
    for (const lesson of unit.lessons) {
      const questions = SemesterEngine.buildPracticeSet(lesson, unit.lessons)
        .filter((question) => question.responseType === 'choice');
      for (const optionCount of new Set(questions.map((question) => question.options.length))) {
        const positions = questions
          .filter((question) => question.options.length === optionCount)
          .map((question) => question.options.indexOf(question.answer));
        const frequency = Array.from({ length: optionCount }, (_, index) =>
          positions.filter((position) => position === index).length);
        assert.ok(
          Math.max(...frequency) - Math.min(...frequency) <= 1,
          `${unit.title}／${lesson.title} 的 ${optionCount} 選項正解位置不平均：${frequency.join(',')}`,
        );
      }
    }
  }
});

test('同一單元各節不共用可背誦的正解位置順序', () => {
  for (const unit of SEMESTER_COURSE.units) {
    const signatures = unit.lessons
      .filter((lesson) => lesson.kind !== 'challenge')
      .map((lesson) => SemesterEngine.buildPracticeSet(lesson, unit.lessons)
        .filter((question) => question.responseType === 'choice' && question.options.length === 3)
        .map((question) => question.options.indexOf(question.answer) + 1)
        .join(''));
    assert.ok(new Set(signatures).size > 1, `${unit.title} 的各節正解順序完全相同：${signatures[0]}`);
  }
});

test('第一單元的付錢練習使用獨立錢幣情境，不重複位值題模板', () => {
  const [numberLesson, placeValueLesson, moneyLesson] = SEMESTER_COURSE.units[0].lessons;
  const numberPrompts = new Set(SemesterEngine.buildPracticeSet(numberLesson).map((question) => question.prompt));
  const placeValuePrompts = new Set(SemesterEngine.buildPracticeSet(placeValueLesson).map((question) => question.prompt));
  const moneyQuestions = SemesterEngine.buildPracticeSet(moneyLesson);
  const moneyVisualQuestions = moneyQuestions.filter((question) => question.visual);

  assert.equal(moneyVisualQuestions.length, 4);
  assert.ok(moneyVisualQuestions.every((question) => question.visual.type === 'money'));
  assert.ok(moneyVisualQuestions.every((question) => !numberPrompts.has(question.prompt)));
  assert.ok(moneyVisualQuestions.every((question) => !placeValuePrompts.has(question.prompt)));
});

test('圖像題覆蓋照片參考的主要數學呈現方式', () => {
  const visualTypes = new Set(SEMESTER_COURSE.units.flatMap((unit) => unit.lessons)
    .flatMap((lesson) => SemesterEngine.buildPracticeSet(lesson).map((question) => question.visual?.type))
    .filter(Boolean));
  for (const type of ['sequence', 'place-value', 'money', 'vertical', 'groups', 'ruler', 'capacity', 'clock', 'timeline', 'area-grid']) {
    assert.ok(visualTypes.has(type), `缺少 ${type} 圖像題`);
  }
});

test('輸入作答接受全形數字與多餘空白', () => {
  assert.equal(typeof SemesterEngine.normalizePracticeAnswer, 'function');
  assert.equal(SemesterEngine.normalizePracticeAnswer('１２３ '), '123');
  assert.equal(SemesterEngine.normalizePracticeAnswer('  45  '), '45');
  assert.equal(SemesterEngine.normalizePracticeAnswer('３ 時 ０５ 分'), '3 時 05 分');
});

test('練習題要逐題答對，完成整組後才算通過課程', () => {
  assert.equal(typeof SemesterEngine.createPracticeSession, 'function');
  assert.equal(typeof SemesterEngine.answerPracticeQuestion, 'function');
  const questions = [
    { answer: 3 },
    { answer: '較多' },
    { answer: 8 },
    { answer: 12 },
  ];
  let session = SemesterEngine.createPracticeSession(questions);
  assert.deepEqual(session, { current: 0, correct: 0, completed: false });

  session = SemesterEngine.answerPracticeQuestion(session, questions, 4);
  assert.deepEqual(session, { current: 0, correct: 0, completed: false, lastCorrect: false });

  for (const question of questions) {
    session = SemesterEngine.answerPracticeQuestion(session, questions, question.answer);
  }
  assert.deepEqual(session, { current: 3, correct: 4, completed: true, lastCorrect: true });
});

test('課程畫面顯示題數進度，並提供學生主動前往下一題的按鈕', () => {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="practice-progress"/);
  assert.match(html, /id="practice-next"/);
  assert.match(html, /id="question-visual"/);
  assert.match(html, /id="question-input"/);
  assert.match(html, /id="question-submit"/);
  assert.match(app, /buildPracticeSet/);
  assert.match(app, /answerPracticeQuestion/);
  assert.match(app, /submitPracticeAnswer/);
  assert.match(app, /renderPracticeVisual/);
});
