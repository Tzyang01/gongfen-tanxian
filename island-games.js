import { GAMES, createGame, act, clockText } from './island-games-engine.js?v=20260927-games';
import { GAME_GUIDES } from './game-guides.js?v=20260927-games';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,extra='')=>`<button type="button" data-game-action='${JSON.stringify(action)}' ${extra}>${text}</button>`;
const setButton=(text,key,value,selected=false)=>button(text,{type:'set',key,value},`aria-pressed="${selected}"`);
const dots=(n,icon='●')=>Array.from({length:n},()=>`<span aria-hidden="true">${icon}</span>`).join('');
const numberInput=(value,label='一共有多少？')=>`<label class="play-number">${label}<input data-game-input="answer" inputmode="numeric" type="text" autocomplete="off" value="${esc(value)}" placeholder="填入數字" maxlength="3"></label>`;
const range=(key,value,min,max,label)=>`<label class="play-range">${label}<input type="range" data-game-input="${key}" min="${min}" max="${max}" step="1" value="${value}"></label>`;
function counter(key,index,value,label,disabled=false) {
  return `<div class="play-counter"><span>${label}</span><div>${button('−',{type:'counter',key,index,delta:-1},`aria-label="${label}減一" ${value===0?'disabled':''}`)}<strong>${value}</strong>${button('＋',{type:'counter',key,index,delta:1},`aria-label="${label}加一" ${disabled?'disabled':''}`)}</div></div>`;
}

function prompt(t) {
  switch(t.unit) {
    case 1:return t.round===0?'小舖要開門了。請從小到大，點三張貨號卡。':`小熊買${['故事書','小背包','小花盆'][t.round]}要付 ${t.target} 元。${t.limitHundreds===0?'百元用完了，改用十元和一元！':'點錢幣旁的 ＋，付出剛剛好的錢。'}`;
    case 2:return t.round===2?`比較兩台機器人的能量：${t.a} 和 ${t.b}，哪一邊比較大？`:`機器人原有 ${t.a} 點能量，${t.round===0?'再加上':'用掉'} ${t.b} 點。${t.round===0?'把滿十個的個粒合成十條。':'先拆十，再移走用掉的積木。'}`;
    case 3:return `小熊要一塊 ${t.length} 公分的木板。先把尺的 0 對準木板左邊，再移動剪刀。`;
    case 4:return `原有 ${t.total} ${['顆松果','本書','張車票'][t.round]}，找到 ${t.part} ${['顆','本','張'][t.round]}，還有多少沒找到？找出答案，再選驗算方法。`;
    case 5:return `${t.round===0?'哪個裝得比較多？':t.round===1?'哪個裝得比較少？':'樣子不同，也能裝一樣多嗎？'}用同一個杯子，把甲和乙都倒滿，再比一比。`;
    case 6:return `原有 ${t.start} 位乘客。第一站${t.steps[0]>0?'上車':'下車'} ${Math.abs(t.steps[0])} 位，第二站${t.steps[1]>0?'上車':'下車'} ${Math.abs(t.steps[1])} 位。每站都要確認人數。`;
    case 7:return `每盤放 ${t.each} 片餅乾，一共 ${t.groups} 盤。把每一盤擺好，再算總共幾片。`;
    case 8:return t.round===2?`列車在 ${clockText(t.start)} 出發，坐了 ${t.duration} 分鐘才到站。到站時是幾點幾分？請轉動時鐘。`:`列車要在 ${clockText(t.target)} 出發。請轉動時鐘，準備發車！`;
    case 9:return `每排 ${t.each} 盞燈，已亮 ${t.base} 排，再點亮 ${t.extra} 排。全部有多少盞？`;
    case 10:return '點一下幫左邊的房間鋪地板，再比較左右兩個面的大小。每一塊方格都一樣大。';
  }
}

