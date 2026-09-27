import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-7';
const things = ['餅乾', '橘子', '貼紙', '星星', '松果', '小燈', '積木', '車輪'];

const multiplicationSkill = ({ id, title, icon, scene, goal, recommendation, eachValues, groupValues }) => createSkill({
  unitId, id, title, icon, scene, goal, recommendation,
  rows: groupValues.map((groups, index) => [eachValues[index], groups]),
  build: ([each, groups], index) => {
    const total = each * groups;
    return {
      narration: `每組有 ${each} 個${things[index]}，一共排了 ${groups} 組，全部有多少？`,
      concept: { prompt: '「幾個一樣多」可以用什麼運算簡單表示？', answer: '乘法', options: ['只用減法', '大小比較'], errorTag: 'multiplication-meaning' },
      model: { prompt: '哪一個模型符合題意？', answer: `${groups} 組，每組 ${each} 個`, options: [`${each} 組，總共 ${groups} 個`, `${groups + each} 組，每組 1 個`], errorTag: 'multiplication-groups' },
      method: { prompt: '哪一個算式可以找出總數？', answer: `${each}×${groups}`, options: [`${each}＋${groups}`, `${groups}－${each}`], errorTag: 'multiplication-expression' },
      answer: { prompt: `${each}×${groups}是多少？`, answer: total, options: [each + groups, total - each], errorTag: 'multiplication-fact' },
    };
  },
});

const multiples = createSkill({
  unitId, id: 'multiples', title: '說出幾的幾倍', icon: '🎯', scene: '掛好倍數靶牌',
  goal: '看懂每組一樣多，用「幾的幾倍」說明組數。', recommendation: '用圈圈把每組框起來，數一數共有幾組。',
  rows: [[3, 4], [2, 6], [5, 3], [4, 5], [2, 8], [3, 7], [5, 4], [4, 6]],
  build: ([each, groups], index) => ({
    narration: `每盤 ${each} 個${things[index]}，共有 ${groups} 盤，這是 ${each} 的幾倍？`,
    concept: { prompt: '「幾倍」是在數什麼？', answer: '有幾組一樣多', options: ['每組的顏色', '全部有幾個'], errorTag: 'multiple-meaning' },
    model: { prompt: '哪一個分組正確？', answer: `${groups} 組，每組 ${each} 個`, options: [`${each} 組，每組 ${groups} 個`, `1 組，共 ${each + groups} 個`], errorTag: 'multiplication-groups' },
    method: { prompt: `${each} 的 ${groups} 倍可以寫成什麼？`, answer: `${each}×${groups}`, options: [`${each}＋${groups}`, `${groups}－${each}`], errorTag: 'multiplication-expression' },
    answer: { prompt: `這是 ${each} 的幾倍？`, answer: groups, options: [each, each * groups], errorTag: 'multiple-count' },
  }),
});

const twoAndFive = multiplicationSkill({
  id: 'two-five', title: '用跳數學 2 和 5 的乘法', icon: '🐾', scene: '踏亮二五跳格路',
  goal: '用二個一組、五個一組與跳數理解乘法答案。', recommendation: '交替用 2 個與 5 個物品分組，指著每組跳數。',
  eachValues: [2, 5, 2, 5, 2, 5, 2, 5], groupValues: [6, 4, 8, 5, 7, 6, 9, 8],
});

const four = multiplicationSkill({
  id: 'four', title: '用加倍理解 4 的乘法', icon: '🍀', scene: '種滿四葉幸運園',
  goal: '看懂四個一組，也能用 2 的乘法再加倍檢查。', recommendation: '把每組 4 個先分成兩小組 2 個，再比較答案。',
  eachValues: Array(8).fill(4), groupValues: [2, 3, 4, 5, 6, 7, 8, 9],
});

export const UNIT7_ADAPTIVE = {
  unitId, title: '乘法（一）引導探險', intro: '先看見幾個一樣多，再讓乘法成為加法的快速列車。',
  stepLabels: standardStepLabels('找分組', '圈組數', '寫乘法'), skills: [multiples, twoAndFive, four],
};
