import test from 'node:test';
import assert from 'node:assert/strict';

const engine = await import('../dist/island-games-engine.js').catch(() => ({}));
test('十個單元都有可操作的三關遊戲', () => {
  assert.equal(typeof engine.createGame, 'function', '缺少互動遊戲引擎');
  assert.equal(engine.GAMES.length, 10);
  for (let unit = 1; unit <= 10; unit++) {
    const game = engine.createGame(unit, 3);
    assert.equal(game.tasks.length, 3);
    assert.equal(engine.act(game, {type:'check'}).solved, false, `單元 ${unit} 不可空白過關`);
  }
});

test('正確操作可以通過十種遊戲；不同種子改變任務', () => {
  assert.equal(typeof engine.createGame, 'function');
  for (let unit = 1; unit <= 10; unit++) {
    const game = engine.createGame(unit, 2);
    const variants=new Set(Array.from({length:7},(_,seed)=>JSON.stringify(engine.createGame(unit,seed).tasks)));
    assert.ok(variants.size>1,`單元 ${unit} 要有不同任務`);
    for (const task of game.tasks) {
      const state = solution(task);
      assert.equal(engine.assess(task, state).ok, true, `單元 ${unit} 關卡 ${task.round}`);
    }
  }
});

function solution(t) {
  switch(t.unit) {
    case 1: return t.round===0?{order:[...t.numbers].sort((a,b)=>a-b)}:{counts:t.limitHundreds===0?[0,Math.floor(t.target/10),t.target%10]:[Math.floor(t.target/100),Math.floor(t.target%100/10),t.target%10]};
    case 2: return t.round===2 ? {sign:t.a>t.b?'>':t.a<t.b?'<':'='} : {counts:[Math.floor(t.target/10),t.target%10],exchanged:true};
    case 3: return {offset:t.origin,cut:t.length};
    case 4: return {answer:t.total-t.part,verify:'add'};
    case 5: return {cups:[...t.capacities],choice:t.capacities[0]===t.capacities[1]?2:t.round===1?(t.capacities[0]<t.capacities[1]?0:1):(t.capacities[0]>t.capacities[1]?0:1)};
    case 6: return {phase:1,passengers:t.start+t.steps[0]+t.steps[1]};
    case 7: return {plates:Array(t.groups).fill(t.each),answer:t.groups*t.each};
    case 8: return {minutes:t.target};
    case 9: return {lights:Array(t.extra*t.each).fill(true),answer:(t.base+t.extra)*t.each};
    case 10: return {tiles:[...t.shape],choice:t.shape.length>t.other?'left':t.shape.length<t.other?'right':'same'};
  }
}

test('正確總數仍必須完成教學操作', () => {
  assert.equal(typeof engine.createGame, 'function');
  for (const [unit,patch] of [[3,{offset:0}],[4,{verify:''}],[5,{cups:[0,0]}],[7,{plates:[]}],[9,{lights:[]}],[10,{tiles:[]}]]) {
    const t=engine.createGame(unit,2).tasks[0];
    assert.equal(engine.assess(t,{...solution(t),...patch}).ok,false);
  }
  const t=engine.createGame(2,0).tasks[0];
  assert.equal(engine.assess(t,{counts:[Math.floor(t.target/10)-1,t.target%10+10]}).ok,false);
});

test('公車每站承接上一站；提示或答錯不記成獨立完成', () => {
  assert.equal(typeof engine.createGame, 'function');
  let g=engine.createGame(6,2), t=g.tasks[0];
  g=engine.act(g,{type:'hint'});
  g=engine.act(g,{type:'set',key:'passengers',value:t.start+t.steps[0]});
  g=engine.act(g,{type:'check'});
  assert.equal(g.state.phase,1);
  assert.equal(g.solved,false);
  assert.equal(g.state.passengers,t.start+t.steps[0]);
  g=engine.act(g,{type:'set',key:'passengers',value:t.start+t.steps[0]+t.steps[1]});
  g=engine.act(g,{type:'check'});
  assert.equal(g.solved,true);
  assert.equal(g.results[0].independent,false);
  assert.equal(engine.act(g,{type:'check'}).results.length,1);
});

