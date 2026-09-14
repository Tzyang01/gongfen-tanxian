export function createSemesterProgress(course) {
  return {
    units: Object.fromEntries(course.units.map((unit) => [
      unit.id,
      { stars: 0, completed: Array(unit.lessons.length).fill(false) },
    ])),
  };
}

export function restoreSemesterProgress(raw, course) {
  const fresh = createSemesterProgress(course);
  if (!raw) return fresh;
  try {
    const saved = JSON.parse(raw);
    for (const unit of course.units) {
      const source = saved?.units?.[unit.id];
      if (!source || !Array.isArray(source.completed)) continue;
      const completed = unit.lessons.map((_, index) => source.completed[index] === true);
      fresh.units[unit.id] = {
        completed,
        stars: completed.filter(Boolean).length,
      };
    }
    return fresh;
  } catch {
    return fresh;
  }
}

export function canOpenSemesterLesson(progress, unitId, lessonIndex) {
  if (lessonIndex === 0) return true;
  return progress.units[unitId]?.completed?.[lessonIndex - 1] === true;
}

export function recordSemesterCompletion(progress, unitId, lessonIndex) {
  const unitProgress = progress.units[unitId];
  if (!unitProgress || unitProgress.completed[lessonIndex]) return progress;
  const completed = [...unitProgress.completed];
  completed[lessonIndex] = true;
  return {
    ...progress,
    units: {
      ...progress.units,
      [unitId]: { completed, stars: completed.filter(Boolean).length },
    },
  };
}

const numericOptions = (answer, step = 1) => {
  const values = [answer, answer + step, Math.max(0, answer - step)];
  const unique = [...new Set(values)];
  while (unique.length < 3) unique.push(answer + step * unique.length);
  const shift = Math.abs(Math.trunc(answer)) % unique.length;
  return [...unique.slice(shift), ...unique.slice(0, shift)];
};

const practiceQuestion = (level, prompt, answer, explain, options) => ({
  level, prompt, answer, explain, options: options ?? numericOptions(answer),
});

const formatTime = (hour, minute) => `${hour} 時 ${String(minute).padStart(2, '0')} 分`;

