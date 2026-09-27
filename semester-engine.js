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

const practiceQuestion = (level, prompt, answer, explain, options, extras = {}) => ({
  level,
  prompt,
  answer,
  explain,
  options: options ?? numericOptions(answer),
  responseType: extras.responseType || 'choice',
  visual: extras.visual || null,
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

const visualQuestion = (level, prompt, answer, explain, visual, responseType = 'input', options) =>
  practiceQuestion(level, prompt, answer, explain, responseType === 'choice' ? options : [], { responseType, visual });

function stableIndexOrder(length, seed) {
  const order = Array.from({ length }, (_, index) => index);
  let state = [...seed].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
  for (let index = length - 1; index > 0; index -= 1) {
    state = ((state * 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  return order;
}

function balanceChoicePositions(questions, seed) {
  const usedByOptionCount = new Map();
  return questions.map((question) => {
    if (question.responseType !== 'choice' || question.options.length < 2) return question;
    const optionCount = question.options.length;
    const used = usedByOptionCount.get(optionCount) || 0;
    usedByOptionCount.set(optionCount, used + 1);
    const cycle = Math.floor(used / optionCount);
    const positionOrder = stableIndexOrder(optionCount, `${seed}:${optionCount}:${cycle}`);
    const targetIndex = positionOrder[used % optionCount];
    const answerIndex = question.options.indexOf(question.answer);
    if (answerIndex === targetIndex) return question;
    const options = question.options.filter((_, index) => index !== answerIndex);
    options.splice(targetIndex, 0, question.answer);
    return { ...question, options };
  });
}

function visualPracticeVariants(lesson) {
  const visual = buildVisualModel(lesson.visual);
  switch (visual.type) {
    case 'numberline': {
      const values = [visual.focus - 2, visual.focus - 1, null, visual.focus + 1, visual.focus + 2];
      return [
        visualQuestion('填空', '數列中空格應該填哪一個數？', visual.focus, `前後每次都多 1，空格是 ${visual.focus}。`, { type: 'sequence', values }),
        visualQuestion('圖像', `從 ${visual.start} 走到 ${visual.end}，數線上共前進幾格？`, visual.end - visual.start, `${visual.end}－${visual.start}＝${visual.end - visual.start}。`, { type: 'sequence', values: [visual.start, null, visual.end], connector: '→' }),
        visualQuestion('應用', `數到 ${visual.focus + 2} 之後，下一個數是多少？`, visual.focus + 3, `往後數一個就是 ${visual.focus + 3}。`, { type: 'sequence', values: [visual.focus, visual.focus + 1, visual.focus + 2, null] }, 'choice', numericOptions(visual.focus + 3)),
        visualQuestion('易錯', '數字在數線上變大時，應該往哪裡走？', '往右', '數線往右的數會變大。', { type: 'sequence', values }, 'choice', ['往右', '往左', '留在原地']),
      ];
    }
    case 'place-value': {
      const hundreds = visual.hundreds;
      const tens = visual.tens;
      const ones = visual.ones;
      const value = hundreds * 100 + tens * 10 + ones;
      const model = { type: 'place-value', hundreds, tens, ones };
      return [
        visualQuestion('填空', '圖中的百、十、一合起來是多少？', value, `${hundreds} 個百、${tens} 個十、${ones} 個一合起來是 ${value}。`, model),
        visualQuestion('圖像', `這個數的十位代表多少？`, tens * 10, `十位是 ${tens}，代表 ${tens} 個十，也就是 ${tens * 10}。`, model),
        visualQuestion('應用', '哪一個式子與圖中的位值模型相同？', `${hundreds * 100}＋${tens * 10}＋${ones}`, '依序寫出百位、十位與個位的值。', model, 'choice', [`${hundreds * 100}＋${tens * 10}＋${ones}`, `${hundreds * 100}＋${ones * 10}＋${tens}`, `${tens * 100}＋${hundreds * 10}＋${ones}`]),
        visualQuestion('易錯', `如果再加 1 個十，會變成多少？`, value + 10, `${value}＋10＝${value + 10}。`, model, 'choice', numericOptions(value + 10, 10)),
      ];
    }
    case 'money': {
      const hundreds = visual.hundreds;
      const tens = visual.tens;
      const ones = visual.ones;
      const value = hundreds * 100 + tens * 10 + ones;
      const model = { type: 'money', hundreds, tens, ones };
      const target = value + 18;
      const price = value - 12;
      const payment = `${hundreds} 張 100 元、${tens} 個 10 元、${ones} 個 1 元`;
      return [
        visualQuestion('數錢', '數一數圖中的紙鈔和硬幣，一共有多少元？', value, `把 ${hundreds * 100}、${tens * 10} 和 ${ones} 合起來，共 ${value} 元。`, model),
        visualQuestion('補足', `圖中有 ${value} 元，要買 ${target} 元的物品，還差多少元？`, target - value, `${target}－${value}＝${target - value} 元。`, model),
        visualQuestion('付款', `要剛好付 ${value} 元，哪一種拿法正確？`, payment, '分別看百元、十元與一元的張數，合起來要剛好。', model, 'choice', [payment, `${hundreds} 張 100 元、${ones} 個 10 元、${tens} 個 1 元`, `${tens} 張 100 元、${hundreds} 個 10 元、${ones} 個 1 元`]),
        visualQuestion('找零', `拿圖中的錢買 ${price} 元的物品，會找回多少元？`, value - price, `${value}－${price}＝${value - price} 元。`, model, 'choice', numericOptions(value - price, 10)),
      ];
    }
    case 'arithmetic': {
      const result = visual.result;
      const inverse = visual.operator === '+' ? '－' : '＋';
      return [
        visualQuestion('直式', '看直式算出答案。', result, `${visual.a}${visual.operator}${visual.b}＝${result}。`, { type: 'vertical', a: visual.a, b: visual.b, operator: visual.operator }),
        visualQuestion('填空', `答案 ${result} 再加 10 是多少？`, result + 10, `${result}＋10＝${result + 10}。`, { type: 'vertical', a: result, b: 10, operator: '+' }),
        visualQuestion('驗算', '哪一個運算可以用來驗算？', inverse === '－' ? `${result}－${visual.b}＝${visual.a}` : `${result}＋${visual.b}＝${visual.a}`, '用相反運算可以回到原來的數。', { type: 'vertical', a: visual.a, b: visual.b, operator: visual.operator }, 'choice', inverse === '－' ? [`${result}－${visual.b}＝${visual.a}`, `${result}＋${visual.b}＝${visual.a}`, `${visual.a}－${visual.b}＝${result}`] : [`${result}＋${visual.b}＝${visual.a}`, `${result}－${visual.b}＝${visual.a}`, `${visual.a}＋${visual.b}＝${result}`]),
        visualQuestion('易錯', '直式計算時最先要檢查什麼？', '位值對齊', '個位對個位、十位對十位，才能正確計算。', { type: 'vertical', a: visual.a, b: visual.b, operator: visual.operator }, 'choice', ['位值對齊', '只看答案大小', '把數字全部靠左']),
      ];
    }
    case 'comparison': {
      const difference = Math.abs(visual.left - visual.right);
      const symbol = visual.left > visual.right ? '＞' : visual.left < visual.right ? '＜' : '＝';
      return [
        visualQuestion('填空', '兩個數相差多少？', difference, `大數減小數，相差 ${difference}。`, { type: 'vertical', a: Math.max(visual.left, visual.right), b: Math.min(visual.left, visual.right), operator: '－' }),
        visualQuestion('圖像', `如果兩邊都加 10，${visual.left + 10} 與 ${visual.right + 10} 相差多少？`, difference, '兩邊加上相同數，相差不變。', { type: 'vertical', a: Math.max(visual.left, visual.right) + 10, b: Math.min(visual.left, visual.right) + 10, operator: '－' }),
        visualQuestion('應用', `看數列判斷：${visual.left} 應該用哪個符號和 ${visual.right} 比較？`, symbol, '從高位開始比較。', { type: 'sequence', values: [visual.left, null, visual.right], connector: '' }, 'choice', ['＞', '＜', '＝']),
        visualQuestion('易錯', '大於、小於符號的大開口要朝向哪裡？', '較大的數', '符號的大開口朝向較大的數。', { type: 'sequence', values: [visual.left, symbol, visual.right], connector: '' }, 'choice', ['較大的數', '較小的數', '永遠朝右']),
      ];
    }
    case 'part-whole': {
      const [first, second] = visual.parts;
      return [
        visualQuestion('圖像', `全體 ${visual.total} 裡已知 ${first}，另一部分是多少？`, second, `${visual.total}－${first}＝${second}。`, { type: 'groups', groups: 2, counts: [first, second], total: visual.total, icon: '●' }),
        visualQuestion('填空', `${first}＋□＝${visual.total}，□是多少？`, second, `缺少的部分是 ${visual.total}－${first}＝${second}。`, { type: 'vertical', a: visual.total, b: first, operator: '－' }),
        visualQuestion('應用', '已知兩個部分，要找全體用什麼運算？', '加法', '兩個部分合起來就是全體。', { type: 'groups', groups: 2, counts: [first, second], total: visual.total, icon: '●' }, 'choice', ['加法', '減法', '大小比較']),
        visualQuestion('驗算', '哪一個式子可以檢查全體和部分？', `${first}＋${second}＝${visual.total}`, '兩個部分相加要回到全體。', { type: 'groups', groups: 2, counts: [first, second], total: visual.total, icon: '●' }, 'choice', [`${first}＋${second}＝${visual.total}`, `${visual.total}＋${first}＝${second}`, `${first}－${second}＝${visual.total}`]),
      ];
    }
    case 'compare-bars':
    case 'units':
    case 'ruler': {
      const first = visual.type === 'compare-bars' ? visual.lengths[0] : visual.type === 'units' ? visual.smallCount : visual.length;
      const second = visual.type === 'compare-bars' ? visual.lengths[1] : visual.type === 'units' ? visual.largeCount : Math.max(0, visual.length - 1);
      const ruler = visual.type === 'ruler'
        ? { type: 'ruler', start: visual.start, end: visual.end, max: visual.max }
        : { type: 'ruler', start: 0, end: Math.max(first, second), max: Math.max(10, first, second) };
      return [
        visualQuestion('測量', '看圖算出較長的長度或單位數。', Math.max(first, second), `較長的是 ${Math.max(first, second)}。`, ruler),
        visualQuestion('填空', '兩個長度或單位數相差多少？', Math.abs(first - second), `大數減小數，相差 ${Math.abs(first - second)}。`, ruler),
        visualQuestion('圖像', '測量時要先確認什麼？', '起點和終點', '先找到起點與終點，再計算中間距離。', ruler, 'choice', ['起點和終點', '只看終點', '只看物品顏色']),
        visualQuestion('易錯', '物品沒有從 0 開始時，怎麼求長度？', '終點刻度－起點刻度', '長度是兩端刻度之間的差。', ruler, 'choice', ['終點刻度－起點刻度', '終點刻度＋起點刻度', '只讀終點刻度']),
      ];
    }
    case 'capacity': {
      const [first, second] = visual.values;
      const largerIndex = first >= second ? 0 : 1;
      const capacity = { type: 'capacity', values: visual.values, labels: visual.labels };
      return [
        visualQuestion('填空', `看杯數圖填空：兩個容器相差幾杯？`, Math.abs(first - second), `較多杯減較少杯，相差 ${Math.abs(first - second)} 杯。`, capacity),
        visualQuestion('圖像', '較大的容量是幾杯？', Math.max(first, second), `圖中較多的是 ${Math.max(first, second)} 杯。`, capacity),
        visualQuestion('應用', '哪一個容器的容量較大？', visual.labels[largerIndex], '用同樣大的杯子量，杯數較多的容量較大。', capacity, 'choice', visual.labels),
        visualQuestion('易錯', '圖中為什麼可以直接比杯數？', '使用相同大小的杯子', '單位相同，數量才能公平比較。', capacity, 'choice', ['使用相同大小的杯子', '容器顏色相同', '容器高度相同']),
      ];
    }
    case 'two-step': {
      const first = visual.values[1];
      const result = visual.values[2];
      const model = { type: 'vertical', a: visual.start, b: visual.steps[0], operator: visual.steps[0] >= 0 ? '+' : '－', trail: visual.values };
      return [
        visualQuestion('填空', '故事的第一步完成後是多少？', first, `第一步後是 ${first}。`, model),
        visualQuestion('圖像', '兩步全部完成後是多少？', result, `依故事順序完成後是 ${result}。`, model),
        visualQuestion('應用', '做第二步時應該從哪個數開始？', first, '第一步的答案就是第二步的新起點。', model, 'choice', numericOptions(first, 10)),
        visualQuestion('易錯', '兩步驟題應該按什麼順序計算？', '按故事發生的順序', '先完成第一個變化，再做第二個變化。', model, 'choice', ['按故事發生的順序', '先算數字較大的', '只算最後一步']),
      ];
    }
    case 'groups': {
      const model = { type: 'groups', groups: visual.groups, each: visual.each, icon: '🍎' };
      return [
        visualQuestion('圖像', '看圖數一數，一共有幾個？', visual.total, `${visual.groups} 組、每組 ${visual.each} 個，共 ${visual.total} 個。`, model),
        visualQuestion('填空', `每組 ${visual.each} 個，共 ${visual.total} 個，可以分成幾組？`, visual.groups, `${visual.total} 是 ${visual.groups} 個 ${visual.each}。`, model),
        visualQuestion('算式', '哪一個乘法算式和圖相同？', `${visual.each}×${visual.groups}`, '每組數量在前，組數在後。', model, 'choice', [`${visual.each}×${visual.groups}`, `${visual.each}＋${visual.groups}`, `${visual.total}－${visual.each}`]),
        visualQuestion('應用', `如果再加一組 ${visual.each} 個，一共有幾個？`, visual.total + visual.each, `${visual.total}＋${visual.each}＝${visual.total + visual.each}。`, model, 'choice', numericOptions(visual.total + visual.each, visual.each)),
      ];
    }
    case 'clock': {
      const clock = { type: 'clock', hour: visual.hour, minute: visual.minute };
      const minutePointer = visual.minute === 0 ? 12 : visual.minute / 5;
      return [
        visualQuestion('鐘面', '分針指向的大格代表幾分？', visual.minute, `分針指向 ${minutePointer}，代表 ${visual.minute} 分。`, clock),
        visualQuestion('填空', '鐘面上的短針告訴我們幾時？', visual.hour, `短針是時針，這時是 ${visual.hour} 時。`, clock),
        visualQuestion('報讀', '這個鐘面是幾時幾分？', formatTime(visual.hour, visual.minute), '先看分針，再看時針。', clock, 'choice', [formatTime(visual.hour, visual.minute), formatTime(visual.hour, (visual.minute + 5) % 60), formatTime((visual.hour % 12) + 1, visual.minute)]),
        visualQuestion('易錯', '鐘面上的長針主要看什麼？', '幾分', '長針是分針，用來看幾分。', clock, 'choice', ['幾分', '幾時', '星期幾']),
      ];
    }
    case 'timeline': {
      const timeline = { type: 'timeline', start: visual.start, end: visual.end, minutes: visual.minutes };
      const [endHour, endMinute] = visual.end.split(':').map(Number);
      return [
        visualQuestion('時間線', '從開始到結束共經過幾分鐘？', visual.minutes, `沿時間線從 ${visual.start} 走到 ${visual.end}，共 ${visual.minutes} 分鐘。`, timeline),
        visualQuestion('填空', '結束時刻的分針是幾分？', endMinute, `結束時刻是 ${visual.end}，所以是 ${endMinute} 分。`, timeline),
        visualQuestion('應用', '時間線上的右邊端點代表什麼？', '結束時刻', '時間從左往右前進，右端是結束時刻。', timeline, 'choice', ['結束時刻', '開始時刻', '容量大小']),
        visualQuestion('易錯', '求經過時間時應該怎麼想？', '從開始走到結束', '經過時間是兩個時刻之間的距離。', timeline, 'choice', ['從開始走到結束', '把兩個時刻相加', `只看 ${endHour} 時`]),
      ];
    }
    case 'area-compare':
    case 'area': {
      const areas = visual.type === 'area-compare' ? visual.areas : [visual.unitCount, visual.unitCount + visual.columns];
      const labels = visual.type === 'area-compare' ? visual.labels : ['原來的面', '多一排的面'];
      const maxArea = Math.max(...areas);
      const areaModel = { type: 'area-grid', areas, labels, rows: visual.rows, columns: visual.columns };
      return [
        visualQuestion('方格', '圖中較大的面有幾個方格？', maxArea, `方格較多的面有 ${maxArea} 格。`, areaModel),
        visualQuestion('填空', '兩個面相差幾個方格？', Math.abs(areas[0] - areas[1]), `較多格減較少格，相差 ${Math.abs(areas[0] - areas[1])} 格。`, areaModel),
        visualQuestion('比較', '用方格比較時，方格必須怎樣？', '每一格一樣大', '單位方格同大才能公平比較。', areaModel, 'choice', ['每一格一樣大', '兩邊格子大小不同', '只數外圈']),
        visualQuestion('易錯', '鋪方格時哪一種做法正確？', '鋪滿、不留縫、不重疊', '每一格都要剛好鋪在面上。', areaModel, 'choice', ['鋪滿、不留縫、不重疊', '中間可以留縫', '方格可以互相重疊']),
      ];
    }
    default:
      return [];
  }
}

export function buildPracticeSet(lesson, unitLessons = []) {
  const enrichExplanation = (question) => ({
    ...question,
    responseType: question.responseType || 'choice',
    visual: question.visual || null,
    explain: question.explain.length >= 8
      ? question.explain
      : `${question.explain}把答案放回題目再檢查一次。`,
  });
  const base = {
    level: '暖身',
    ...lesson.question,
    responseType: lesson.question.responseType || 'choice',
    visual: lesson.question.visual || null,
    explain: lesson.question.explain.length >= 8
      ? lesson.question.explain
      : `${lesson.question.explain}把答案放回題目再檢查一次。`,
  };
  const ownQuestions = [base, ...practiceVariants(lesson), ...visualPracticeVariants(lesson)];
  const positionSeed = `${lesson.code || 'challenge'}:${lesson.title}`;
  if (lesson.kind !== 'challenge') return balanceChoicePositions(ownQuestions.map(enrichExplanation), positionSeed);

  const sourceSets = [
    ownQuestions,
    ...unitLessons
      .filter((item) => item.kind !== 'challenge')
      .map((item) => buildPracticeSet(item)),
  ];
  const roundOrder = [0, 4, 1, 5, 2, 6, 3, 7];
  const candidates = roundOrder.map((round) =>
    sourceSets.map((questions) => questions[round])).flat().filter(Boolean);
  const unique = candidates.filter((question, index) =>
    candidates.findIndex((other) => other.prompt === question.prompt) === index);
  const reviewQuestions = [
    practiceQuestion('整合', `完成「${lesson.title}」時，第一步應該做什麼？`, lesson.steps[0], `先找出重要資訊，才能選擇正確的方法。`, lesson.steps),
    practiceQuestion('易錯', `哪一項是「${lesson.title}」中特別要避開的錯誤？`, lesson.mistake, `認出常見陷阱，檢查時就能及早修正。`, [lesson.mistake, lesson.remember, lesson.steps[0]]),
    practiceQuestion('達人', `完成挑戰後，哪一句最值得記住？`, lesson.remember, `這句話能提醒你把方法和檢查一起做好。`, [lesson.remember, lesson.mistake, lesson.steps[1]]),
    practiceQuestion('複習', `遇到「${lesson.title}」的新題目時，先找哪個提示？`, lesson.steps[0], `先使用本課的第一個步驟，能幫助你找到解題方向。`, lesson.steps),
    practiceQuestion('檢查', `寫完「${lesson.title}」後，哪個做法最可靠？`, lesson.remember, `用本課的記憶句重新檢查，能及早發現錯誤。`, [lesson.remember, lesson.mistake, lesson.steps[0]]),
  ];
  const fullSet = [...unique, ...reviewQuestions].filter((question, index, items) =>
    items.findIndex((other) => other.prompt === question.prompt) === index);
  const challengeLevels = ['暖身', '圖像', '觀念', '填空', '熟練', '生活', '應用', '判斷', '易錯', '驗算', '整合', '推理', '進階', '複習', '達人'];
  return balanceChoicePositions(fullSet.slice(0, 15).map((question, index) => enrichExplanation({
      ...question,
      level: challengeLevels[index],
    })), positionSeed);
}

export function createPracticeSession(questions) {
  return { current: 0, correct: 0, completed: questions.length === 0 };
}

export function answerPracticeQuestion(session, questions, choice) {
  if (session.completed) return session;
  const expected = questions[session.current]?.answer;
  const lastCorrect = normalizePracticeAnswer(choice) === normalizePracticeAnswer(expected);
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

export function normalizePracticeAnswer(value) {
  return String(value ?? '')
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, ' ')
    .trim();
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
