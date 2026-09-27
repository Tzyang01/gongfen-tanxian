export function createGuidedSession(questions, skillId) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('引導式學習需要至少一題');
  }
  return {
    skillId,
    questionIndex: 0,
    stepIndex: 0,
    hintLevel: 0,
    usedHintOnQuestion: false,
    independentCorrectStreak: 0,
    status: 'guided',
    completed: false,
    errorCounts: {},
    masteredSkill: null,
  };
}

export function answerGuidedStep(session, questions, choice) {
  if (session.completed) return session;
  const step = currentGuidedStep(session, questions);
  if (!step || step.kind === 'listen') return session;
  const correct = String(choice) === String(step.answer);
  if (correct) {
    const question = questions[session.questionIndex];
    const isFinalStep = session.stepIndex === question.steps.length - 1;
    if (!isFinalStep) {
      return {
        ...session,
        stepIndex: session.stepIndex + 1,
        hintLevel: 0,
        feedback: { correct: true },
      };
    }

    const independentCorrectStreak = session.usedHintOnQuestion
      ? 0
      : session.independentCorrectStreak + 1;
    const completed = independentCorrectStreak >= 2;
    return {
      ...session,
      questionIndex: completed ? session.questionIndex : (session.questionIndex + 1) % questions.length,
      stepIndex: completed ? session.stepIndex : 0,
      hintLevel: 0,
      usedHintOnQuestion: false,
      independentCorrectStreak,
      status: completed ? 'mastered' : session.usedHintOnQuestion ? 'guided' : 'practicing',
      completed,
      masteredSkill: completed ? session.skillId : null,
      feedback: { correct: true, questionCompleted: true, mastered: completed },
    };
  }

  const hintLevel = Math.min(3, session.hintLevel + 1);
  const errorTag = step.errorTag || 'needs-support';
  return {
    ...session,
    hintLevel,
    usedHintOnQuestion: true,
    errorCounts: {
      ...session.errorCounts,
      [errorTag]: (session.errorCounts[errorTag] || 0) + 1,
    },
    feedback: {
      correct: false,
      hint: step.hints?.[hintLevel - 1] ?? '再看一次題目裡的數量關係。',
      errorTag,
    },
  };
}

export function advanceGuidedStep(session, questions) {
  if (session.completed) return session;
  const question = questions[session.questionIndex];
  if (!question || session.stepIndex >= question.steps.length - 1) return session;
  return {
    ...session,
    stepIndex: session.stepIndex + 1,
    hintLevel: 0,
    feedback: undefined,
  };
}

export function currentGuidedStep(session, questions) {
  const question=questions[session.questionIndex];
  const step=question?.steps?.[session.stepIndex] ?? null;
  if(!step || step.kind!=='choice') return step;
  const options=step.options.filter(value=>String(value)!==String(step.answer));
  const seed=[...(question.id || String(session.questionIndex))].reduce((sum,c)=>sum+c.charCodeAt(0),0);
  const position=(seed+session.stepIndex)%(options.length+1);
  options.splice(position,0,step.answer);
  return {...step,options};
}

export function completedGuidedModel(session, questions) {
  const steps=questions[session.questionIndex]?.steps || [];
  const index=steps.findIndex(step=>step.id==='model');
  return index>=0 && session.stepIndex>index ? steps[index].answer : null;
}

const blankSkill = () => ({
  state: 'not_started',
  independentCorrectStreak: 0,
  attempts: 0,
  errorCounts: {},
  lastPracticedAt: null,
});

const skillMap = (skillIds = []) => Object.fromEntries(skillIds.map((id) => [id, blankSkill()]));

const normalizeSkills = (skills, skillIds) => {
  const savedSkills = skills && typeof skills === 'object' ? skills : {};
  return {
    ...savedSkills,
    ...Object.fromEntries(skillIds.map((id) => [id, {
      ...blankSkill(),
      ...(savedSkills[id] || {}),
      errorCounts: savedSkills[id]?.errorCounts && typeof savedSkills[id].errorCounts === 'object'
        ? savedSkills[id].errorCounts
        : {},
    }])),
  };
};

