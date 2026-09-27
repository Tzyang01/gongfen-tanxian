const uniqueOptions = (answer, options) => [answer, ...options].filter((option, index, items) =>
  items.findIndex((candidate) => String(candidate) === String(option)) === index);

const guidedQuestion = ({
  id, skillId, narration, relationship, relationshipOptions, model, modelOptions,
  operation, operationOptions, answer, answerOptions, errorTags,
}) => ({
  id, skillId, narration, audioSrc: null,
  steps: [
    { id: 'listen', kind: 'listen', prompt: narration },
    {
      id: 'relationship', kind: 'choice', prompt: '先找出題目裡的「全體」和「部分」。',
      answer: relationship, options: uniqueOptions(relationship, relationshipOptions), errorTag: errorTags[0],
      hints: ['找找看：哪一個數是原來全部或合起來的數？', '把「全體」放上面，兩個「部分」放下面。', `這一題的關係是：${relationship}。`],
    },
    {
      id: 'model', kind: 'choice', prompt: '哪一張全體—部分圖和題目一樣？',
      answer: model, options: uniqueOptions(model, modelOptions), errorTag: errorTags[0],
      hints: ['先確認問號是全體還是其中一部分。', '全體可以拆成兩個部分。', `正確的關係圖是 ${model}。`],
    },
    {
      id: 'operation', kind: 'choice', prompt: '這一題要用哪一種運算？',
      answer: operation, options: uniqueOptions(operation, operationOptions), errorTag: errorTags[1],
      hints: ['不要只看「剩下」或「一共」，先看我們要找全體還是部分。', '找全體就把部分合起來；找一個部分就從全體拿掉已知部分。', `這一題要用${operation}。`],
    },
    {
      id: 'answer', kind: 'choice', prompt: '最後算一算，選出正確答案。',
      answer, options: uniqueOptions(answer, answerOptions), errorTag: errorTags[2],
      hints: ['把剛才選的關係和運算連起來。', `先寫出 ${model}，再仔細計算。`, `正確答案是 ${answer}。`],
    },
  ],
});

const makeBank = (skillId, rows, errorTags) => rows.map((row) => {
  const [id, narration, relationship, model, operation, answer, answerOptions] = row;
  return guidedQuestion({
    id, skillId, narration, relationship,
    relationshipOptions: ['只有較大的數才是全體', '題目裡的數都是全體'],
    model, modelOptions: [model.replace('＋', '－'), model.replace('＝', '＞')],
    operation, operationOptions: [operation === '加法' ? '減法' : '加法', '只看關鍵字'],
    answer, answerOptions, errorTags,
  });
});

const partWhole = makeBank('part-whole', [
  ['pw-1', '小晴原有 75 張貼紙，送給同學 48 張，還剩幾張？', '75 是全體，48 和？是部分', '75＝48＋？', '減法', 27, [37, 123]],
  ['pw-2', '圖書角原有 38 本書，又收到 26 本，現在一共有幾本？', '？是全體，38 和 26 是部分', '？＝38＋26', '加法', 64, [54, 12]],
  ['pw-3', '慶生會有 62 顆氣球，19 顆飛走了，還剩幾顆？', '62 是全體，19 和？是部分', '62＝19＋？', '減法', 43, [53, 81]],
  ['pw-4', '阿哲撿了 34 個貝殼，小晴撿了 28 個，兩人合起來有幾個？', '？是全體，34 和 28 是部分', '？＝34＋28', '加法', 62, [52, 6]],
  ['pw-5', '美術課準備了 90 隻蠟筆，用掉 37 隻，還剩幾隻？', '90 是全體，37 和？是部分', '90＝37＋？', '減法', 53, [63, 127]],
  ['pw-6', '班級上午得到 46 點，下午又得到 18 點，一共有幾點？', '？是全體，46 和 18 是部分', '？＝46＋18', '加法', 64, [74, 28]],
  ['pw-7', '盒子裡有 72 塊餅乾，分出 25 塊後，盒子裡還有幾塊？', '72 是全體，25 和？是部分', '72＝25＋？', '減法', 47, [57, 97]],
  ['pw-8', '花園裡有 29 株紅花和 36 株黃花，全部有幾株？', '？是全體，29 和 36 是部分', '？＝29＋36', '加法', 65, [55, 7]],
], ['whole-part-confusion', 'operation-choice', 'calculation']);

