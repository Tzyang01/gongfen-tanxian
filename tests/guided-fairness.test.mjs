import test from 'node:test';
import assert from 'node:assert/strict';
import {ADAPTIVE_COURSE} from '../dist/adaptive-course-data.js';
import * as engine from '../dist/adaptive-engine.js';

test('所有引導能力都無法一律選第一個完成任何一道題目',()=>{
  for(const unit of ADAPTIVE_COURSE.units)for(const skill of unit.skills)for(let qi=0;qi<skill.questions.length;qi++) {
    const q=skill.questions[qi];
    const steps=q.steps.map((_,i)=>engine.currentGuidedStep({questionIndex:qi,stepIndex:i},skill.questions)).filter(s=>s.kind==='choice');
    assert.ok(steps.some(s=>String(s.options[0])!==String(s.answer)),`${q.id} 全是第一個`);
    for(const s of steps)assert.equal(s.options.filter(x=>String(x)===String(s.answer)).length,1);
  }
});

test('引導題答錯重試，選項不會跳位置，也不改動原題庫',()=>{
  const skill=ADAPTIVE_COURSE.units[0].skills[0], before=JSON.stringify(skill.questions);
  const s={questionIndex:0,stepIndex:1};
  assert.deepEqual(engine.currentGuidedStep(s,skill.questions),engine.currentGuidedStep({...s,hintLevel:2},skill.questions));
  assert.equal(JSON.stringify(skill.questions),before);
});

test('圖示步驟答對之前，不直接把正確模型印在畫面上',()=>{
  assert.equal(typeof engine.completedGuidedModel,'function');
  const skill=ADAPTIVE_COURSE.units[0].skills[0];
  assert.equal(engine.completedGuidedModel({questionIndex:0,stepIndex:2},skill.questions),null);
  assert.equal(engine.completedGuidedModel({questionIndex:0,stepIndex:3},skill.questions),skill.questions[0].steps[2].answer);
});
