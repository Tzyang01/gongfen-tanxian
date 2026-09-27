const uniqueOptions = (answer, options = []) => [answer, ...options].filter((option, index, items) =>
  items.findIndex((candidate) => String(candidate) === String(option)) === index);

const choiceStep = (id, spec) => ({
  id,
  kind: 'choice',
  prompt: spec.prompt,
  answer: spec.answer,
  options: uniqueOptions(spec.answer, spec.options),
  errorTag: spec.errorTag,
  hints: spec.hints || [
    '先慢慢看題目在問什麼，不要急著猜。',
    '把題目裡的數量或圖形一個一個對好。',
    `這一步的正確想法是「${spec.answer}」。`,
  ],
});

export function createGuidedQuestion({ id, skillId, narration, concept, model, method, answer }) {
  return {
    id,
    skillId,
    narration,
    audioSrc: null,
    steps: [
      { id: 'listen', kind: 'listen', prompt: narration },
      choiceStep('concept', concept),
      choiceStep('model', model),
      choiceStep('method', method),
      choiceStep('answer', answer),
    ],
  };
}

export function createSkill({ unitId, id, title, icon, scene, goal, recommendation, rows, build }) {
  const skillId = `${unitId}:${id}`;
  return {
    id: skillId,
    title,
    icon,
    scene,
    goal,
    recommendation,
    questions: rows.map((row, index) => createGuidedQuestion({
      id: `${unitId}-${id}-${index + 1}`,
      skillId,
      ...build(row, index),
    })),
  };
}

export const standardStepLabels = (concept, model, method) => ({
  listen: '聽題', concept, model, method, answer: '選答案',
});