function practiceVariants(lesson) {
  const visual = buildVisualModel(lesson.visual);
  const levels = ['熟練', '應用', '易錯'];
  switch (visual.type) {
    case 'numberline':
      return [
        practiceQuestion(levels[0], `${visual.focus} 的下一個數是多少？`, visual.focus + 1, `${visual.focus} 往後數一個，就是 ${visual.focus + 1}。`),
        practiceQuestion(levels[1], `從 ${visual.start} 數到 ${visual.end}，兩端相差多少？`, visual.end - visual.start, `用 ${visual.end}－${visual.start}，相差 ${visual.end - visual.start}。`),
        practiceQuestion(levels[2], `${visual.end} 的前一個數是多少？`, visual.end - 1, `${visual.end} 往前退一個，就是 ${visual.end - 1}。`),
      ];
    case 'place-value':
      return [
        practiceQuestion(levels[0], `${visual.value} 的十位數字是多少？`, visual.tens, `十位上的數字是 ${visual.tens}，代表 ${visual.tens} 個十。`),
        practiceQuestion(levels[1], `${visual.hundreds * 100}＋${visual.tens * 10}＋${visual.ones} 等於多少？`, visual.value, `把百、十、一合起來就是 ${visual.value}。`, numericOptions(visual.value, 10)),
        practiceQuestion(levels[2], `${visual.value} 再多 1 個十是多少？`, visual.value + 10, `多 1 個十就是加 10，得到 ${visual.value + 10}。`, numericOptions(visual.value + 10, 10)),
      ];
    case 'money': {
      const total = visual.hundreds * 100 + visual.tens * 10 + visual.ones;
      return [
        practiceQuestion(levels[0], `${visual.tens} 個 10 元合起來是多少元？`, visual.tens * 10, `每個是 10 元，${visual.tens} 個就是 ${visual.tens * 10} 元。`, numericOptions(visual.tens * 10, 10)),
        practiceQuestion(levels[1], `原來的錢再加 1 個 10 元，共有多少元？`, total + 10, `${total}＋10＝${total + 10} 元。`, numericOptions(total + 10, 10)),
        practiceQuestion(levels[2], `要付 ${total} 元，哪一種付法正確？`, `${visual.hundreds} 百、${visual.tens} 十、${visual.ones} 一`, `百、十、一的金額合起來正好是 ${total} 元。`, [`${visual.hundreds} 百、${visual.tens} 十、${visual.ones} 一`, `${visual.hundreds} 百、${visual.ones} 十、${visual.tens} 一`, `${visual.tens} 百、${visual.hundreds} 十、${visual.ones} 一`]),
      ];
    }
    case 'arithmetic': {
      const delta = visual.operator === '+' ? 2 : -2;
      const changed = visual.a + delta;
      const changedResult = visual.operator === '+' ? changed + visual.b : changed - visual.b;
      const check = visual.operator === '+' ? `${visual.result}－${visual.b}＝${visual.a}` : `${visual.result}＋${visual.b}＝${visual.a}`;
      return [
        practiceQuestion(levels[0], `${changed}${visual.operator}${visual.b} 等於多少？`, changedResult, `依位值計算，答案是 ${changedResult}。`, numericOptions(changedResult, 10)),
        practiceQuestion(levels[1], `原算式的答案 ${visual.result} 再多 10，是多少？`, visual.result + 10, `${visual.result}＋10＝${visual.result + 10}。`, numericOptions(visual.result + 10, 10)),
        practiceQuestion(levels[2], `哪一個算式可以檢查 ${visual.a}${visual.operator}${visual.b}＝${visual.result}？`, check, `用相反運算檢查，可以回到原來的數。`, [check, `${visual.result}＋${visual.b}＝${visual.a + visual.b + visual.result}`, `${visual.a}＋${visual.b}＝${visual.a + visual.b + 1}`]),
      ];
    }
    case 'comparison': {
      const symbol = visual.left > visual.right ? '＞' : visual.left < visual.right ? '＜' : '＝';
      const reverse = symbol === '＞' ? '＜' : symbol === '＜' ? '＞' : '＝';
      return [
        practiceQuestion(levels[0], `${visual.right} 和 ${visual.left} 中間要放哪個符號？`, reverse, `交換左右後，符號方向也要跟著改變。`, ['＞', '＜', '＝']),
        practiceQuestion(levels[1], `${visual.left + 10} 和 ${visual.right + 10} 中間要放哪個符號？`, symbol, `兩邊同時加 10，大小關係不會改變。`, ['＞', '＜', '＝']),
        practiceQuestion(levels[2], `${visual.left} 和 ${visual.left} 中間要放哪個符號？`, '＝', `兩個數完全相同，所以使用等號。`, ['＞', '＜', '＝']),
      ];
    }
    case 'part-whole': {
      const [first, second] = visual.parts;
      return [
        practiceQuestion(levels[0], `全體是 ${visual.total}，其中一部分是 ${first}，另一部分是多少？`, second, `${visual.total}－${first}＝${second}。`, numericOptions(second, 10)),
        practiceQuestion(levels[1], `${first} 和 ${second} 合起來是多少？`, visual.total, `${first}＋${second}＝${visual.total}。`, numericOptions(visual.total, 10)),
        practiceQuestion(levels[2], `已知兩個部分，要找全體應該用哪一種運算？`, '加法', `部分和部分合起來成為全體，所以用加法。`, ['加法', '減法', '只比較大小']),
      ];
    }
    case 'compare-bars': {
      const [longer, shorter] = visual.lengths;
      return [
        practiceQuestion(levels[0], `${longer} 格和 ${shorter} 格相差幾格？`, longer - shorter, `${longer}－${shorter}＝${longer - shorter} 格。`),
        practiceQuestion(levels[1], `短的物品再增加 ${longer - shorter} 格，會變成幾格？`, longer, `${shorter}＋${longer - shorter}＝${longer} 格。`),
        practiceQuestion(levels[2], `比較兩個物品長短前，最先要做什麼？`, '對齊同一起點', `起點相同，才能公平比較另一端。`, ['對齊同一起點', '只看顏色', '把短的移到前面']),
      ];
    }
    case 'units':
      return [
        practiceQuestion(levels[0], `同一長度用小單位量得 ${visual.smallCount} 個，用大單位量得 ${visual.largeCount} 個，哪個數量較少？`, `${visual.largeCount} 個`, `大單位每個較長，需要的個數比較少。`, [`${visual.smallCount} 個`, `${visual.largeCount} 個`, '一樣多']),
        practiceQuestion(levels[1], `兩種量法的單位個數相差多少？`, visual.smallCount - visual.largeCount, `${visual.smallCount}－${visual.largeCount}＝${visual.smallCount - visual.largeCount} 個。`),
        practiceQuestion(levels[2], `排測量單位時，哪一種做法正確？`, '首尾相接不留空隙', `單位要一樣大、首尾相接，而且不能重疊。`, ['首尾相接不留空隙', '中間留下空隙', '讓單位互相重疊']),
      ];
    case 'ruler': {
      const movedStart = Math.max(0, visual.start - 1);
      const movedEnd = movedStart + visual.length;
      return [
        practiceQuestion(levels[0], `一段線從刻度 ${movedStart} 到 ${movedEnd}，長幾公分？`, visual.length, `${movedEnd}－${movedStart}＝${visual.length} 公分。`),
        practiceQuestion(levels[1], `從刻度 0 畫 ${visual.length} 公分，終點在刻度幾？`, visual.length, `從 0 開始時，終點刻度就是長度 ${visual.length}。`),
        practiceQuestion(levels[2], `物品沒有從 0 開始時，怎麼算長度？`, '終點刻度－起點刻度', `用終點刻度減起點刻度，才是真正長度。`, ['終點刻度－起點刻度', '終點刻度＋起點刻度', '只讀終點刻度']),
      ];
    }
    case 'capacity': {
      const [first, second] = visual.values;
      const largerIndex = first >= second ? 0 : 1;
      const smallerIndex = largerIndex === 0 ? 1 : 0;
      return [
        practiceQuestion(levels[0], `${visual.labels[largerIndex]}和${visual.labels[smallerIndex]}相比，哪一個容量較大？`, visual.labels[largerIndex], `用相同杯子量，${visual.values[largerIndex]} 杯比 ${visual.values[smallerIndex]} 杯多。`, visual.labels),
        practiceQuestion(levels[1], `兩個容器的容量相差幾杯？`, Math.abs(first - second), `用較多杯數減較少杯數，相差 ${Math.abs(first - second)} 杯。`),
        practiceQuestion(levels[2], `公平比較容量時，兩邊要使用什麼？`, '相同大小的杯子', `單位相同，量得的杯數才能公平比較。`, ['相同大小的杯子', '大小不同的杯子', '只看容器高度']),
      ];
    }
    case 'two-step': {
      const firstResult = visual.values[1];
      const finalResult = visual.values[2];
      return [
        practiceQuestion(levels[0], `只完成第一步，會得到多少？`, firstResult, `從 ${visual.start} 開始做第一個變化，得到 ${firstResult}。`, numericOptions(firstResult, 10)),
        practiceQuestion(levels[1], `兩步都完成後，最後是多少？`, finalResult, `依故事順序走完兩步，最後得到 ${finalResult}。`, numericOptions(finalResult, 10)),
        practiceQuestion(levels[2], `做第二步時，要從哪個數開始？`, firstResult, `第一步的答案 ${firstResult}，就是第二步的新起點。`, numericOptions(firstResult, 10)),
      ];
    }
    case 'groups':
      return [
        practiceQuestion(levels[0], `每組 ${visual.each} 個，共 ${visual.groups + 1} 組，總共有幾個？`, visual.each * (visual.groups + 1), `${visual.each}×${visual.groups + 1}＝${visual.each * (visual.groups + 1)}。`, numericOptions(visual.each * (visual.groups + 1), visual.each)),
        practiceQuestion(levels[1], `${visual.total} 個平均排成 ${visual.groups} 組，每組有幾個？`, visual.each, `${visual.total} 是 ${visual.groups} 個 ${visual.each}，所以每組有 ${visual.each} 個。`),
        practiceQuestion(levels[2], `哪一個算式表示「每組 ${visual.each} 個，共 ${visual.groups} 組」？`, `${visual.each}×${visual.groups}`, `每組數量寫在前面，組數寫在後面。`, [`${visual.each}×${visual.groups}`, `${visual.each}＋${visual.groups}`, `${visual.groups}－${visual.each}`]),
      ];
    case 'clock': {
      const nextMinute = (visual.minute + 15) % 60;
      const nextHour = (visual.hour + Math.floor((visual.minute + 15) / 60)) % 12 || 12;
      return [
        practiceQuestion(levels[0], `分針指向第 ${visual.minute / 5 || 12} 個大格，表示幾分？`, visual.minute, `每一大格是 5 分鐘，所以是 ${visual.minute} 分。`, numericOptions(visual.minute, 5)),
        practiceQuestion(levels[1], `${formatTime(visual.hour, visual.minute)} 再過 15 分鐘，是什麼時刻？`, formatTime(nextHour, nextMinute), `分針再走 15 分鐘，時刻變成 ${formatTime(nextHour, nextMinute)}。`, [formatTime(nextHour, nextMinute), formatTime(visual.hour, (visual.minute + 5) % 60), formatTime(nextHour, visual.minute)]),
        practiceQuestion(levels[2], `讀鐘面時，短針和長針分別表示什麼？`, '短針看時，長針看分', `先分清楚時針和分針，才不會把時和分顛倒。`, ['短針看時，長針看分', '短針看分，長針看時', '兩根都只看幾時']),
      ];
    }
    case 'timeline': {
      const [startHour, startMinute] = visual.start.split(':').map(Number);
      return [
        practiceQuestion(levels[0], `${visual.start} 再過 ${visual.minutes} 分鐘，是什麼時刻？`, visual.end, `從開始時刻往後走 ${visual.minutes} 分鐘，會到 ${visual.end}。`, [visual.end, visual.start, `${startHour + 1}:${String(startMinute).padStart(2, '0')}`]),
        practiceQuestion(levels[1], `原來經過 ${visual.minutes} 分鐘，再多 10 分鐘，共經過多久？`, visual.minutes + 10, `${visual.minutes}＋10＝${visual.minutes + 10} 分鐘。`, numericOptions(visual.minutes + 10, 10)),
        practiceQuestion(levels[2], `求經過時間時，應該怎麼想？`, '從開始走到結束', `經過時間是兩個時刻之間走過的距離。`, ['從開始走到結束', '把兩個時刻直接相加', '只看開始時刻']),
      ];
    }
    case 'area-compare': {
      const largerIndex = visual.areas[0] >= visual.areas[1] ? 0 : 1;
      return [
        practiceQuestion(levels[0], `用同樣方格測量，${visual.labels[0]}有 ${visual.areas[0]} 格、${visual.labels[1]}有 ${visual.areas[1]} 格，哪個面較大？`, visual.labels[largerIndex], `相同單位下，方格較多的面比較大。`, visual.labels),
        practiceQuestion(levels[1], `兩個面相差幾個相同方格？`, Math.abs(visual.areas[0] - visual.areas[1]), `較多格減較少格，相差 ${Math.abs(visual.areas[0] - visual.areas[1])} 格。`),
        practiceQuestion(levels[2], `直接比較面的大小，可以使用哪個方法？`, '把兩個面重疊', `重疊後觀察哪一個面露在外面，就能直接比較。`, ['把兩個面重疊', '只看一條邊', '只看顏色']),
      ];
    }
    case 'area':
      return [
        practiceQuestion(levels[0], `${visual.rows} 排、每排 ${visual.columns + 1} 格，共有幾格？`, visual.rows * (visual.columns + 1), `${visual.rows}×${visual.columns + 1}＝${visual.rows * (visual.columns + 1)} 格。`, numericOptions(visual.rows * (visual.columns + 1), visual.rows)),
        practiceQuestion(levels[1], `原來 ${visual.unitCount} 格，再增加一排 ${visual.columns} 格，共有幾格？`, visual.unitCount + visual.columns, `${visual.unitCount}＋${visual.columns}＝${visual.unitCount + visual.columns} 格。`, numericOptions(visual.unitCount + visual.columns, visual.columns)),
        practiceQuestion(levels[2], `用方格比較兩個面的大小時，方格必須怎樣？`, '每一格一樣大', `只有使用相同大小的單位，數量才可以公平比較。`, ['每一格一樣大', '兩邊大小不同', '可以重疊或留空']),
      ];
    default:
      return [
        practiceQuestion(levels[0], `關於「${lesson.title}」，哪一項是重要方法？`, lesson.remember, `這就是本課最重要的記憶句。`, [lesson.remember, lesson.mistake]),
        practiceQuestion(levels[1], `完成「${lesson.title}」時，要先做什麼？`, lesson.steps[0], `先做好第一步，後面才會順利。`, lesson.steps),
        practiceQuestion(levels[2], `哪一項是「${lesson.title}」常見的錯誤？`, lesson.mistake, `避開這個陷阱，答案會更可靠。`, [lesson.mistake, lesson.remember]),
      ];
  }
}

