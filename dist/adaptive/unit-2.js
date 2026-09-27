import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-2';
const things = ['班級點數', '貼紙', '松果', '車票', '彩帶', '書本', '積木', '星星'];
const additionRows = [[27, 15], [36, 28], [47, 35], [58, 24], [69, 17], [45, 38], [76, 16], [57, 29]];
const subtractionRows = [[52, 27], [61, 34], [73, 48], [80, 26], [92, 57], [64, 39], [85, 47], [71, 56]];

const addition = createSkill({
  unitId, id: 'addition', title: '個位滿十要進位', icon: '➕', scene: '修好加法電梯',
  goal: '位值對齊後處理個位滿十，把一個十加到十位。', recommendation: '用積木實際把十個一捆成一個十。',
  rows: additionRows,
  build: ([a, b], index) => {
    const result = a + b;
    const ones = (a % 10) + (b % 10);
    return {
      narration: `上午收集 ${a} 個${things[index]}，下午又收集 ${b} 個，一共有多少？`,
      concept: { prompt: '直式加法先要做什麼？', answer: '個位對個位，十位對十位', options: ['數字全部靠左', '只看最大的數'], errorTag: 'place-alignment' },
      model: { prompt: `個位 ${a % 10}＋${b % 10}＝${ones}，要怎麼整理？`, answer: `寫 ${ones % 10}，進 1 個十`, options: [`寫 ${ones}，不進位`, '把 1 個十丟掉'], errorTag: 'addition-carry' },
      method: { prompt: '進位的 1 要放在哪裡？', answer: '十位', options: ['個位右邊', '不用放'], errorTag: 'addition-carry' },
      answer: { prompt: `${a}＋${b}是多少？`, answer: result, options: [result - 10, result + 10], errorTag: 'calculation' },
    };
  },
});

const subtraction = createSkill({
  unitId, id: 'subtraction', title: '個位不夠減要退位', icon: '➖', scene: '搭好退位小橋',
  goal: '從十位換一個十成十個一，並記得十位已少一。', recommendation: '用十條換成十個單位積木，再做減法。',
  rows: subtractionRows,
  build: ([a, b], index) => {
    const result = a - b;
    return {
      narration: `原有 ${a} 個${things[index]}，送出 ${b} 個，還剩多少？`,
      concept: { prompt: '個位不夠減時怎麼辦？', answer: '從十位換一個十', options: ['把減數改小', '直接把大數減小數'], errorTag: 'subtraction-regroup' },
      model: { prompt: `${a % 10} 個一不夠減 ${b % 10}，換完後有幾個一？`, answer: (a % 10) + 10, options: [a % 10, (a % 10) + 1], errorTag: 'subtraction-regroup' },
      method: { prompt: '換了一個十之後，原來的十位怎麼變？', answer: '少 1 個十', options: ['多 1 個十', '完全不變'], errorTag: 'subtraction-tens' },
      answer: { prompt: `${a}－${b}是多少？`, answer: result, options: [result + 10, Math.max(0, result - 10)], errorTag: 'calculation' },
    };
  },
});

const comparison = createSkill({
  unitId, id: 'comparison', title: '從高位比數的大小', icon: '⚖️', scene: '掛好公平比較牌',
  goal: '先比十位，相同時再比個位，正確使用＞、＜、＝。', recommendation: '用位值表從左到右比較，再把完整關係讀一次。',
  rows: [[92, 89], [47, 74], [63, 63], [58, 56], [71, 79], [84, 48], [35, 35], [69, 70]],
  build: ([left, right], index) => {
    const symbol = left > right ? '＞' : left < right ? '＜' : '＝';
    const distinguishingPlace = left === right
      ? '兩個數每一位都相同'
      : Math.floor(left / 10) === Math.floor(right / 10) ? '個位' : '十位';
    return {
      narration: `${things[index]}紀錄牌上有 ${left} 和 ${right}，請判斷兩個數的關係。`,
      concept: { prompt: '比較兩位數應該先比哪一位？', answer: '十位', options: ['個位', '從最後隨便比'], errorTag: 'comparison-place' },
      model: { prompt: `從高位比較 ${left} 和 ${right}，會發現什麼？`, answer: distinguishingPlace, options: ['只看百位就能區分', '只看數字顏色就能區分'], errorTag: 'comparison-place' },
      method: { prompt: '比較符號的大開口應該朝哪裡？', answer: '較大的數', options: ['較小的數', '永遠朝右'], errorTag: 'comparison-symbol' },
      answer: { prompt: `${left} 和 ${right} 中間應放哪個符號？`, answer: symbol, options: ['＞', '＜', '＝'].filter((item) => item !== symbol), errorTag: 'comparison-symbol' },
    };
  },
});

export const UNIT2_ADAPTIVE = {
  unitId, title: '二位數的加減法引導探險', intro: '先對齊位值，再看清楚進位、退位和大小關係。',
  stepLabels: standardStepLabels('看位值', '擺直式', '選方法'), skills: [addition, subtraction, comparison],
};
