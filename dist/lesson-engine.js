export const COURSE_CATALOG = [
  {
    id: 'grade2-math-centimeter',
    age: '7～8 歲',
    grade: '二年級',
    category: '數學',
    unit: '第三單元',
    title: '認識公分',
  },
];

export function getCoursePath(courseId) {
  const course = COURSE_CATALOG.find((item) => item.id === courseId);
  if (!course) return null;
  const { age, grade, category, unit, title } = course;
  return { age, grade, category, unit, title };
}

export const LESSON_BLUEPRINT = [
  { id: 'compare', title: '長度偵探', short: '比一比', color: '#ef6a55' },
  { id: 'units', title: '公平的測量', short: '個別單位', color: '#f2ad28' },
  { id: 'centimeter', title: '遇見 1 公分', short: '認識公分', color: '#35a87b' },
  { id: 'measure', title: '直尺小高手', short: '量一量', color: '#2585d8' },
  { id: 'draw', title: '小小繪圖師', short: '畫一畫', color: '#7d62ce' },
  { id: 'calculate', title: '長度算一算', short: '長度加減', color: '#e36a9b' },
  { id: 'challenge', title: '公分挑戰樂園', short: '總挑戰', color: '#ed7f2b' },
];

export const LESSON_ENRICHMENTS = [
  {
    storyTitle: '誰的鉛筆比較長？',
    storyText: '下課鐘一響，小安興奮地拿出新鉛筆，想和小晴比一比。小晴看見自己的鉛筆伸得比較遠，高興得差點跳起來；栗栗卻歪著頭，發現兩枝筆的起點根本沒有站在同一條線上。',
    dialogue: '栗栗輕聲說：「別急著分勝負，讓它們公平地站好吧！」',
    storyClosing: '小安和小晴一起把起點對齊，答案立刻變清楚了。他們相視一笑：原來公平比較，比誰輸誰贏更重要。',
    steps: ['把兩個物品放在平坦的位置', '讓其中一端對齊同一條線', '觀察另一端，伸得較遠的比較長'],
    mistake: '只看兩個物品的終點，卻忘了先把起點對齊，會造成不公平的比較。',
    remember: '比較長短，先對齊同一個起點。',
    demoTitle: '看！起點排整齊了',
    demoCaption: '兩枝筆先移到同一條起點線，再看右端，就能公平判斷誰比較長。',
    demoType: 'compare',
    demoData: { sharedStart: true, longerItem: 'blue' },
    image: 'assets/classroom-adventure-v2.jpg',
    imageAlt: '兩位學生和松鼠一起在教室比較鉛筆長短的情境插圖',
    imageNote: '故事情境插圖｜鉛筆與直尺分開擺放，尚未進行測量；精確關係請看動畫',
  },
  {
    storyTitle: '一張桌子，怎麼有兩個答案？',
    storyText: '美術課前，小晴想替展示桌做一條漂亮桌巾。她用藍色小方塊量出 8 個，小安換成黃色大積木卻只量到 4 個。兩人望著不同答案，心裡又驚訝又困惑：桌子明明沒有變呀！',
    dialogue: '小安抓抓頭問：「我們都很仔細，為什麼答案不一樣呢？」',
    storyClosing: '他們把兩排積木放在一起，終於發現大積木一個就和兩個小方塊一樣長。疑惑變成了驚喜，測量單位的祕密被找到了。',
    steps: ['選擇每個都一樣大的測量單位', '從桌子一端開始排，不留空隙也不重疊', '數一數用了幾個，並說清楚使用的單位'],
    mistake: '混用大小不同的積木，或積木之間留下空隙，數出的答案都不能公平比較。',
    remember: '同樣長度，單位越長，需要的個數越少。',
    demoTitle: '積木首尾相接',
    demoCaption: '小方塊與大積木依序排進同一段長度，動畫會顯示單位大小如何影響個數。',
    demoType: 'units',
    demoData: { smallUnitCount: 8, largeUnitCount: 4, equalTotalLength: true },
    image: 'assets/unit-measurement-story-v2.jpg',
    imageAlt: '兩位學生用藍色小方塊和黃色大積木測量同一張桌子',
    imageNote: '精確教學圖｜上排 8 個藍色小方塊、下排 4 個黃色大積木，兩排等長',
  },
  {
    storyTitle: '大家都懂的共同語言',
    storyText: '小安回家後說桌子長 8 個方塊，妹妹卻拿出另一種方塊，怎麼也想像不出真正有多長。他有點失望，擔心自己的發現沒有人聽得懂。隔天，老師遞給他一把標著公分的直尺。',
    dialogue: '老師溫柔地說：「公分就像大家都聽得懂的長度語言。」',
    storyClosing: '小安從刻度 0 摸到刻度 1，感受到短短的一段距離。他安心地笑了，因為不論在家或在學校，1 公分都一樣長。',
    steps: ['在直尺上找到刻度 0', '找出旁邊相鄰的整數刻度 1', '用手指沿著兩條刻度之間移動，感受 1 公分'],
    mistake: '把一條刻度線當成 1 公分；其實公分是兩條刻度線之間的一段距離。',
    remember: '1 公分是相鄰兩條整數刻度之間的距離。',
    demoTitle: '找出這 1 公分',
    demoCaption: '亮起來的是刻度 0 到刻度 1 之間的一段距離，不是單獨一條刻度線。',
    demoType: 'centimeter',
    demoData: { start: 0, end: 1, max: 1 },
    image: 'assets/unit-measurement-story-v2.jpg',
    imageAlt: '學生與松鼠觀察直尺和排列整齊的測量方塊',
    imageNote: '情境與單位圖｜1 公分的精確位置請看下方直尺動畫',
  },
  {
    storyTitle: '鉛筆沒有從 0 開始，還能量嗎？',
    storyText: '準備量鉛筆時，小晴發現直尺前端被書本擋住，鉛筆只能從刻度 2 開始，筆尖剛好停在刻度 9。她緊張地皺起眉頭，以為沒有對準 0，這次任務就一定失敗了。',
    dialogue: '栗栗拍拍桌面鼓勵她：「起點不在 0 也沒關係，我們把走過的距離算出來！」',
    storyClosing: '小晴慢慢算出 9－2＝7，眼睛一下亮了起來。原來真正的長度藏在兩個刻度之間，換個起點也難不倒她。',
    steps: ['先記下物品對齊的起點刻度', '再讀出物品另一端的終點刻度', '用終點刻度減起點刻度，並寫上公分'],
    mistake: '看到終點是 9 就回答 9 公分，忘記物品其實是從刻度 2 才開始。',
    remember: '沒有從 0 開始時，長度＝終點－起點。',
    demoTitle: '從刻度 2 量到刻度 9',
    demoCaption: '鉛筆沿直尺展開，最後用終點 9 減去起點 2，得到長度 7 公分。',
    demoType: 'measure',
    demoData: { start: 2, end: 9, max: 10 },
    image: 'assets/unit-measurement-story-v2.jpg',
    imageAlt: '學生在教室桌面使用黃色直尺測量物品長度',
    imageNote: '情境插圖｜鉛筆從刻度 2 到 9 的精確位置請看下方動畫',
  },
  {
    storyTitle: '把 6 公分畫在紙上',
    storyText: '小晴想畫一張生日卡送給奶奶，卡片上需要一條剛好 6 公分的彩虹橋。第一筆畫歪時，她有點沮喪；小安沒有催她，只把直尺輕輕放回紙上陪她再試一次。',
    dialogue: '小晴深呼吸說：「先找 0，再找 6，這次我要慢慢來。」',
    storyClosing: '兩個端點穩穩連在一起，6 公分線段完成了。她看著親手畫好的彩虹橋，心裡充滿送出祝福前的期待。',
    steps: ['讓直尺的刻度 0 對準起點', '在指定的終點刻度做一個清楚記號', '沿直尺連起兩點，最後標上幾公分'],
    mistake: '把直尺的塑膠邊緣當起點，卻沒有對準刻度 0，畫出的線段就可能不準。',
    remember: '畫線段：0 點起步、終點做記號、連線寫單位。',
    demoTitle: '線段一步一步畫出來',
    demoCaption: '先標出刻度 0 和刻度 6 的端點，再沿著直尺把兩個端點連起來。',
    demoType: 'draw',
    demoData: { start: 0, end: 6, max: 10 },
    image: 'assets/ribbon-story-v2.jpg',
    imageAlt: '兩位學生在方格紙上用直尺畫出指定長度的線段',
    imageNote: '故事情境插圖｜線段的精確起點與終點請看下方動畫',
  },
  {
    storyTitle: '兩條彩帶接成一條',
    storyText: '教室要為栗栗準備驚喜派對，小安找到 8 公分的藍彩帶，小晴帶來 5 公分的紅彩帶。可是窗邊的裝飾還差一段，兩人既期待又擔心，不知道合起來夠不夠長。',
    dialogue: '小晴把彩帶靠在一起笑著說：「你的 8 公分，加上我的 5 公分，我們一起就更長了！」',
    storyClosing: '兩條彩帶首尾相接，8＋5＝13 公分，正好完成裝飾。栗栗開心得尾巴搖個不停，合作也讓教室變得更溫暖。',
    steps: ['先判斷題目是合起來、剪掉，還是比較相差', '合起來用加法，拿走或相差用減法', '完成計算後檢查答案有沒有寫公分'],
    mistake: '還沒看清楚題目問「全部」或「剩下」，就急著選加法或減法，容易用錯算式。',
    remember: '合起來用加法；剪掉或相差用減法。',
    demoTitle: '兩條彩帶碰面了',
    demoCaption: '8 公分與 5 公分的彩帶首尾相接，沒有空隙也沒有重疊，所以合計 13 公分。',
    demoType: 'calculate',
    demoData: { firstLength: 8, secondLength: 5, totalLength: 13 },
    image: 'assets/ribbon-story-v2.jpg',
    imageAlt: '學生把較長的藍色彩帶與較短的珊瑚紅彩帶首尾相接',
    imageNote: '故事情境插圖｜藍色較長、紅色較短；8：5 精確比例請看下方動畫',
  },
  {
    storyTitle: '栗栗的最後一張任務卡',
    storyText: '栗栗從書包裡拿出最後一張任務卡，上面同時出現比較、測量、畫線和加減。小安的心跳得好快，擔心自己會忘記；小晴想起一路學會的方法，握拳替大家打氣。',
    dialogue: '小晴堅定地說：「不用急，我們一個線索、一個線索慢慢找。」',
    storyClosing: '三位夥伴回想每一次犯錯和重新嘗試，發現自己已經比出發時更勇敢。最後一關不是考誰最快，而是相信自己能想清楚。',
    steps: ['先讀完問題，圈出題目真正要問的事情', '找出起點、終點、數字和使用的單位', '列式或操作後再檢查答案是否合理'],
    mistake: '看到題目裡最大的數字就直接猜答案，沒有先理解數字代表起點、終點還是長度。',
    remember: '先讀題、找線索、再計算，最後檢查。',
    demoTitle: '五個線索都找到了',
    demoCaption: '起點、終點、數字、單位和問題依序亮起，提醒你用完整步驟完成最後挑戰。',
    demoType: 'challenge',
    demoData: { clues: ['起點', '終點', '數字', '單位', '問題'] },
    image: 'assets/classroom-adventure-v2.jpg',
    imageAlt: '兩位學生和松鼠帶著直尺完成公分探險任務',
    imageNote: '故事情境插圖｜桌上工具只是任務準備，最後請依序檢查五個解題線索',
  },
];

