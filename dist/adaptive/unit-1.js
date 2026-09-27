import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-1';
const contexts = ['松果', '貼紙', '書籤', '積木', '星星', '葉片', '彈珠', '車票'];

const counting = createSkill({
  unitId, id: 'counting', title: '找到數的下一站', icon: '🚂', scene: '點亮數字車站',
  goal: '從 100 往上數，遇到個位 9 時能正確跨到下一個十。', recommendation: '用數線每次往右走一格，並說出位值的變化。',
  rows: [99, 109, 119, 129, 149, 169, 189, 199],
  build: (start, index) => {
    const result = start + 1;
    return {
      narration: `森林小鋪已數到 ${start} 個${contexts[index]}，再多 1 個會是多少？`,
      concept: { prompt: '數到個位是 9，再多 1 會發生什麼事？', answer: '十個一換成一個十', options: ['個位繼續寫 10', '十位要減 1'], errorTag: 'place-value-carry' },
      model: { prompt: '哪一個算式表示再往後數一個？', answer: `${start}＋1`, options: [`${start}＋10`, `${start}－1`], errorTag: 'number-sequence' },
      method: { prompt: '數線上應該怎麼移動？', answer: '往右一格', options: ['往左一格', '往右十格'], errorTag: 'number-line-direction' },
      answer: { prompt: `${start} 再多 1 是多少？`, answer: result, options: [start + 10, Number(`${start}0`)], errorTag: 'number-sequence' },
    };
  },
});

const placeValue = createSkill({
  unitId, id: 'place-value', title: '百、十、一各就各位', icon: '🧱', scene: '蓋好位值城堡',
  goal: '把 200 以內的數拆成幾個百、幾個十和幾個一。', recommendation: '先擺百格、十條和單個積木，再寫數字。',
  rows: [104, 117, 132, 146, 150, 168, 179, 200],
  build: (value, index) => {
    const hundreds = Math.floor(value / 100);
    const tens = Math.floor((value % 100) / 10);
    const ones = value % 10;
    return {
      narration: `第 ${index + 1} 輛積木車送來 ${value} 個零件，請把百、十、一分類。`,
      concept: { prompt: '哪一個位值要先數？', answer: '百位', options: ['個位', '小數點'], errorTag: 'place-value-order' },
      model: { prompt: `哪一組積木是 ${value}？`, answer: `${hundreds} 百、${tens} 十、${ones} 一`, options: [`${hundreds} 百、${ones} 十、${tens} 一`, `${hundreds + 1} 百、${tens} 十、${ones} 一`, `${hundreds} 百、${tens + 1} 十、${ones} 一`], errorTag: 'place-value-model' },
      method: { prompt: '位值數字代表什麼？', answer: '在那個位置有幾個單位', options: ['數字的顏色', '數字的筆畫'], errorTag: 'place-value-meaning' },
      answer: { prompt: `${hundreds} 個百、${tens} 個十、${ones} 個一合起來是多少？`, answer: value, options: [value + 10, Math.max(0, value - 10)], errorTag: 'place-value-calculation' },
    };
  },
});

const money = createSkill({
  unitId, id: 'money', title: '付出剛剛好的錢', icon: '🪙', scene: '開啟森林收銀機',
  goal: '用 100、10 和 1 元組成指定金額，不只數張數。', recommendation: '先從百元開始付，再用十元和一元補齊。',
  rows: [105, 118, 124, 137, 152, 166, 180, 199],
  build: (value, index) => {
    const hundreds = Math.floor(value / 100);
    const tens = Math.floor((value % 100) / 10);
    const ones = value % 10;
    return {
      narration: `森林小鋪的${contexts[index]}售價 ${value} 元，請付出剛剛好的金額。`,
      concept: { prompt: '付錢時為什麼要看面額？', answer: '每張或每枚錢的價值不同', options: ['只要張數一樣就好', '顏色決定金額'], errorTag: 'money-value' },
      model: { prompt: `哪組錢是 ${value} 元？`, answer: `${hundreds} 張百元、${tens} 個十元、${ones} 個一元`, options: [`${hundreds} 張百元、${ones} 個十元、${tens} 個一元`, `${hundreds + 1} 張百元、${tens} 個十元、${ones} 個一元`, `${hundreds} 張百元、${tens + 1} 個十元、${ones} 個一元`], errorTag: 'money-model' },
      method: { prompt: '哪一個順序最容易付正確？', answer: '先百元，再十元，最後一元', options: ['只用一元慢慢數', '先猜一張錢'], errorTag: 'money-strategy' },
      answer: { prompt: `100×${hundreds}＋10×${tens}＋1×${ones}是多少元？`, answer: value, options: [value + 10, Math.max(0, value - 10)], errorTag: 'money-calculation' },
    };
  },
});

export const UNIT1_ADAPTIVE = {
  unitId, title: '200 以內的數引導探險', intro: '讓百、十、一排好隊，大數字也能一步一步看懂。',
  stepLabels: standardStepLabels('找規律', '擺模型', '選方法'), skills: [counting, placeValue, money],
};
