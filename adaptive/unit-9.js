import { createSkill, standardStepLabels } from './question-factory.js';

const unitId = 'unit-9';
const objects = ['螢火蟲', '小燈', '星星', '系鈴', '彩旗', '餅乾', '書籤', '小花'];

const tableSkill = ({ factor, id, title, icon, scene, goal, recommendation }) => createSkill({
  unitId, id, title, icon, scene, goal, recommendation, rows: [2, 3, 4, 5, 6, 7, 8, 9],
  build: (groups, index) => {
    const total = factor * groups;
    const previous = factor * (groups - 1);
    return {
      narration: `每排 ${factor} 個${objects[index]}，一共有 ${groups} 排，全部有多少？`,
      concept: { prompt: `每多一排，總數會多多少？`, answer: factor, options: [factor + 1, factor - 1], errorTag: 'multiplication-pattern' },
      model: { prompt: '哪一個分組和題目一樣？', answer: `${groups} 組，每組 ${factor} 個`, options: [`${factor} 組，每組 ${groups} 個`, '組數和每組數都不固定', `${groups + 1} 組，每組 ${factor} 個`], errorTag: 'multiplication-groups' },
      method: { prompt: '不確定乘法答案時可以怎麼檢查？', answer: `上一個答案 ${previous} 再加 ${factor}`, options: [`${previous} 再減 ${factor}`, `把 ${factor} 和 ${groups} 相加`], errorTag: 'multiplication-strategy' },
      answer: { prompt: `${factor}×${groups}是多少？`, answer: total, options: [total + factor, total - factor], errorTag: 'multiplication-fact' },
    };
  },
});

const three = tableSkill({ factor: 3, id: 'three', title: '跳著數 3 的乘法', icon: '☁️', scene: '點亮三拍雲燈', goal: '每多一組就多 3，用跳數與分組理解 3 的乘法。', recommendation: '一邊拍三拍，一邊念 3、6、9、12，連結組數與總數。' });
const six = tableSkill({ factor: 6, id: 'six', title: '用兩個 3 理解 6 的乘法', icon: '🌟', scene: '裝好六角星燈', goal: '將每組 6 個看成兩組 3 個，用加倍找出答案。', recommendation: '把一組 6 個分成 3 和 3，用已知的 3 的乘法檢查。' });
const seven = tableSkill({ factor: 7, id: 'seven', title: '用每週七天學 7 的乘法', icon: '🌈', scene: '架起七色彩虹橋', goal: '把每週 7 天或七個一組當成固定組數，找到 7 的規律。', recommendation: '在日曆上以一週為一組圈起來，數 7、14、21、28。' });

export const UNIT9_ADAPTIVE = {
  unitId, title: '乘法（二）引導探險', intro: '用圖像、跳數與已知規律，讓 3、6、7 的乘法變成可以理解的亮光密碼。',
  stepLabels: standardStepLabels('找規律', '圈分組', '選策略'), skills: [three, six, seven],
};