function clockSvg(minutes) {
  return `<svg viewBox="0 0 260 260" class="play-clock" role="img" aria-label="時鐘 ${clockText(minutes)}"><circle cx="130" cy="130" r="119" fill="#fffdf0" stroke="#355d76" stroke-width="7"/>${Array.from({length:60},(_,i)=>`<line x1="130" y1="${i%5?19:15}" x2="130" y2="${i%5?23:28}" transform="rotate(${i*6} 130 130)" stroke="#82919b" stroke-width="${i%5?1:3}"/>`).join('')}${Array.from({length:12},(_,i)=>{const a=(i+1)*Math.PI/6;return `<text x="${130+89*Math.sin(a)}" y="${137-89*Math.cos(a)}" text-anchor="middle" fill="#18324d" font-size="20" font-weight="800">${i+1}</text>`;}).join('')}<line x1="130" y1="130" x2="130" y2="76" transform="rotate(${minutes*.5} 130 130)" stroke="#cf674f" stroke-width="9" stroke-linecap="round"/><line x1="130" y1="130" x2="130" y2="47" transform="rotate(${minutes*6} 130 130)" stroke="#337f9f" stroke-width="6" stroke-linecap="round"/><circle cx="130" cy="130" r="8" fill="#18324d"/></svg>`;
}

