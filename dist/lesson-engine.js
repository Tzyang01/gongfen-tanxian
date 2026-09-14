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
