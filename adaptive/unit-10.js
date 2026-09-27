import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-10';
const shapes = ['紅色地墊', '藍色紙片', '綠色桌墊', '黃色拼圖', '紫色布料', '橘色畫紙', '白色卡紙', '彩色旗幟'];

const overlap = createSkill({
  unitId, id: 'overlap', title: '對齊重疊直接比較面', icon: '🖼️', scene: '鋪好重疊地墊',
  goal: '把兩個可移動的面對齊重疊，以是否露在外面判斷大小。', recommendation: '用兩張不同大小的紙對齊一個角重疊，說明看到的結果。',
  rows: [[12, 8], [9, 14], [15, 11], [10, 10], [18, 13], [7, 12], [16, 9], [14, 14]],
  build: ([first, second], index) => {
    const result = first > second ? shapes[index] : first < second ? '比較面' : '兩個面一樣大';
    return {
      narration: `${shapes[index]}與比較面可以移動，重疊後對應大小是 ${first} 和 ${second}，請比較兩個面。`,
      concept: { prompt: '可移動的兩個面最適合先用什麼方法？', answer: '對齊後重疊', options: ['只比一條邊', '只看顏色'], errorTag: 'area-overlap-method' },
      model: { prompt: '重疊時為什麼要先對齊角或邊？', answer: '才能公平看出哪個面露在外面', options: ['讓圖形變小', '讓顏色變一樣'], errorTag: 'area-alignment' },
      method: { prompt: 'A 面完全蓋住 B 面且還有露出，哪個較大？', answer: 'A 面', options: ['B 面', '一定一樣大'], errorTag: 'area-overlap-interpretation' },
      answer: { prompt: `根據重疊結果，${shapes[index]}和比較面哪個較大？`, answer: result, options: [result === shapes[index] ? '比較面' : shapes[index], result === '兩個面一樣大' ? '無法比較' : '兩個面一樣大'], errorTag: 'area-comparison' },
    };
  },
});

const gridCompare = createSkill({
  unitId, id: 'grid-compare', title: '用相同方格間接比較', icon: '🟦', scene: '排滿公平方格磚',
  goal: '兩個面無法重疊時，用同大方格鋪滿並比較格數。', recommendation: '比較前先把兩邊的方格疊在一起，確認單位同大。',
  rows: [[12, 8], [15, 18], [20, 16], [9, 14], [24, 21], [10, 10], [18, 12], [16, 25]],
  build: ([first, second], index) => {
    const result = first > second ? '甲面' : first < second ? '乙面' : '兩個面一樣大';
    return {
      narration: `甲面鋪了 ${first} 個方格，乙面鋪了 ${second} 個同大方格，請公平比較。`,
      concept: { prompt: '間接比較面的大小，方格必須怎樣？', answer: '每個一樣大', options: ['一邊大一邊小', '只要顏色一樣'], errorTag: 'area-common-unit' },
      model: { prompt: '方格要怎麼鋪才準確？', answer: '鋪滿且不重疊、不留縫', options: ['只鋪邊邊', '重疊越多越好'], errorTag: 'area-covering' },
      method: { prompt: '使用相同方格時，格數較多代表什麼？', answer: '面較大', options: ['面較小', '周長一定較長'], errorTag: 'area-unit-count' },
      answer: { prompt: `甲 ${first} 格、乙 ${second} 格，哪個面較大？`, answer: result, options: ['甲面', '乙面', '兩個面一樣大'].filter((item) => item !== result), errorTag: 'area-comparison' },
    };
  },
});

const arrayCount = createSkill({
  unitId, id: 'array-count', title: '按排與列數出方格', icon: '🧩', scene: '完成故事屋地板',
  goal: '看清楚幾排、每排幾格，用跳數或乘法不漏數。', recommendation: '先用手指橫著數每排，再從上到下數排數。',
  rows: [[2, 5], [3, 4], [3, 5], [4, 4], [2, 8], [4, 5], [3, 6], [5, 5]],
  build: ([rows, columns], index) => {
    const total = rows * columns;
    return {
      narration: `${shapes[index]}用 ${rows} 排、每排 ${columns} 個方格鋪滿，一共用了幾格？`,
      concept: { prompt: '數方格時怎麼才不會漏掉或重複？', answer: '按固定的排與列順序數', options: ['隨機挑方格', '只數外圈'], errorTag: 'area-counting-order' },
      model: { prompt: '哪一個分組符合圖形？', answer: `${rows} 排，每排 ${columns} 格`, options: [`${columns} 排，總共 ${rows} 格`, `1 排，總共 ${rows + columns} 格`], errorTag: 'area-array-model' },
      method: { prompt: '哪一個算式可以快速數完？', answer: `${rows}×${columns}`, options: [`${rows}＋${columns}`, `${columns}－${rows}`], errorTag: 'area-array-operation' },
      answer: { prompt: `${rows} 排、每排 ${columns} 格，共幾格？`, answer: total, options: [rows + columns, total - columns], errorTag: 'area-unit-count' },
    };
  },
});

export const UNIT10_ADAPTIVE = {
  unitId, title: '面的大小比較引導探險', intro: '能搬就重疊，不能搬就用相同方格，讓每一次比較都公平。',
  stepLabels: standardStepLabels('選比法', '鋪或疊', '數方格'), skills: [overlap, gridCompare, arrayCount],
};
