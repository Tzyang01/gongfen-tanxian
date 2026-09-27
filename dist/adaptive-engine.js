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
  return questions[session.questionIndex]?.steps?.[session.stepIndex] ?? null;
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
  'whole-part-confusion': '容易混淆全體與部分',
  'operation-choice': '還不穩定地選擇加法或減法',
  'unknown-quantity': '需要再確認題目要找的量',
  'keyword-guessing': '會依關鍵字猜運算',
  'inverse-operation': '反向運算選擇還不穩定',
  'verification-equation': '驗算式的全體與部分容易放錯',
  calculation: '計算時還需要慢一點檢查',
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