export function buildPracticeSet(lesson, unitLessons = []) {
  const enrichExplanation = (question) => ({
    ...question,
    explain: question.explain.length >= 8
      ? question.explain
      : `${question.explain}把答案放回題目再檢查一次。`,
  });
  const base = {
    level: '暖身',
    ...lesson.question,
    explain: lesson.question.explain.length >= 8
      ? lesson.question.explain
      : `${lesson.question.explain}把答案放回題目再檢查一次。`,
  };
  const ownQuestions = [base, ...practiceVariants(lesson)];
  if (lesson.kind !== 'challenge') return ownQuestions.map(enrichExplanation);

  const sourceSets = [
    ownQuestions,
    ...unitLessons
      .filter((item) => item.kind !== 'challenge')
      .map((item) => buildPracticeSet(item)),
  ];
  const candidates = Array.from({ length: 4 }, (_, round) =>
    sourceSets.map((questions) => questions[round])).flat().filter(Boolean);
  const unique = candidates.filter((question, index) =>
    candidates.findIndex((other) => other.prompt === question.prompt) === index);
  const reviewQuestions = [
    practiceQuestion('整合', `完成「${lesson.title}」時，第一步應該做什麼？`, lesson.steps[0], `先找出重要資訊，才能選擇正確的方法。`, lesson.steps),
    practiceQuestion('易錯', `哪一項是「${lesson.title}」中特別要避開的錯誤？`, lesson.mistake, `認出常見陷阱，檢查時就能及早修正。`, [lesson.mistake, lesson.remember, lesson.steps[0]]),
    practiceQuestion('達人', `完成挑戰後，哪一句最值得記住？`, lesson.remember, `這句話能提醒你把方法和檢查一起做好。`, [lesson.remember, lesson.mistake, lesson.steps[1]]),
  ];
  const fullSet = [...unique, ...reviewQuestions].filter((question, index, items) =>
    items.findIndex((other) => other.prompt === question.prompt) === index);
  return fullSet.slice(0, 10).map((question, index) => enrichExplanation({
      ...question,
      level: ['暖身', '觀念', '熟練', '圖像', '應用', '生活', '判斷', '易錯', '整合', '達人'][index],
    }));
}

