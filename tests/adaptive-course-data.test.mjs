import test from 'node:test';
import assert from 'node:assert/strict';

import { SEMESTER_COURSE } from '../dist/course-data.js';

const AdaptiveData = await import('../dist/adaptive-course-data.js').catch(() => ({}));

test('適性課程依序覆蓋二上全部十個單元', () => {
  assert.ok(AdaptiveData.ADAPTIVE_COURSE);
  assert.equal(typeof AdaptiveData.getAdaptiveUnit, 'function');
  assert.deepEqual(
    AdaptiveData.ADAPTIVE_COURSE.units.map((unit) => unit.unitId),
    SEMESTER_COURSE.units.map((unit) => unit.id),
  );
  for (const unit of SEMESTER_COURSE.units) {
    assert.equal(AdaptiveData.getAdaptiveUnit(unit.id)?.title.includes(unit.title), true);
  }
});

test('每單元三項能力、每項八個情境與五個引導步驟', () => {
  const units = AdaptiveData.ADAPTIVE_COURSE.units;
  const skills = units.flatMap((unit) => unit.skills);
  const questions = skills.flatMap((skill) => skill.questions);
  assert.equal(units.length, 10);
  assert.equal(skills.length, 30);
  assert.equal(questions.length, 240);
  assert.equal(questions.reduce((sum, question) => sum + question.steps.length, 0), 1200);
  assert.equal(new Set(skills.map((skill) => skill.id)).size, 30);
  assert.equal(new Set(questions.map((question) => question.id)).size, 240);
  assert.equal(new Set(questions.map((question) => question.narration)).size, 240);

  for (const unit of units) {
    assert.equal(unit.skills.length, 3);
    assert.equal(Object.keys(unit.stepLabels).length, 5);
    for (const skill of unit.skills) {
      assert.equal(skill.questions.length, 8);
      assert.ok(skill.title.length >= 4);
      assert.ok(skill.goal.length >= 10);
      assert.ok(skill.recommendation.length >= 8);
      for (const question of skill.questions) {
        assert.equal(question.skillId, skill.id);
        assert.equal(question.steps.length, 5);
        assert.equal(question.steps[0].kind, 'listen');
        for (const step of question.steps.slice(1)) {
          assert.equal(step.kind, 'choice');
          assert.equal(step.hints.length, 3);
          assert.ok(step.options.length >= 3);
          assert.equal(new Set(step.options.map(String)).size, step.options.length);
          assert.equal(step.options.map(String).includes(String(step.answer)), true);
          assert.ok(step.errorTag);
        }
      }
    }
  }
});

test('全單元能力 ID 可用於學習者進度初始化', () => {
  const ids = AdaptiveData.ADAPTIVE_COURSE.skillIds;
  assert.equal(ids.length, 30);
  assert.equal(new Set(ids).size, 30);
  assert.deepEqual(ids, AdaptiveData.ADAPTIVE_COURSE.units.flatMap((unit) => unit.skills.map((skill) => skill.id)));
});

test('容量倒入題正確解讀有剩、未滿與剛好裝滿', () => {
  const questions = AdaptiveData.getAdaptiveUnit('unit-5').skills
    .find((skill) => skill.id === 'unit-5:direct-pour').questions;
  assert.deepEqual(
    questions.map((question) => question.steps.at(-1).answer),
    ['第一個容器較大', '第二個容器較大', '兩個容量一樣大', '第二個容器較大', '第一個容器較大', '第一個容器較大', '第一個容器較大', '兩個容量一樣大'],
  );
});

test('經過時間題同時練習同一小時與跨整點', () => {
  const questions = AdaptiveData.getAdaptiveUnit('unit-8').skills
    .find((skill) => skill.id === 'unit-8:elapsed').questions;
  const crossHourQuestions = questions.filter((question) => {
    const times = question.narration.match(/(\d+):(\d{2})/g);
    return times && times[0].split(':')[0] !== times[1].split(':')[0];
  });
  assert.ok(crossHourQuestions.length >= 3);
  assert.ok(crossHourQuestions.every((question) => question.steps.find((step) => step.id === 'method').answer.includes('整點')));
});

test('兩數相等時會比對每一位，不會說個位能區分', () => {
  const questions = AdaptiveData.getAdaptiveUnit('unit-2').skills
    .find((skill) => skill.id === 'unit-2:comparison').questions;
  const equalQuestions = questions.filter((question) => question.steps.at(-1).answer === '＝');
  assert.equal(equalQuestions.length, 2);
  assert.ok(equalQuestions.every((question) => question.steps.find((step) => step.id === 'model').answer === '兩個數每一位都相同'));
});