function workshop(t,s) {
  switch(t.unit) {
    case 1: {
      if(t.round===0) return `<div class="play-detective" aria-hidden="true">🐿️ 📦 🧸</div><div class="play-shelf">${[0,1,2].map(i=>`<span>${s.order[i]??'？'}</span>`).join('<b>→</b>')}</div><p>由小到大，把貨號放上架</p><div class="play-choices">${t.numbers.map(value=>button(String(value),{type:'order',value},s.order.includes(value)?'disabled':'')).join('')}</div><div class="play-choices">${button('拿回最後一張',{type:'undo-order'},s.order.length?'':'disabled')}</div>`;
      const total=s.counts.reduce((v,c,i)=>v+c*[100,10,1][i],0);
      return `<div class="play-shop"><span class="play-animal" aria-hidden="true">🐻</span><div class="play-price">今日訂單 <b>${t.target} 元</b></div><span class="play-animal" aria-hidden="true">🛍️</span></div><div class="play-wallet">${[100,10,1].map((value,i)=>`<div class="play-money"><span class="${i===0?'play-note':'play-coin'}">${value} 元</span>${counter('counts',i,s.counts[i],`${value} 元`,i===0&&t.limitHundreds===0)}</div>`).join('')}</div><p class="play-equation">${s.counts[0]*100} ＋ ${s.counts[1]*10} ＋ ${s.counts[2]} ＝ <strong>${total} 元</strong></p>`;
    }
    case 2: {
      if(t.round===2) return `<div class="play-compare"><div>🤖<b>${t.a}</b></div><strong>？</strong><div>🤖<b>${t.b}</b></div></div><div class="play-choices">${['<','=','>'].map(sign=>setButton(esc(sign),'sign',sign,s.sign===sign)).join('')}</div>`;
      return `<div class="play-robot" aria-hidden="true">🤖 <span>${t.a} ${t.round===0?'＋':'－'} ${t.b}</span></div><div class="play-blocks"><section><h3>十條</h3><div class="play-tens">${Array.from({length:s.counts[0]},()=>'<i></i>').join('')}</div>${counter('counts',0,s.counts[0],'十條')}</section><section><h3>個粒</h3><div class="play-ones">${dots(s.counts[1],'■')}</div>${counter('counts',1,s.counts[1],'個粒')}</section></div><div class="play-choices">${button('十個一合成一個十',{type:'exchange',direction:'join'},s.counts[1]<10?'disabled':'')}${button('一個十拆成十個一',{type:'exchange',direction:'split'},s.counts[0]===0?'disabled':'')}</div><p class="play-equation">現在有 ${s.counts[0]} 個十、${s.counts[1]} 個一</p>`;
    }
    case 3:return `<div class="play-measure" role="img" aria-label="木板左端位置 ${t.origin}，尺零點位置 ${s.offset}，切割長度 ${s.cut}"><div class="play-wood" style="left:${t.origin*5}%;width:65%"><span>小熊的木板</span></div><div class="play-cut" style="left:${(t.origin+s.cut)*5}%">✂<span></span></div><div class="play-ruler" style="left:${s.offset*5}%;width:70%">${Array.from({length:15},(_,i)=>`<span>${i}</span>`).join('')}</div></div>${range('offset',s.offset,0,5,`移動尺：目前零刻度在第 ${s.offset} 格`)}${range('cut',s.cut,1,12,`移動切割線：從木板左端數 ${s.cut} 格`)}<p class="play-note-text">畫面使用示意刻度，不代表平板上的實際公分。</p>`;
    case 4:return `<div class="play-detective" aria-hidden="true">🐿️ 🔎 📦</div><div class="play-whole">全部 ${t.total}</div><div class="play-parts"><span>找到 ${t.part}</span><span>還沒找到 ${esc(s.answer)||'？'}</span></div>${numberInput(s.answer,'還有多少沒找到？')}<p>哪種方法可以檢查有沒有回到原來的總數？</p><div class="play-choices">${setButton('找到的 ＋ 沒找到的','verify','add',s.verify==='add')}${setButton('找到的 − 沒找到的','verify','subtract',s.verify==='subtract')}</div>${s.verify==='add'&&s.answer!==''?`<p class="play-equation">${t.part} ＋ ${esc(s.answer)} ＝ ${t.part+Number(s.answer)}</p>`:''}`;
    case 5:return `<div class="play-jugs">${t.capacities.map((capacity,i)=>`<section><h3>${i===0?'甲':'乙'}容器</h3><div class="play-jug" style="--jug-width:${(t.round===2?i===1:capacity>6)?120:72}px;--jug-height:${(t.round===2?i===1:capacity>6)?140:195}px"><div style="height:${s.cups[i]/capacity*100}%"></div></div><p>${s.cups[i]} 杯 ${s.cups[i]===capacity?'· 裝滿了！':''}</p>${button('🥛 倒入一杯',{type:'pour',index:i},s.cups[i]===capacity?'disabled':'')}</section>`).join('')}</div><div class="play-choices">${[0,1].map(i=>setButton(`${i===0?'甲':'乙'}容量較${t.round===1?'小':'大'}`,'choice',i,s.choice===i)).join('')}${setButton('一樣多','choice',2,s.choice===2)}</div><p class="play-note-text">每次都用同一個杯子，裝滿才算容量。</p>`;
    case 6:return `<div class="play-route"><span class="${s.phase===0?'active':''}">① 松果站 ${t.steps[0]>0?'＋':'−'}${Math.abs(t.steps[0])}</span><b>→</b><span class="${s.phase===1?'active':''}">② 花園站 ${t.steps[1]>0?'＋':'−'}${Math.abs(t.steps[1])}</span></div><div class="play-bus"><div class="play-passengers">${dots(s.passengers,'🐰')}</div><p>🚌 車上 <strong>${s.passengers}</strong> 位</p></div><p>現在在第 ${s.phase+1} 站，${t.steps[s.phase]>0?'上車':'下車'} ${Math.abs(t.steps[s.phase])} 位。</p><div class="play-choices">${button('一位上車 ＋1',{type:'bus',delta:1})}${button('一位下車 −1',{type:'bus',delta:-1},s.passengers===0?'disabled':'')}</div>`;
    case 7:return `<div class="play-trays">${s.plates.map((count,i)=>`<section><h3>第 ${i+1} 盤</h3><div class="play-plate">${dots(count,'🍪')}</div>${counter('plates',i,count,`第 ${i+1} 盤餅乾`)}</section>`).join('')}</div><p class="play-equation">每盤 ${t.each} 片 × ${t.groups} 盤 ＝ ？片</p>${numberInput(s.answer,'派對總共準備幾片餅乾？')}`;
    case 8:return `<div class="play-clock-scene">${clockSvg(s.minutes)}<div><span class="play-animal" aria-hidden="true">🚂</span><p class="play-equation">${clockText(s.minutes)}</p><p>短針：幾點<br>長針：幾分</p></div></div>${range('minutes',s.minutes,0,719,'撥動時鐘（可拖曳，也可用下方按鈕微調）')}<div class="play-choices">${[-60,-5,-1,1,5,60].map(d=>button(`${d>0?'＋':'−'}${Math.abs(d)} 分`,{type:'set',key:'minutes',value:(s.minutes+d+720)%720})).join('')}</div>`;
    case 9:return `<div class="play-night"><p>已經亮了 ${t.base} 排：${t.each} × ${t.base} ＝ ${t.each*t.base}</p><div class="play-lights" style="--lights:${t.each}">${Array.from({length:t.base*t.each},()=>'<span class="lit" aria-hidden="true">✦</span>').join('')}${s.lights.map((lit,i)=>button(lit?'✦':'＋',{type:'light',index:i},`class="${lit?'lit':''}" aria-label="新增第 ${Math.floor(i/t.each)+1} 排第 ${i%t.each+1} 盞燈" aria-pressed="${lit}"`)).join('')}</div><p>再增加 ${t.extra} 排，組成完整燈光秀。</p></div>${numberInput(s.answer,'現在一共有幾盞燈？')}`;
    case 10:return `<div class="play-rooms"><section><h3>🐰 左邊的新家</h3><div class="play-floor">${Array.from({length:15},(_,i)=>t.shape.includes(i)?button(s.tiles.includes(i)?'🌼':'＋',{type:'tile',index:i},`class="floor-cell ${s.tiles.includes(i)?'tiled':''}" aria-label="第 ${i+1} 格地板" aria-pressed="${s.tiles.includes(i)}"`):'<span></span>').join('')}</div><p>已鋪 ${s.tiles.length} 格</p></section><section><h3>🐻 右邊的新家</h3><div class="play-floor">${Array.from({length:t.other},()=>'<span class="floor-cell tiled" aria-hidden="true">🌿</span>').join('')}</div><p>已鋪 ${t.other} 格</p></section></div><div class="play-choices">${[['left','左邊比較大'],['same','一樣大'],['right','右邊比較大']].map(([value,label])=>setButton(label,'choice',value,s.choice===value)).join('')}</div>`;
  }
}

