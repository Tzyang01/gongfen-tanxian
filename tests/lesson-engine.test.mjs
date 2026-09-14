import test from 'node:test';
import assert from 'node:assert/strict';

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