const chooseOperation = makeBank('choose-operation', [
  ['op-1', '遊覽車上原有 32 人，途中又上車 17 人，現在有幾人？', '？是現在的全體', '？＝32＋17', '加法', 49, [39, 15]],
  ['op-2', '圖書館架上有 68 本書，借出 24 本，架上還有幾本？', '68 是原來全體', '68＝24＋？', '減法', 44, [54, 92]],
  ['op-3', '紅隊有 45 分，藍隊有 31 分，紅隊多幾分？', '45 是較大量，31 和相差合成 45', '45＝31＋？', '減法', 14, [76, 24]],
  ['op-4', '倉庫第一箱有 26 顆球，第二箱有 39 顆，兩箱共有幾顆？', '？是兩箱合起來的全體', '？＝26＋39', '加法', 65, [55, 13]],
  ['op-5', '一條繩子長 80 公分，剪掉 35 公分，還剩幾公分？', '80 是整條繩子', '80＝35＋？', '減法', 45, [55, 115]],
  ['op-6', '果籃原有一些橘子，送出 28 顆後還有 37 顆，原來有幾顆？', '？是原來的全體', '？＝28＋37', '加法', 65, [9, 75]],
  ['op-7', '二年甲班有 42 人，今天 6 人請假，到校的有幾人？', '42 是全班人數', '42＝6＋？', '減法', 36, [48, 46]],
  ['op-8', '探險隊已收集 55 顆星，再收集 20 顆就到目標，目標是幾顆？', '？是目標的全體', '？＝55＋20', '加法', 75, [35, 65]],
], ['unknown-quantity', 'keyword-guessing', 'calculation']);

const inverseCheck = makeBank('inverse-check', [
  ['check-1', '班級上午得 47 點，下午得 35 點，小晴算出 47＋35＝82，要怎麼驗算？', '82 是全體，47 和 35 是部分', '82＝47＋35', '減法', '82－35＝47', ['82＋35＝117', '47－35＝12']],
  ['check-2', '桌上有 83 張票，送出 46 張後剩 37 張，要檢查 83－46＝37。', '83 是全體，46 和 37 是部分', '83＝46＋37', '加法', '37＋46＝83', ['83＋46＝129', '46－37＝9']],
  ['check-3', '兩段彩帶是 38 公分和 26 公分，合起來 64 公分，要怎麼驗算？', '64 是全體，38 和 26 是部分', '64＝38＋26', '減法', '64－26＝38', ['64＋26＝90', '38－26＝12']],
  ['check-4', '75 顆松果送出 48 顆後剩 27 顆，要檢查 75－48＝27。', '75 是全體，48 和 27 是部分', '75＝48＋27', '加法', '27＋48＝75', ['75＋48＝123', '48－27＝21']],
  ['check-5', '29 株紅花和 36 株黃花共 65 株，要怎麼驗算 29＋36＝65？', '65 是全體，29 和 36 是部分', '65＝29＋36', '減法', '65－36＝29', ['65＋36＝101', '36－29＝7']],
  ['check-6', '90 隻蠟筆用掉 37 隻後剩 53 隻，要檢查 90－37＝53。', '90 是全體，37 和 53 是部分', '90＝37＋53', '加法', '53＋37＝90', ['90＋37＝127', '53－37＝16']],
  ['check-7', '遊覽車上 32 人，又上車 17 人，現在 49 人，要怎麼驗算？', '49 是全體，32 和 17 是部分', '49＝32＋17', '減法', '49－17＝32', ['49＋17＝66', '32－17＝15']],
  ['check-8', '架上 68 本書借出 24 本後剩 44 本，要檢查 68－24＝44。', '68 是全體，24 和 44 是部分', '68＝24＋44', '加法', '44＋24＝68', ['68＋24＝92', '44－24＝20']],
], ['whole-part-confusion', 'inverse-operation', 'verification-equation']);

export const UNIT4_ADAPTIVE = {
  unitId: 'unit-4', title: '加減應用引導探險',
  intro: '每次只做一個小步驟，慢慢把故事變成看得懂的數學關係。',
  skills: [
    { id: 'part-whole', title: '找到全體與部分', icon: '🧩', scene: '點亮彩帶橋', goal: '先找全體與部分，不被題目裡的單一關鍵字誤導。', recommendation: '用全體—部分圖再練習一題。', questions: partWhole },
    { id: 'choose-operation', title: '選擇加法或減法', icon: '🧭', scene: '修復森林指示牌', goal: '依照未知量選運算，而不是猜關鍵字。', recommendation: '先說出「我要找全體或部分」再選運算。', questions: chooseOperation },
    { id: 'inverse-check', title: '用反向運算驗算', icon: '🔍', scene: '點亮山頂燈塔', goal: '用反向運算回到原數，檢查答案是否合理。', recommendation: '把全體和一個部分對調，再寫一次驗算式。', questions: inverseCheck },
  ],
};