export function restoreLearnerStore(raw, legacyProgress, skillIds = []) {
  try {
    const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (saved?.schemaVersion === 2 && saved.profiles?.[saved.activeProfileId]) {
      return {
        ...saved,
        profiles: Object.fromEntries(Object.entries(saved.profiles).map(([id, profile]) => [id, {
          ...profile,
          id,
          nickname: typeof profile?.nickname === 'string' ? profile.nickname : '小小探險家',
          avatar: typeof profile?.avatar === 'string' ? profile.avatar : '🦊',
          semesterProgress: profile?.semesterProgress || legacyProgress,
          skills: normalizeSkills(profile?.skills, skillIds),
          restoredScenes: Array.isArray(profile?.restoredScenes) ? profile.restoredScenes : [],
        }])),
      };
    }
  } catch {
    // 損壞的本機資料改用安全的預設角色。
  }
  return {
    schemaVersion: 2,
    activeProfileId: 'learner-1',
    profiles: {
      'learner-1': {
        id: 'learner-1',
        nickname: '小小探險家',
        avatar: '🦊',
        semesterProgress: legacyProgress,
        skills: skillMap(skillIds),
        restoredScenes: [],
      },
    },
  };
}

export function addLearnerProfile(store, profile, semesterProgress, skillIds = []) {
  const nextNumber = Object.keys(store.profiles).reduce((max, id) => {
    const match = id.match(/^learner-(\d+)$/);
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0) + 1;
  const id = `learner-${nextNumber}`;
  return {
    ...store,
    activeProfileId: id,
    profiles: {
      ...store.profiles,
      [id]: {
        id,
        nickname: profile.nickname.trim() || `探險家 ${nextNumber}`,
        avatar: profile.avatar || '🌟',
        semesterProgress,
        skills: skillMap(skillIds),
        restoredScenes: [],
      },
    },
  };
}

export function setActiveLearner(store, profileId) {
  return store.profiles[profileId] ? { ...store, activeProfileId: profileId } : store;
}

export function recordGuidedSession(store, profileId, session, practicedAt = new Date().toISOString()) {
  const profile = store.profiles[profileId];
  if (!profile || !session?.skillId) return store;
  const previous = profile.skills[session.skillId] || blankSkill();
  const errorCounts = { ...previous.errorCounts };
  for (const [tag, count] of Object.entries(session.errorCounts || {})) {
    errorCounts[tag] = (errorCounts[tag] || 0) + count;
  }
  const state = previous.state === 'mastered' || session.completed
    ? 'mastered'
    : session.status === 'guided' ? 'guided' : 'practicing';
  const restoredScenes = session.completed
    ? [...new Set([...profile.restoredScenes, session.skillId])]
    : profile.restoredScenes;
  return {
    ...store,
    profiles: {
      ...store.profiles,
      [profileId]: {
        ...profile,
        restoredScenes,
        skills: {
          ...profile.skills,
          [session.skillId]: {
            ...previous,
            state,
            independentCorrectStreak: state === 'mastered'
              ? Math.max(2, previous.independentCorrectStreak)
              : session.independentCorrectStreak,
            attempts: previous.attempts + 1,
            errorCounts,
            lastPracticedAt: practicedAt,
          },
        },
      },
    },
  };
}

const stateLabels = {
  not_started: '還沒開始',
  guided: '需要引導',
  practicing: '正在練習',
  mastered: '已精熟',
  needs_review: '需要再複習',
};

const errorLabels = {
  'addition-carry': '個位滿十時還需要練習進一個十',
  'area-alignment': '重疊比較時需要先對齊邊或角',
  'area-array-model': '排數與每排方格數容易混淆',
  'area-array-operation': '用排與列出乘法算式還不穩定',
  'area-common-unit': '間接比較時容易忽略單位方格要同大',
  'area-comparison': '需要再確認露出範圍或方格數代表的大小',
  'area-counting-order': '數方格時還需要固定排與列的順序',
  'area-covering': '方格鋪面時容易留縫或重疊',
  'area-overlap-interpretation': '重疊後對露出部分的解讀還需要練習',
  'area-overlap-method': '可移動的面還不穩定地選擇重疊比較',
  'area-unit-count': '用方格比較面的大小時容易漏數或重複數',
  'capacity-appearance': '容易只看容器高矮判斷容量',
  'capacity-common-unit': '用杯子比容量時需要確認單位相同',
  'capacity-comparison': '容量大小的判斷還需要練習',
  'capacity-cup-count': '相同單位下的杯數與容量大小尚未連結',
  'capacity-meaning': '對容量是容器能裝多少的意義還不穩定',
  'capacity-method': '還需要練習何時用直接倒入比較',
  'centimeter-concept': '對刻度間的 1 公分還需要建立概念',
  'clock-five-count': '分針指向的數字還需要乘以 5',
  'clock-hand': '時針與分針容易混淆',
  'clock-hour': '時針在兩數之間時還需要讀剛經過的小時',
  'clock-minute': '分針位置與分鐘數還未穩定連結',
  'clock-reading': '合併報讀幾時幾分還需要練習',
  'clock-scale': '對鐘面每個大格是 5 分鐘還不穩定',
  'comparison-place': '比較數的大小時需要從高位開始',
  'comparison-symbol': '大於、小於符號的開口方向容易混淆',
  'direct-pour-interpretation': '對倒入後有剩或未滿的結果尚未正確解讀',
  'direct-pour-observation': '直接倒入比較時容易漏看水是否剩下',
  'elapsed-calculation': '經過時間的分鐘數計算還需要檢查',
  'elapsed-meaning': '容易把經過時間與結束時刻混淆',
  'elapsed-model': '尚未穩定使用時間線表示開始與結束',
  'elapsed-strategy': '經過時間的計算還需要分段思考',
  'whole-part-confusion': '容易混淆全體與部分',
  'operation-choice': '還不穩定地選擇加法或減法',
  'unknown-quantity': '需要再確認題目要找的量',
  'keyword-guessing': '會依關鍵字猜運算',
  'inverse-operation': '反向運算選擇還不穩定',
  'verification-equation': '驗算式的全體與部分容易放錯',
  calculation: '計算時還需要慢一點檢查',
  'length-comparison': '對齊起點後的長短判斷還需要練習',
  'length-model': '長度的合成與拿走圖式容易混淆',
  'length-situation': '尚未穩定判斷長度是合起來或拿走',
  'measurement-start': '測量或比較時容易忘記對齊起點',
  'measurement-unit': '測量時尚未穩定使用相同且無縫的單位',
  'measurement-unit-size': '單位大小與測量個數的反向關係還不穩定',
  'money-calculation': '百元、十元與一元的合成計算還需要練習',
  'money-model': '金額與各面額數量容易配錯',
  'money-strategy': '付錢時尚未穩定從大面額開始',
  'money-value': '容易只數張數而忽略錢幣面額',
  'multiple-count': '跳著數固定倍數時容易數錯',
  'multiple-meaning': '尚未穩定理解倍數是幾個相同數相加',
  'multiplication-expression': '從分組寫出乘法算式還需要練習',
  'multiplication-fact': '乘法答案還需要用跳數檢查',
  'multiplication-groups': '組數與每組數容易混淆',
  'multiplication-meaning': '對相同數連加與乘法的連結還不穩定',
  'multiplication-pattern': '每多一組會增加的固定數還需要練習',
  'multiplication-strategy': '尚未穩定用前一個倍數找下一個答案',
  'number-line-direction': '數變大或變小時在數線上的方向容易混淆',
  'number-sequence': '跨過整十或整百的數數還不穩定',
  'place-alignment': '直式計算時個位與十位容易沒有對齊',
  'place-value-calculation': '百、十、一合成數字時還需要檢查',
  'place-value-carry': '個位滿十時還需要練習換成一個十',
  'place-value-meaning': '位值數字代表的單位數尚未穩定',
  'place-value-model': '百、十、一的模型與數字容易對錯',
  'place-value-order': '讀數或拆數時還需要從高位開始',
  'ruler-endpoints': '用尺測量時容易漏看起點或終點',
  'ruler-subtraction': '物品不從 0 開始時還需要用終點減起點',
  'subtraction-regroup': '個位不夠減時還需要練習從十位換一個十',
  'subtraction-tens': '退位後容易忘記十位已經少一',
  'two-step-model': '兩步驟題的數量關係圖尚未穩定',
  'two-step-operation': '兩步驟題每一步的運算選擇容易混淆',
  'two-step-order': '兩步驟題還需要先找出可以先算的量',
};

export function buildParentReport(profile, skillDefinitions) {
  return skillDefinitions.map((definition) => {
    const progress = profile.skills[definition.id] || blankSkill();
    const commonErrorEntry = Object.entries(progress.errorCounts || {})
      .sort((left, right) => right[1] - left[1])[0];
    return {
      skillId: definition.id,
      title: definition.title,
      state: progress.state,
      stateLabel: stateLabels[progress.state] || '正在學習',
      commonError: commonErrorEntry
        ? errorLabels[commonErrorEntry[0]] || '需要再看一次題意'
        : '尚未發現固定迷思',
      recommendation: definition.recommendation,
    };
  });
}
