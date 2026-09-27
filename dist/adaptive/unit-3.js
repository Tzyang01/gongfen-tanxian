import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-3';
const objects = ['鉛筆', '彩帶', '書籤', '吸管', '繩子', '紙條', '粉蠟', '積木條'];

const fairMeasure = createSkill({
  unitId, id: 'fair-measure', title: '用相同起點與單位測量', icon: '📐', scene: '鋪平公平測量路',
  goal: '比較時對齊起點，測量時使用一樣大的單位且不留縫。', recommendation: '拿兩個物品實際對齊一端，再用相同積木排滿。',
  rows: [[8, 5], [6, 9], [7, 4], [10, 8], [5, 3], [9, 6], [4, 7], [11, 10]],
  build: ([first, second], index) => {
    const longer = first > second ? objects[index] : '比較物';
    return {
      narration: `${objects[index]}長 ${first} 個相同積木，比較物長 ${second} 個，要公平比長短。`,
      concept: { prompt: '直接比長短前最先要做什麼？', answer: '對齊同一個起點', options: ['只對齊終點', '把物品斜著放'], errorTag: 'measurement-start' },
      model: { prompt: '用積木測量時應該怎麼排？', answer: '相同大小、首尾相接', options: ['大小不同混著排', '中間留很多縫'], errorTag: 'measurement-unit' },
      method: { prompt: '同一長度改用較大的單位，個數通常會怎樣？', answer: '變少', options: ['變多', '一定不變'], errorTag: 'measurement-unit-size' },
      answer: { prompt: `對齊起點後，${first} 格與 ${second} 格哪一個較長？`, answer: longer, options: [longer === objects[index] ? '比較物' : objects[index], '一樣長'], errorTag: 'length-comparison' },
    };
  },
});

const ruler = createSkill({
  unitId, id: 'ruler', title: '讀尺與畫出指定長度', icon: '📏', scene: '修好公分小屋',
  goal: '理解公分是兩條刻度間的距離，用終點減起點讀長度。', recommendation: '每次先指出起點與終點，再念「終點減起點」。',
  rows: [[0, 6], [2, 9], [1, 8], [3, 10], [4, 9], [2, 7], [5, 10], [1, 6]],
  build: ([start, end], index) => {
    const length = end - start;
    return {
      narration: `${objects[index]}左端在刻度 ${start}，右端在刻度 ${end}，請找出實際長度。`,
      concept: { prompt: '尺上相鄰兩個整數刻度之間是多長？', answer: '1 公分', options: ['1 條刻度', '10 公分'], errorTag: 'centimeter-concept' },
      model: { prompt: '測量前要先確認哪兩個位置？', answer: '起點和終點', options: ['只看終點', '只看數字顏色'], errorTag: 'ruler-endpoints' },
      method: { prompt: '物品不從 0 開始時，怎麼算長度？', answer: '終點刻度－起點刻度', options: ['終點刻度＋起點刻度', '直接把終點當長度'], errorTag: 'ruler-subtraction' },
      answer: { prompt: `從刻度 ${start} 到 ${end}長幾公分？`, answer: length, options: [length + 1, Math.max(1, length - 1)], errorTag: 'calculation' },
    };
  },
});

const lengthMath = createSkill({
  unitId, id: 'length-math', title: '長度合成、拿走與比較', icon: '🧵', scene: '接好彩帶吊橋',
  goal: '看懂長度是合起來、拿走或求相差，並記得寫公分。', recommendation: '先用紙條模擬合成或剪掉，再列算式。',
  rows: [[8, 5, '+'], [14, 6, '-'], [7, 9, '+'], [18, 7, '-'], [6, 8, '+'], [20, 9, '-'], [11, 4, '+'], [17, 8, '-']],
  build: ([a, b, operator], index) => {
    const result = operator === '+' ? a + b : a - b;
    const combined = operator === '+';
    return {
      narration: combined ? `把 ${a} 公分與 ${b} 公分的${objects[index]}接起來，總長多少？` : `${objects[index]}原長 ${a} 公分，剪掉 ${b} 公分，還剩多長？`,
      concept: { prompt: '這個故事的長度是怎麼變化？', answer: combined ? '兩段合起來' : '從原長拿走一段', options: [combined ? '從原長拿走一段' : '兩段合起來', '只比數字大小'], errorTag: 'length-situation' },
      model: { prompt: '哪一個圖式關係正確？', answer: combined ? `?＝${a}＋${b}` : `${a}＝${b}＋?`, options: [combined ? `${a}＝${b}＋?` : `?＝${a}＋${b}`, `${a}＝${b}`], errorTag: 'length-model' },
      method: { prompt: '應該使用哪一種運算？', answer: combined ? '加法' : '減法', options: [combined ? '減法' : '加法', '只數刻度'], errorTag: 'operation-choice' },
      answer: { prompt: '最後的長度是多少公分？', answer: result, options: [a + b + (combined ? 1 : 0), Math.abs(a - b) + (combined ? 0 : 1)], errorTag: 'calculation' },
    };
  },
});

export const UNIT3_ADAPTIVE = {
  unitId, title: '認識公分引導探險', intro: '對齊起點、用一樣的單位，讓每一次測量都公平又準確。',
  stepLabels: standardStepLabels('看測量', '擺工具', '選方法'), skills: [fairMeasure, ruler, lengthMath],
};
