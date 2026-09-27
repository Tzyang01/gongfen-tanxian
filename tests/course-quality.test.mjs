import test from 'node:test';
import assert from 'node:assert/strict';
import { SEMESTER_COURSE } from '../dist/course-data.js';
import { buildPracticeSet } from '../dist/semester-engine.js';
import * as engine from '../dist/semester-engine.js';

test('測量差值題提供兩段實際可見的長度',()=>{
  const unit=SEMESTER_COURSE.units[2];
  for(const lesson of unit.lessons.filter(l=>l.visual.type==='ruler'&&l.kind==='lesson')) {
    const questions=buildPracticeSet(lesson,unit.lessons);
    const difference=questions.find(q=>q.level==='填空'&&q.visual?.type==='ruler-pair');
    assert.ok(difference,`${lesson.title} 缺少兩段測量圖`);
    const lengths=difference.visual.rulers.map(r=>Math.abs(r.end-r.start));
    assert.equal(difference.answer,Math.abs(lengths[0]-lengths[1]));
  }
});

test('個別單位題畫出同長度的不同單位，不混用公分尺',()=>{
  const lesson=SEMESTER_COURSE.units[2].lessons.find(l=>l.visual.type==='units');
  const visualQuestions=buildPracticeSet(lesson).filter(q=>q.visual);
  assert.ok(visualQuestions.length>=4);
  assert.ok(visualQuestions.every(q=>q.visual.type==='unit-strips'));
});

test('兩步驟練習提供兩次變化，圖中不預填待答的中間及最後答案',()=>{
  for(const lesson of SEMESTER_COURSE.units[5].lessons.filter(l=>l.kind==='lesson')) {
    const questions=buildPracticeSet(lesson).filter(q=>q.visual);
    for(const q of questions) {
      assert.equal(q.visual.type,'journey');
      assert.deepEqual(q.visual.steps,lesson.visual.steps);
      assert.equal(q.visual.start,lesson.visual.start);
      assert.equal(q.visual.trail,undefined);
    }
  }
});

test('位值與包含幾個十的敘述清楚區分',()=>{
  const q=SEMESTER_COURSE.units[0].lessons.at(-1).question;
  assert.ok(q.prompt.includes('十位'));
  assert.equal(q.answer,7);
});

test('面的直接比較以完全蓋住為條件，不能只看某一邊露出',()=>{
  const lesson=SEMESTER_COURSE.units[9].lessons[0];
  assert.ok(lesson.remember.includes('完全蓋住'));
  assert.ok(lesson.question.prompt.includes('完全蓋住'));
});

test('一般練習先給方法提示，再提供完整解答',()=>{
  assert.equal(typeof engine.practiceHint,'function');
  const lesson=SEMESTER_COURSE.units[1].lessons[0];
  const q=buildPracticeSet(lesson)[0];
  assert.equal(q.concept,'arithmetic');
  assert.notEqual(engine.practiceHint(q,1),q.explain);
  assert.notEqual(engine.practiceHint(q,1),engine.practiceHint(q,2));
  assert.equal(engine.practiceHint(q,3),q.explain);
});
