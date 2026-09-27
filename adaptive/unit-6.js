import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-6';
const items = ['書本', '貼紙', '松果', '班級點數', '彩帶', '票券', '積木', '星星'];

const makeTwoStepSkill = ({ id, title, icon, scene, goal, recommendation, rows }) => createSkill({
  unitId, id, title, icon, scene, goal, recommendation, rows,
  build: ([start, first, second], index) => {
    const firstValue = start + first;
    const result = firstValue + second;
    const firstText = first >= 0 ? `＋${first}` : `－${Math.abs(first)}`;
    const secondText = second >= 0 ? `＋${second}` : `－${Math.abs(second)}`;
    const firstAction = first >= 0 ? '先增加' : '先減少';
    const secondAction = second >= 0 ? '再增加' : '再減少';
    return {
      narration: `原有 ${start} 個${items[index]}，${firstAction} ${Math.abs(first)} 個，${secondAction} ${Math.abs(second)} 個，最後有多少？`,
      concept: { prompt: '兩步驟題應該按什麼順序算？', answer: '按故事發生的先後', options: ['先算數字較大的', '隨便選一步'], errorTag: 'two-step-order' },
      model: { prompt: '哪一條數量軌跡正確？', answer: `${start} → ${firstValue} → ${result}`, options: [`${start} → ${result} → ${firstValue}`, `${start} → ${start - first} → ${result}`], errorTag: 'two-step-model' },
      method: { prompt: '哪一個連續算式和故事相同？', answer: `${start}${firstText}${secondText}`, options: [`${start}${secondText}${firstText}`, `${start}${first >= 0 ? '−' : '＋'}${Math.abs(first)}${secondText}`], errorTag: 'two-step-operation' },
      answer: { prompt: '最後有多少？', answer: result, options: [firstValue, result + (second >= 0 ? -10 : 10)], errorTag: 'calculation' },
    };
  },
});

const addTwice = makeTwoStepSkill({
  id: 'add-twice', title: '依序完成兩次增加', icon: '📚', scene: '填滿兩層書架',
  goal: '把兩次增加依序記錄，第一步答案要帶到第二步。', recommendation: '畫三個站點：開始、第一步後、第二步後。',
  rows: [[25, 13, 8], [34, 12, 15], [18, 24, 17], [41, 16, 9], [27, 18, 14], [36, 25, 11], [19, 32, 16], [44, 17, 18]],
});

const subtractTwice = makeTwoStepSkill({
  id: 'subtract-twice', title: '依序完成兩次減少', icon: '📤', scene: '整理兩站借閱台',
  goal: '依序記錄兩次拿走，不把兩個減數誤當成答案。', recommendation: '每減一次就寫下當時還剩多少。',
  rows: [[80, -24, -16], [75, -18, -22], [92, -37, -15], [68, -19, -24], [84, -26, -17], [71, -23, -18], [96, -28, -35], [63, -17, -29]],
});

const mixed = makeTwoStepSkill({
  id: 'mixed', title: '跟著故事做加減兩步', icon: '🪜', scene: '搭好兩步驟探險梯',
  goal: '分辨每一步是增加或減少，按時間順序列式。', recommendation: '把故事分成兩句，每句只決定一個運算。',
  rows: [[46, 18, -29], [52, -17, 23], [38, 26, -19], [67, -24, 18], [29, 35, -27], [74, -36, 25], [43, 28, -31], [61, -22, 34]],
});

export const UNIT6_ADAPTIVE = {
  unitId, title: '加減兩步驟引導探險', intro: '把故事分成兩段，完成第一步再帶著答案往下走。',
  stepLabels: standardStepLabels('分兩步', '畫軌跡', '列算式'), skills: [addTwice, subtractTwice, mixed],
};