export function mountIslandGames({show,profileId,speak,openUnit}) {
  const root=document.querySelector('#game-view');
  let game=null, owner=null, saved=false, storageWarning='';
  function readBook() {
    try {
      const data=JSON.parse(localStorage.getItem(`math-island-games-v1:${profileId()}`)||'{}');
      return data && typeof data==='object' && !Array.isArray(data)?data:{};
    } catch {return {};}
  }
  function renderMap() {
    const book=readBook();
    document.querySelector('#playground-count').textContent=`${GAMES.filter(g=>book[g.unit]?.completed).length} / 10 個地方完成探險`;
    document.querySelector('#playground-grid').innerHTML=GAMES.map(g=>`<button class="play-island ${book[g.unit]?.completed?'restored':''}" style="--game-color:${g.color}" data-open-game="${g.unit}"><span class="play-island-number">${String(g.unit).padStart(2,'0')}</span><span class="play-island-icon" aria-hidden="true">${g.icon}</span><strong>${g.title}</strong><span>${g.description}</span><small>${book[g.unit]?.completed?'🌼 已完成 · 再玩一次':'3 個任務 · 隨時可以玩'} →</small></button>`).join('');
  }
  function save() {
    if(saved || !game.finished || owner!==profileId()) return;
    const book=readBook(), previous=book[game.unit];
    const independent=game.results.filter(r=>r.independent).length;
    book[game.unit]={completed:true,plays:(Number(previous?.plays)||0)+1,bestIndependent:Math.max(Number(previous?.bestIndependent)||0,independent),lastIndependent:independent,lastSeed:game.seed};
    try {localStorage.setItem(`math-island-games-v1:${owner}`,JSON.stringify(book));saved=true;}
    catch {storageWarning='這個瀏覽器目前無法保存進度；你還是可以繼續玩。';}
  }
  function render() {
    if(!game) return;
    const def=GAMES[game.unit-1],t=game.tasks[game.round];
    root.style.setProperty('--game-color',def.color);
    if(game.finished) {
      save();
      const independent=game.results.filter(r=>r.independent).length;
      root.innerHTML=`<div class="play-top">${button('← 回遊戲樂園',{type:'home'})}<span>探險完成</span></div><div class="play-finish"><div class="play-restored-scene" aria-hidden="true">🌳 ${def.icon} 🌼 🐰 🌷</div><p class="eyebrow">你的努力，讓小島更熱鬧了</p><h1 tabindex="-1">${def.reward}</h1><p>三個任務都完成了！${independent===3?'這次三關都自己完成，真是細心的探險家。':'有時自己想，有時跟著提示，你都願意試到完成。'}</p><div class="play-keepsake"><span>${def.icon}</span><strong>${def.title}紀念章</strong><p>已收進這位學習者的探險紀錄</p></div><p>${esc(storageWarning)}</p><div class="play-choices">${button('再玩一輪新任務',{type:'replay'})}${button('回遊戲樂園',{type:'home'})}${button('看看這個單元的課程',{type:'course'})}</div></div>`;
      if(!saved) root.querySelector('.play-keepsake p').textContent='這次探險已完成';
      return;
    }
    root.innerHTML=`<div class="play-top">${button('← 回遊戲樂園',{type:'home'})}<span>第 ${game.unit} 單元 · 任務 ${game.round+1} / 3</span>${button('🔊 聽任務',{type:'listen'})}</div><header class="play-heading"><div class="play-title-icon" aria-hidden="true">${def.icon}</div><div><p class="eyebrow">動手玩，也動腦想</p><h1 tabindex="-1">${def.title}</h1></div><div class="play-steps" aria-label="已完成 ${game.results.length} 關">${[0,1,2].map(i=>`<span class="${i<game.results.length?'done':i===game.round?'current':''}">${i<game.results.length?'✓':i+1}</span>`).join('')}</div></header><section class="play-mission"><span aria-hidden="true">🐿️</span><p id="play-prompt">${prompt(t)}</p></section><section class="play-workshop" aria-label="互動操作區"><fieldset ${game.solved?'disabled':''}><legend class="sr-only">動手完成任務</legend>${workshop(t,game.state)}</fieldset></section><div class="play-feedback ${game.success?'success':''}" role="status" aria-live="polite">${esc(game.feedback)||'慢慢試，這裡不計時。完成操作後，請松果老師看一看。'}</div><div class="play-footer">${game.solved?button(game.round===2?'看看小島的新變化 ✨':'下一個任務 →',{type:'next'},'class="play-primary"'):button(t.unit===6?'這一站好了，檢查人數':'完成了，幫我看一看',{type:'check'},'class="play-primary"')}${!game.solved?button('💡 給我一點提示',{type:'hint'}):''}</div>`;
    addGuide();
  }
  function open(unit) {
    owner=profileId();saved=false;storageWarning='';
    const previous=readBook()[unit];
    const seed=Number.isInteger(previous?.lastSeed)?(previous.lastSeed+1)%7:Math.floor(Math.random()*7);
    game=createGame(unit,seed);show('game');render();root.querySelector('h1').focus({preventScroll:true});
  }
  function addGuide() {
    if(game.finished || game.solved) return;
    const guide=GAME_GUIDES[game.unit-1];
    const content=game.demoStage<0?button('👋 先看怎麼玩',{type:'demo'}):`<aside class="play-guide" aria-label="玩法示範"><div><strong>松果老師做一次</strong>${button('🔊 聽玩法',{type:'guide-listen'})}${button('收起來',{type:'close-demo'})}</div><p class="play-demo-example" role="status">${esc(game.demoStage===0?guide.before:guide.after)}</p><p>${game.demoStage===0?'先看看這個小例子。':esc(guide.why)}</p>${button(game.demoStage===0?guide.action:'再看一次',{type:'demo'})}<ol>${guide.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></aside>`;
    root.querySelector('.play-mission').insertAdjacentHTML('afterend',`<div class="play-guide-entry">${content}</div>`);
  }
  root.addEventListener('click',e=>{
    const target=e.target.closest('[data-game-action]');if(!target) return;
    const a=JSON.parse(target.dataset.gameAction);
    if(a.type==='home') {speak('');renderMap();show('home');document.querySelector('#playground').scrollIntoView({behavior:'smooth'});return;}
    if(a.type==='course') {openUnit(game.unit-1);return;}
    if(a.type==='replay') {open(game.unit);return;}
    if(a.type==='listen') {speak(prompt(game.tasks[game.round]));return;}
    if(a.type==='guide-listen') {const guide=GAME_GUIDES[game.unit-1];speak(`${guide.steps.join('。')}。${guide.why}`);return;}
    const focusAction=target.getAttribute('data-game-action');
    game=act(game,a);render();
    if(a.type==='hint') speak(game.feedback);
    if(a.type==='next') root.querySelector('h1').focus({preventScroll:true});
    else [...root.querySelectorAll('[data-game-action]')].find(b=>b.getAttribute('data-game-action')===focusAction&&!b.disabled)?.focus({preventScroll:true});
  });
  root.addEventListener('input',e=>{
    const input=e.target.closest('[data-game-input]');if(!input) return;
    const key=input.dataset.gameInput;
    if(key==='answer') {
      input.value=input.value.normalize('NFKC').replace(/[^0-9]/g,'');game=act(game,{type:'set',key,value:input.value});return;
    }
    // Keep the actual range control in place during a finger drag.
    game=act(game,{type:'set',key,value:Number(input.value)});
    const t=game.tasks[game.round],s=game.state;
    if(key==='offset') root.querySelector('.play-ruler').style.left=`${s.offset*5}%`;
    if(key==='cut') root.querySelector('.play-cut').style.left=`${(t.origin+s.cut)*5}%`;
    if(key==='minutes') {
      root.querySelector('.play-clock').outerHTML=clockSvg(s.minutes);
      root.querySelector('.play-clock-scene .play-equation').textContent=clockText(s.minutes);
    }
  });
  root.addEventListener('change',e=>{if(e.target.matches('input[type="range"]')) {const key=e.target.dataset.gameInput;render();root.querySelector(`[data-game-input="${key}"]`)?.focus({preventScroll:true});}});
  root.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-game-input="answer"]')) {game=act(game,{type:'check'});render();}});
  document.querySelector('#playground-grid').addEventListener('click',e=>{const b=e.target.closest('[data-open-game]');if(b)open(Number(b.dataset.openGame));});
  function reportHTML() {
    const book=readBook();
    return `<details class="parent-report-unit" open><summary><strong>遊戲樂園的探險紀錄</strong></summary><div><p>紀念章表示完成遊戲；獨立完成關數不等同課程精熟。紀錄保存在這個瀏覽器。</p>${GAMES.filter(g=>book[g.unit]?.completed).map(g=>`<article><strong>${g.icon} ${g.title}</strong><p>最近一輪：${Number(book[g.unit].lastIndependent)||0} / 3 關未使用提示、一次完成。</p></article>`).join('')||'<p>還沒有完成的遊戲，可以先選孩子喜歡的地方。</p>'}</div></details>`;
  }
  return {renderMap,open,reportHTML};
}
