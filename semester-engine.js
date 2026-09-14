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
