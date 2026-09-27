import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-8';

const clockParts = createSkill({
  unitId, id: 'clock-parts', title: '認識鐘面、時針與分針', icon: '🕰️', scene: '裝好星光大時鐘',
  goal: '分辨短時針與長分針，知道分針走一大格是 5 分鐘。', recommendation: '每天選一個整點，指出長針、短針和 12 個大格。',
  rows: [[1, 5], [2, 10], [3, 15], [4, 20], [5, 25], [6, 30], [8, 40], [9, 45]],
  build: ([pointer, minute], index) => ({
    narration: `星光時鐘的長針指向數字 ${pointer}，這次要讀出它代表的分鐘數。`,
    concept: { prompt: '鐘面上的長針主要告訴我們什麼？', answer: '幾分', options: ['幾時', '星期幾'], errorTag: 'clock-hand' },
    model: { prompt: '分針從 12 走到下一個大數字，經過幾分鐘？', answer: '5 分鐘', options: ['1 分鐘', '10 分鐘'], errorTag: 'clock-scale' },
    method: { prompt: `分針指向 ${pointer}，要怎麼找分鐘數？`, answer: `${pointer}×5`, options: [`${pointer}＋5`, `${pointer}×10`], errorTag: 'clock-five-count' },
    answer: { prompt: `長針指向 ${pointer} 表示幾分？`, answer: minute, options: [pointer, Math.min(55, minute + 5)], errorTag: 'clock-five-count' },
  }),
});

const readTime = createSkill({
  unitId, id: 'read-time', title: '合起來報讀幾時幾分', icon: '⏰', scene: '點亮準時音樂會',
  goal: '先看分針讀分，再看時針經過哪個數字讀時。', recommendation: '先說「分針在哪裡」，再說「時針剛走過哪個數字」。',
  rows: [[3, 0], [7, 30], [4, 45], [9, 15], [2, 20], [6, 40], [10, 25], [5, 50]],
  build: ([hour, minute], index) => {
    const pointer = minute === 0 ? 12 : minute / 5;
    const label = `${hour} 時 ${minute} 分`;
    return {
      narration: `第 ${index + 1} 張行程卡的時鐘：分針指向 ${pointer}，時針走過 ${hour}，請報讀時刻。`,
      concept: { prompt: '報讀時刻時，為什麼要分辨長短針？', answer: '長針看分，短針看時', options: ['長針看時，短針看分', '兩根都只看分'], errorTag: 'clock-hand' },
      model: { prompt: `分針指向 ${pointer} 是幾分？`, answer: minute, options: [pointer, (minute + 15) % 60], errorTag: 'clock-minute' },
      method: { prompt: '時針在兩個數字之間時，應該讀哪個小時？', answer: '剛經過的數字', options: ['還沒到的下一個數字', '只看分針的數字'], errorTag: 'clock-hour' },
      answer: { prompt: '這個鐘面是幾時幾分？', answer: label, options: [`${pointer} 時 ${hour} 分`, `${hour + 1} 時 ${minute} 分`], errorTag: 'clock-reading' },
    };
  },
});

const elapsed = createSkill({
  unitId, id: 'elapsed', title: '沿著時間線數經過多久', icon: '⏳', scene: '接好時間星軌',
  goal: '把開始與結束時刻標在時間線，點數中間經過的時間。', recommendation: '先練習同一小時內的 5 分鐘跳數，再練習跨越整點。',
  rows: [[6, 20, 30], [7, 40, 25], [8, 45, 35], [9, 5, 40], [3, 50, 20], [4, 10, 45], [10, 45, 30], [1, 40, 15]],
  build: ([hour, minute, duration], index) => {
    const endTotal = hour * 60 + minute + duration;
    const endHour = Math.floor(endTotal / 60) % 12 || 12;
    const endMinute = endTotal % 60;
    const startLabel = `${hour}:${String(minute).padStart(2, '0')}`;
    const endLabel = `${endHour}:${String(endMinute).padStart(2, '0')}`;
    const crossesHour = endHour !== hour;
    return {
      narration: `第 ${index + 1} 次彩排從 ${startLabel} 開始，在 ${endLabel} 結束，一共經過多久？`,
      concept: { prompt: '「經過多久」在問什麼？', answer: '開始時刻到結束時刻的距離', options: ['兩個時刻相加', '只看結束的分鐘數'], errorTag: 'elapsed-meaning' },
      model: { prompt: '哪一個模型最適合？', answer: '標有開始與結束的時間線', options: ['只有一個數字的圓圈', '長度公分尺'], errorTag: 'elapsed-model' },
      method: crossesHour
        ? { prompt: '跨過整點時可以怎麼數？', answer: '先數到下一個整點，再數剩下時間', options: ['直接用結束分減開始分', '把兩個時刻相加'], errorTag: 'elapsed-strategy' }
        : { prompt: '同一小時內可以怎麼快速計算？', answer: '結束分減開始分', options: ['結束分加開始分', '把小時數相乘'], errorTag: 'elapsed-strategy' },
      answer: { prompt: `${startLabel} 到 ${endLabel} 經過幾分鐘？`, answer: duration, options: [Math.abs(endMinute - minute) + 5, duration + 10], errorTag: 'elapsed-calculation' },
    };
  },
});

export const UNIT8_ADAPTIVE = {
  unitId, title: '時間引導探險', intro: '先分清時針與分針，再沿著時間線守住每一個重要約定。',
  stepLabels: standardStepLabels('看指針', '擺鐘面', '數時間'), skills: [clockParts, readTime, elapsed],
};
