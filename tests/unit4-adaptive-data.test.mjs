import test from 'node:test';
import assert from 'node:assert/strict';

const AdaptiveData = await import('../dist/unit4-adaptive-data.js').catch(() => ({}));

test('第四單元引導課程提供三項能力與題庫', () => {
  assert.ok(AdaptiveData.UNIT4_ADAPTIVE);
  assert.equal(AdaptiveData.UNIT4_ADAPTIVE.skills.length, 3);
  assert.deepEqual(
    AdaptiveData.UNIT4_ADAPTIVE.skills.map((skill) => skill.id),
    ['part-whole', 'choose-operation', 'inverse-check'],
  );
});

test('每項能力至少八個原創情境且依序完成五個小步驟', () => {
  const allQuestions = AdaptiveData.UNIT4_ADAPTIVE.skills.flatMap((skill) => skill.questions);
  assert.equal(allQuestions.length, 24);
  assert.equal(new Set(allQuestions.map((question) => question.id)).size, 24);
  assert.equal(new Set(allQuestions.map((question) => question.narration)).size, 24);

  for (const skill of AdaptiveData.UNIT4_ADAPTIVE.skills) {
    assert.equal(skill.questions.length, 8);
    assert.ok(skill.goal.length >= 10);
    for (const question of skill.questions) {
      assert.equal(question.skillId, skill.id);
      assert.equal(question.audioSrc, null);
      assert.ok(question.narration.length >= 16);
      assert.deepEqual(question.steps.map((step) => step.id), ['listen', 'relationship', 'model', 'operation', 'answer']);
      for (const step of question.steps.filter((step) => step.kind !== 'listen')) {
        assert.equal(step.hints.length, 3);
        assert.ok(step.errorTag);
        assert.ok(step.options.includes(step.answer));
        assert.equal(new Set(step.options.map(String)).size, step.options.length);
      }
    }
  }
});