test('未過關不能跳關、三關結束且紀錄互不污染', () => {
  assert.equal(typeof engine.createGame, 'function');
  let g=engine.createGame(1,0);
  assert.equal(engine.act(g,{type:'next'}).round,0);
  for(let i=0;i<3;i++) {
    const t=g.tasks[g.round];
    g={...g,state:solution(t)};
    g=engine.act(g,{type:'check'});
    assert.equal(g.results.length,i+1);
    g=engine.act(g,{type:'next'});
  }
  assert.equal(g.finished,true);
  assert.equal(g.results.every(r=>r.independent),true);
  assert.equal(engine.createGame(1,0).results.length,0);
});

test('換十與倒水守住數量邊界', () => {
  assert.equal(typeof engine.createGame, 'function');
  let g=engine.createGame(2,0);
  const before=g.state.counts[0]*10+g.state.counts[1];
  g=engine.act(g,{type:'exchange',direction:'join'});
  assert.equal(g.state.counts[0]*10+g.state.counts[1],before);
  g=engine.act(g,{type:'exchange',direction:'split'});
  assert.equal(g.state.counts[0]*10+g.state.counts[1],before);
  let water=engine.createGame(5,0);
  for(let i=0;i<30;i++) water=engine.act(water,{type:'pour',index:0});
  assert.equal(water.state.cups[0],water.tasks[0].capacities[0]);
});

test('機器人工廠必須親手做過合十或拆十，不能只調整答案數字', () => {
  const t=engine.createGame(2,0).tasks[0];
  assert.equal(engine.assess(t,{counts:[Math.floor(t.target/10),t.target%10],exchanged:false}).ok,false);
  let g=engine.createGame(2,0);
  g=engine.act(g,{type:'exchange',direction:'join'});
  assert.equal(engine.act(g,{type:'check'}).solved,true);
});

test('所有題目種子的三關都有合法解，而且起始狀態不能直接過關', () => {
  for(let seed=0;seed<7;seed++) for(let unit=1;unit<=10;unit++) {
    for(const t of engine.createGame(unit,seed).tasks) {
      assert.equal(engine.assess(t,engine.initialState(t)).ok,false,`${unit}/${t.round}/${seed} 空白`);
      assert.equal(engine.assess(t,solution(t)).ok,true,`${unit}/${t.round}/${seed} 正解`);
    }
  }
});

test('小店長第一關整理貨號，不能把同一張卡片重複放入', () => {
  const g=engine.createGame(1,0),t=g.tasks[0];
  assert.equal(t.numbers.length,3);
  let next=engine.act(g,{type:'order',value:t.numbers[0]});
  next=engine.act(next,{type:'order',value:t.numbers[0]});
  assert.equal(next.state.order.length,1);
  assert.equal(engine.act(next,{type:'check'}).solved,false);
});

test('容量遊戲依序比較較大、較小與形狀不同但容量相同', () => {
  const tasks=engine.createGame(5,2).tasks;
  assert.equal(tasks[2].capacities[0],tasks[2].capacities[1]);
  assert.equal(engine.assess(tasks[1],{cups:[...tasks[1].capacities],choice:0}).ok,true);
  assert.equal(engine.assess(tasks[2],{cups:[...tasks[2].capacities],choice:2}).ok,true);
});

test('看操作示範不改孩子的作答，並記為有協助的練習',()=>{
  const g=engine.createGame(7,2);
  const next=engine.act(g,{type:'demo'});
  assert.deepEqual(next.state,g.state);
  assert.equal(next.assisted,true);
  assert.equal(next.demoStage,0);
  assert.equal(engine.act(next,{type:'demo'}).demoStage,1);
  assert.equal(engine.act(next,{type:'close-demo'}).demoStage,-1);
  assert.equal(next.solved,false);
});
