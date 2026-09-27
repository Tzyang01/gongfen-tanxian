import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-5';
const containers = ['藍色水壺', '黃色瓶子', '綠色水杯', '紅色水桶', '花園噴水壺', '透明量杯', '露營水壺', '教室飲水桶'];
const pairs = [[6, 4], [5, 8], [7, 3], [9, 6], [4, 7], [8, 5], [10, 6], [7, 9]];

const capacityConcept = createSkill({
  unitId, id: 'capacity-concept', title: '看懂容器能裝多少', icon: '🫧', scene: '喚醒口渴花園',
  goal: '理解容量是容器內部能裝多少，不被高矮或外形誤導。', recommendation: '選兩個形狀不同的容器，先猜再實際倒水比較。',
  rows: pairs,
  build: ([first, second], index) => ({
    narration: `${containers[index]}看起來很特別，實際可裝 ${first} 杯水；另一個容器可裝 ${second} 杯。`,
    concept: { prompt: '「容量」在說什麼？', answer: '容器能裝多少', options: ['容器有多高', '容器有多重'], errorTag: 'capacity-meaning' },
    model: { prompt: '哪一種方法能看見真正的容量？', answer: '裝滿後倒入或用杯子量', options: ['只看容器高度', '只看外面顏色'], errorTag: 'capacity-appearance' },
    method: { prompt: '高的容器一定裝得比較多嗎？', answer: '不一定，還要看寬度和形狀', options: ['一定比較多', '一定比較少'], errorTag: 'capacity-appearance' },
    answer: { prompt: `可裝 ${first} 杯與 ${second} 杯的容器，哪一個容量較大？`, answer: first > second ? `${first} 杯的容器` : `${second} 杯的容器`, options: [first > second ? `${second} 杯的容器` : `${first} 杯的容器`, '兩個一樣大'], errorTag: 'capacity-comparison' },
  }),
});

const directPour = createSkill({
  unitId, id: 'direct-pour', title: '用倒入法直接比較', icon: '🫗', scene: '打開流水小運河',
  goal: '把一個容器的水倒入另一個，依剩下或未滿判斷容量。', recommendation: '在水盆上做一次完整倒入，用「有剩」或「還沒滿」說明。',
  rows: [
    ['甲倒入乙後還有剩', '第一個容器較大'],
    ['乙倒入甲後還有剩', '第二個容器較大'],
    ['甲倒入乙剛好裝滿', '兩個容量一樣大'],
    ['甲全倒入乙後乙還沒滿', '第二個容器較大'],
    ['乙全倒入甲後甲還沒滿', '第一個容器較大'],
    ['紅壺倒入藍壺後有剩', '第一個容器較大'],
    ['大杯倒入小杯後滿出', '第一個容器較大'],
    ['兩杯互倒後都剛好裝滿', '兩個容量一樣大'],
  ],
  build: ([event, answer], index) => {
    return {
      narration: `第 ${index + 1} 次倒水實驗：${event}，請判斷兩個容器的容量。`,
      concept: { prompt: '直接倒入比較時，要注意什麼？', answer: '水有沒有剩下或容器還沒有滿', options: ['倒水的速度', '容器的顏色'], errorTag: 'direct-pour-observation' },
      model: { prompt: '如果 A 的水全倒入 B，B 還沒滿，表示什麼？', answer: 'B 的容量較大', options: ['A 的容量較大', '兩個一定一樣大'], errorTag: 'direct-pour-interpretation' },
      method: { prompt: '倒入法最適合什麼情況？', answer: '兩個容器可以直接互倒', options: ['容器都不能移動', '只有外觀照片'], errorTag: 'capacity-method' },
      answer: { prompt: `根據「${event}」，應該怎麼判斷？`, answer, options: ['第一個容器較大', '第二個容器較大', '兩個容量一樣大'].filter((item) => item !== answer), errorTag: 'direct-pour-interpretation' },
    };
  },
});

const commonUnit = createSkill({
  unitId, id: 'common-unit', title: '用相同杯子公平比', icon: '🥤', scene: '排好公平量杯站',
  goal: '用同一個小杯當單位，以杯數比較無法直接互倒的容器。', recommendation: '比較前先確認兩邊使用同一個杯子。',
  rows: pairs.map(([a, b], index) => [a + 2, b + 1, index % 2 === 0 ? '較大' : '較小']),
  build: ([first, second, target], index) => {
    const chooseFirst = target === '較大' ? first > second : first < second;
    const result = chooseFirst ? '甲容器' : '乙容器';
    return {
      narration: `用同一個小杯量，甲容器是 ${first} 杯，乙容器是 ${second} 杯，請找出容量${target}的一個。`,
      concept: { prompt: '為什麼兩邊要用相同的小杯？', answer: '單位一樣才能公平比較', options: ['比較好看', '可以少倒幾次'], errorTag: 'capacity-common-unit' },
      model: { prompt: '如果用同一小杯，杯數較多代表什麼？', answer: '容量較大', options: ['容量較小', '容器較高'], errorTag: 'capacity-cup-count' },
      method: { prompt: '使用不同大小的杯子所得數字能直接比嗎？', answer: '不能，單位不同', options: ['可以，只看數字', '只要容器同色就可以'], errorTag: 'capacity-common-unit' },
      answer: { prompt: `甲 ${first} 杯、乙 ${second} 杯，容量${target}的是誰？`, answer: result, options: [result === '甲容器' ? '乙容器' : '甲容器', '兩個一樣'], errorTag: 'capacity-comparison' },
    };
  },
});

export const UNIT5_ADAPTIVE = {
  unitId, title: '容量引導探險', intro: '不只看容器外表，用倒一倒和相同杯子找到公平答案。',
  stepLabels: standardStepLabels('看容量', '做實驗', '選方法'), skills: [capacityConcept, directPour, commonUnit],
};