export function calculateLength(start, end) {
  return Math.abs(Number(end) - Number(start));
}

export function createRulerMeasurement(start, end, max = 10) {
  const startValue = Number(start);
  const endValue = Number(end);
  const maxValue = Number(max);
  return {
    start: startValue,
    end: endValue,
    max: maxValue,
    length: calculateLength(startValue, endValue),
    startPercent: (startValue / maxValue) * 100,
    endPercent: (endValue / maxValue) * 100,
    spanPercent: (calculateLength(startValue, endValue) / maxValue) * 100,
  };
}

export function evaluateChoice(selected, answer) {
  const selectedNumber = Number(selected);
  const answerNumber = Number(answer);
  if (Number.isFinite(selectedNumber) && Number.isFinite(answerNumber)) {
    return selectedNumber === answerNumber;
  }
  return String(selected) === String(answer);
}

export function scoreQuiz(results) {
  return results.filter(Boolean).length;
}

export function restoreProgress(rawValue, totalLessons = 7) {
  try {
    const value = JSON.parse(rawValue);
    const validCompleted = Array.isArray(value.completed)
      && value.completed.length === totalLessons
      && value.completed.every((item) => typeof item === 'boolean');
    const expectedStars = validCompleted ? value.completed.filter(Boolean).length : -1;

    if (!validCompleted || value.stars !== expectedStars) {
      return createProgress(totalLessons);
    }
    return { stars: value.stars, completed: [...value.completed] };
  } catch {
    return createProgress(totalLessons);
  }
}

export function createProgress(totalLessons = 7) {
  return {
    stars: 0,
    completed: Array(totalLessons).fill(false),
  };
}

export function recordAnswer(progress, lessonIndex, isCorrect) {
  const completed = [...progress.completed];
  let stars = progress.stars;

  if (isCorrect && !completed[lessonIndex]) {
    completed[lessonIndex] = true;
    stars += 1;
  }

  return { stars, completed };
}

export function canOpenLesson(progress, lessonIndex) {
  return lessonIndex === 0 || progress.completed[lessonIndex - 1] === true;
}

export function getFinalResult(progress) {
  const completed = progress.completed.every(Boolean);
  return completed
    ? {
        completed: true,
        title: '公分達人',
        message: '你會比較、測量、畫線，也會算長度了！',
      }
    : {
        completed: false,
        title: '繼續探險',
        message: '把還沒完成的關卡找出來，再試一次吧！',
      };
}
