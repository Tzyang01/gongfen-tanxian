import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  calculateLength,
  createProgress,
  recordAnswer,
  canOpenLesson,
  getFinalResult,
  LESSON_BLUEPRINT,
  evaluateChoice,
  scoreQuiz,
  restoreProgress,
  COURSE_CATALOG,
  getCoursePath,
  LESSON_ENRICHMENTS,
  createRulerMeasurement,
} from '../dist/lesson-engine.js';

test('用直尺兩端刻度的差算出物品長度', () => {
  assert.equal(calculateLength(0, 7), 7);
  assert.equal(calculateLength(3, 9), 6);
});

test('倒置的起終點仍能得到正確長度', () => {
  assert.equal(calculateLength(9, 3), 6);
});

test('答對後獲得星星並開啟下一關', () => {
  const progress = createProgress(7);
  const next = recordAnswer(progress, 0, true);

  assert.equal(next.stars, 1);
  assert.equal(next.completed[0], true);
  assert.equal(canOpenLesson(next, 1), true);
});

test('答錯不扣星星，也不會提早開啟下一關', () => {
  const progress = createProgress(7);
  const next = recordAnswer(progress, 0, false);

  assert.equal(next.stars, 0);
  assert.equal(next.completed[0], false);
  assert.equal(canOpenLesson(next, 1), false);
});

test('重複答對同一關不會重複增加星星', () => {
  const once = recordAnswer(createProgress(7), 0, true);
  const twice = recordAnswer(once, 0, true);

  assert.equal(twice.stars, 1);
});

test('完成七關會得到公分達人稱號', () => {
  let progress = createProgress(7);
  for (let index = 0; index < 7; index += 1) {
    progress = recordAnswer(progress, index, true);
  }

  assert.deepEqual(getFinalResult(progress), {
    completed: true,
    title: '公分達人',
    message: '你會比較、測量、畫線，也會算長度了！',
  });
});

test('課程藍圖依序包含翰林單元四項核心能力與統整活動', () => {
  assert.deepEqual(
    LESSON_BLUEPRINT.map((lesson) => lesson.id),
    ['compare', 'units', 'centimeter', 'measure', 'draw', 'calculate', 'challenge'],
  );
});

test('選擇題會比較數值而不是字串型別', () => {
  assert.equal(evaluateChoice('7', 7), true);
  assert.equal(evaluateChoice('9', 7), false);
});

test('選擇題也能正確比較國語文字答案', () => {
  assert.equal(evaluateChoice('比較少', '比較少'), true);
  assert.equal(evaluateChoice('比較多', '比較少'), false);
});

test('總挑戰以五題中的答對數計分', () => {
  assert.equal(scoreQuiz([true, true, false, true, false]), 3);
});

test('載入損壞的進度資料時會安全地重新開始', () => {
  assert.deepEqual(restoreProgress('{not-json}', 7), createProgress(7));
  assert.deepEqual(restoreProgress('{"stars":99,"completed":[true]}', 7), createProgress(7));
});

test('首頁課程路徑依序提供年紀、分類與單元', () => {
  assert.deepEqual(getCoursePath('grade2-math-centimeter'), {
    age: '7～8 歲',
    grade: '二年級',
    category: '數學',
    unit: '第三單元',
    title: '認識公分',
  });
});

test('找不到課程時不會回傳錯誤的課程路徑', () => {
  assert.equal(getCoursePath('unknown-course'), null);
  assert.equal(COURSE_CATALOG.length, 1);
});

test('七個關卡都有完整的圖文教學素材', () => {
  assert.equal(LESSON_ENRICHMENTS.length, 7);
  for (const lesson of LESSON_ENRICHMENTS) {
    assert.equal(typeof lesson.storyTitle, 'string');
    assert.ok(lesson.storyText.length >= 30);
    assert.equal(lesson.steps.length, 3);
    assert.ok(lesson.mistake.length >= 15);
    assert.ok(lesson.remember.length >= 10);
    assert.match(lesson.image, /^assets\/.+\.(png|jpg)$/);
    assert.ok(lesson.imageAlt.length >= 10);
  }
});

test('七關共用三組一致的故事插畫', () => {
  assert.equal(new Set(LESSON_ENRICHMENTS.map((lesson) => lesson.image)).size, 3);
});

test('七個關卡都有專屬且可重播的教學動畫設定', () => {
  assert.deepEqual(
    LESSON_ENRICHMENTS.map((lesson) => lesson.demoType),
    ['compare', 'units', 'centimeter', 'measure', 'draw', 'calculate', 'challenge'],
  );
  for (const lesson of LESSON_ENRICHMENTS) {
    assert.ok(lesson.demoTitle.length >= 6);
    assert.ok(lesson.demoCaption.length >= 15);
  }
});

test('刻度 2 到 9 的鉛筆動畫端點與長度都精確一致', () => {
  assert.deepEqual(createRulerMeasurement(2, 9, 10), {
    start: 2,
    end: 9,
    max: 10,
    length: 7,
    startPercent: 20,
    endPercent: 90,
    spanPercent: 70,
  });
});

test('積木與彩帶動畫的數量及比例使用正確數學資料', () => {
  assert.deepEqual(LESSON_ENRICHMENTS[1].demoData, {
    smallUnitCount: 8,
    largeUnitCount: 4,
    equalTotalLength: true,
  });
  assert.deepEqual(LESSON_ENRICHMENTS[5].demoData, {
    firstLength: 8,
    secondLength: 5,
    totalLength: 13,
  });
});

test('每一關都有角色對話和帶情感的故事收束', () => {
  for (const lesson of LESSON_ENRICHMENTS) {
    assert.ok(lesson.storyText.length >= 55);
    assert.ok(lesson.dialogue.length >= 12);
    assert.ok(lesson.storyClosing.length >= 25);
  }
});

test('活動尺上的鉛筆尖端不會超過終點刻度', () => {
  const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
  assert.match(styles, /\.measure-object\s*\{[^}]*width:\s*calc\(var\(--length\) \* 10% - 18px\)/s);
});
