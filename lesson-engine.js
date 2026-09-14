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
    storyText: '小安和小晴把鉛筆放在桌上比較，栗栗提醒他們：如果起點沒有排整齊，只看另一端就可能判斷錯。',
    steps: ['把兩個物品放在平坦的位置', '讓其中一端對齊同一條線', '觀察另一端，伸得較遠的比較長'],
    mistake: '只看兩個物品的終點，卻忘了先把起點對齊，會造成不公平的比較。',
    remember: '比較長短，先對齊同一個起點。',
    demoTitle: '看！起點排整齊了',
    demoCaption: '兩枝筆先移到同一條起點線，再看右端，就能公平判斷誰比較長。',
    demoType: 'compare',
    image: 'assets/classroom-adventure.png',
    imageAlt: '兩位學生和松鼠一起在教室比較鉛筆長短的情境插圖',
  },
  {
    storyTitle: '一張桌子，怎麼有兩個答案？',
    storyText: '小方塊量出 8 個，大積木卻只要 4 個。桌子沒有變長或縮短，是因為選用的測量單位大小不同。',
    steps: ['選擇每個都一樣大的測量單位', '從桌子一端開始排，不留空隙也不重疊', '數一數用了幾個，並說清楚使用的單位'],
    mistake: '混用大小不同的積木，或積木之間留下空隙，數出的答案都不能公平比較。',
    remember: '同樣長度，單位越長，需要的個數越少。',
    demoTitle: '積木首尾相接',
    demoCaption: '小方塊與大積木依序排進同一段長度，動畫會顯示單位大小如何影響個數。',
    demoType: 'units',
    image: 'assets/unit-measurement-story.jpg',
    imageAlt: '兩位學生用藍色小方塊和黃色大積木測量同一張桌子',
  },
  {
    storyTitle: '大家都懂的共同語言',
    storyText: '每個人的積木可能不一樣大，所以人們約定使用公分。直尺上相鄰兩個整數刻度之間，就是 1 公分。',
    steps: ['在直尺上找到刻度 0', '找出旁邊相鄰的整數刻度 1', '用手指沿著兩條刻度之間移動，感受 1 公分'],
    mistake: '把一條刻度線當成 1 公分；其實公分是兩條刻度線之間的一段距離。',
    remember: '1 公分是相鄰兩條整數刻度之間的距離。',
    demoTitle: '找出這 1 公分',
    demoCaption: '亮起來的是刻度 0 到刻度 1 之間的一段距離，不是單獨一條刻度線。',
    demoType: 'centimeter',
    image: 'assets/unit-measurement-story.jpg',
    imageAlt: '學生與松鼠觀察直尺和排列整齊的測量方塊',
  },
  {
    storyTitle: '鉛筆沒有從 0 開始，還能量嗎？',
    storyText: '鉛筆從刻度 2 放到刻度 9，不能直接說長 9 公分。把終點減去起點，9－2＝7，才是真正的長度。',
    steps: ['先記下物品對齊的起點刻度', '再讀出物品另一端的終點刻度', '用終點刻度減起點刻度，並寫上公分'],
    mistake: '看到終點是 9 就回答 9 公分，忘記物品其實是從刻度 2 才開始。',
    remember: '沒有從 0 開始時，長度＝終點－起點。',
    demoTitle: '從刻度 2 量到刻度 9',
    demoCaption: '鉛筆沿直尺展開，最後用終點 9 減去起點 2，得到長度 7 公分。',
    demoType: 'measure',
    image: 'assets/unit-measurement-story.jpg',
    imageAlt: '學生在教室桌面使用黃色直尺測量物品長度',
  },
  {
    storyTitle: '把 6 公分畫在紙上',
    storyText: '小晴要畫一條 6 公分線段。她先在刻度 0 點一下，再在刻度 6 做記號，最後沿著直尺連起兩點。',
    steps: ['讓直尺的刻度 0 對準起點', '在指定的終點刻度做一個清楚記號', '沿直尺連起兩點，最後標上幾公分'],
    mistake: '把直尺的塑膠邊緣當起點，卻沒有對準刻度 0，畫出的線段就可能不準。',
    remember: '畫線段：0 點起步、終點做記號、連線寫單位。',
    demoTitle: '線段一步一步畫出來',
    demoCaption: '先標出刻度 0 和刻度 6 的端點，再沿著直尺把兩個端點連起來。',
    demoType: 'draw',
    image: 'assets/ribbon-story.jpg',
    imageAlt: '兩位學生在方格紙上用直尺畫出指定長度的線段',
  },
  {
    storyTitle: '兩條彩帶接成一條',
    storyText: '藍彩帶長 8 公分，紅彩帶長 5 公分，首尾相接又沒有重疊，全部長度可以用 8＋5 算出來。',
    steps: ['先判斷題目是合起來、剪掉，還是比較相差', '合起來用加法，拿走或相差用減法', '完成計算後檢查答案有沒有寫公分'],
    mistake: '還沒看清楚題目問「全部」或「剩下」，就急著選加法或減法，容易用錯算式。',
    remember: '合起來用加法；剪掉或相差用減法。',
    demoTitle: '兩條彩帶碰面了',
    demoCaption: '8 公分與 5 公分的彩帶首尾相接，沒有空隙也沒有重疊，所以合計 13 公分。',
    demoType: 'calculate',
    image: 'assets/ribbon-story.jpg',
    imageAlt: '學生把藍色與珊瑚紅彩帶首尾相接並用直尺檢查長度',
  },
  {
    storyTitle: '栗栗的最後一張任務卡',
    storyText: '最後的任務把比較、測量、畫線和加減都放在一起。慢慢讀題、找出線索，再檢查答案是否合理。',
    steps: ['先讀完問題，圈出題目真正要問的事情', '找出起點、終點、數字和使用的單位', '列式或操作後再檢查答案是否合理'],
    mistake: '看到題目裡最大的數字就直接猜答案，沒有先理解數字代表起點、終點還是長度。',
    remember: '先讀題、找線索、再計算，最後檢查。',
    demoTitle: '五個線索都找到了',
    demoCaption: '起點、終點、數字、單位和問題依序亮起，提醒你用完整步驟完成最後挑戰。',
    demoType: 'challenge',
    image: 'assets/classroom-adventure.png',
    imageAlt: '兩位學生和松鼠帶著直尺完成公分探險任務',
  },
];

export function calculateLength(start, end) {
  return Math.abs(Number(end) - Number(start));
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