export function createPracticeSession(questions) {
  return { current: 0, correct: 0, completed: questions.length === 0 };
}

export function answerPracticeQuestion(session, questions, choice) {
  if (session.completed) return session;
  const expected = questions[session.current]?.answer;
  const lastCorrect = String(choice) === String(expected);
  if (!lastCorrect) return { ...session, lastCorrect };
  const correct = session.correct + 1;
  const completed = correct === questions.length;
  return {
    current: completed ? session.current : session.current + 1,
    correct,
    completed,
    lastCorrect,
  };
}

export function buildVisualModel(spec) {
  switch (spec.type) {
    case 'arithmetic':
      return { ...spec, result: spec.operator === '+' ? spec.a + spec.b : spec.a - spec.b };
    case 'groups':
      return { ...spec, total: spec.groups * spec.each };
    case 'clock':
      return {
        ...spec,
        minuteAngle: spec.minute * 6,
        hourAngle: (spec.hour % 12) * 30 + spec.minute * 0.5,
      };
    case 'area':
      return { ...spec, unitCount: spec.rows * spec.columns };
    case 'ruler': {
      const left = Math.min(spec.start, spec.end);
      const right = Math.max(spec.start, spec.end);
      return {
        ...spec,
        length: right - left,
        leftPercent: (left / spec.max) * 100,
        widthPercent: ((right - left) / spec.max) * 100,
        rightPercent: (right / spec.max) * 100,
      };
    }
    case 'two-step': {
      const values = [spec.start];
      spec.steps.forEach((amount) => values.push(values.at(-1) + amount));
      return { ...spec, values };
    }
    case 'place-value':
      return {
        ...spec,
        hundreds: Math.floor(spec.value / 100),
        tens: Math.floor((spec.value % 100) / 10),
        ones: spec.value % 10,
      };
    default:
      return { ...spec };
  }
}
