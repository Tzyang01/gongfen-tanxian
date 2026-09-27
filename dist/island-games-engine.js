// Pure learning rules: UI effects and storage cannot award a completed task.
export const GAMES = [
  ['森林小店長','🛒','排好貨號，付剛剛好的錢','小舖開張了','#d56946'],
  ['積木機器人工廠','🤖','積木拆一拆、合一合，一起算','機器人動起來了','#447aac'],
  ['小小木工師傅','🪚','尺的 0 對好，再切木板','小橋搭好了','#a67632'],
  ['失物偵探社','🔎','找出少了多少，再檢查一次','偵探社開張了','#765aaa'],
  ['森林澆水隊','🌱','倒倒水，看看哪個裝得多','花園開花了','#318a75'],
  ['動物巴士出發','🚌','先算第一站，再算第二站','巴士到站了','#b67729'],
  ['點心派對廚房','🍪','每盤放一樣多，一起數餅乾','派對開始了','#b75f7c'],
  ['星光列車長','🚂','轉轉時鐘，讓列車準時出發','星光列車出發了','#546aad'],
  ['螢火蟲燈光秀','✨','一排排點燈，用乘法來算','燈光秀亮起來了','#527e53'],
  ['動物新家鋪地板','🏡','鋪小方格，比比房間的大小','動物搬進新家了','#b66744'],
].map(([title,icon,description,reward,color],i)=>({unit:i+1,title,icon,description,reward,color}));

export function createTask(unit, round, seed=0) {
  const n=Math.abs(Math.trunc(seed))%7;
  const t={unit,round};
  switch(unit) {
    case 1: {
      const base=[98,108,118,128,138,188,198][n];
      const order=[[1,0,2],[2,1,0],[0,2,1]][n%3];
      return {...t,numbers:order.map(i=>base+i),target:100+(n+2)*10+round+1,limitHundreds:round===2?0:2};
    }
    case 2: {
      const a=round===0?27+n%3:62+n%5,b=round===0?15+n%2:28;
      return {...t,a:round===2?43+n:a,b:round===2?48-n:b,target:round===0?a+b:a-b};
    }
    case 3: return {...t,length:4+n%4+round,origin:2+round};
    case 4: return {...t,total:45+n*2+round*7,part:17+n+round*2};
    case 5: return {...t,capacities:round===2?[5+n%3,5+n%3]:round===1?[4+n%3,7+n%3]:[7+n%3,4+n%3]};
    case 6: return {...t,start:18+n,steps:round===0?[6,4]:round===1?[-5,-3]:[7,-4]};
    case 7: return {...t,each:[2,5,4][round],groups:3+n%3};
    case 8: return {...t,start:420+n*5,target:round===0?420+n*5:round===1?540+n*5:440+n*5,duration:20};
    case 9: return {...t,each:[3,6,7][round],base:3+n%2,extra:round===0?1:2};
    case 10: {
      const width=3+n%2;
      const shape=Array.from({length:width*2+round},(_,i)=>i<width*2?Math.floor(i/width)*5+i%width:10+i-width*2);
      return {...t,shape,other:shape.length+[2,-1,0][round]};
    }
    default: throw new RangeError('Unknown game unit');
  }
}

export function initialState(t) {
  switch(t.unit) {
    case 1:return {counts:[0,0,0],order:[]};
    case 2:return {counts:t.round===0?[Math.floor(t.a/10)+Math.floor(t.b/10),t.a%10+t.b%10]:[Math.floor(t.a/10),t.a%10],sign:'',exchanged:false};
    case 3:return {offset:0,cut:1};
    case 4:return {answer:'',verify:''};
    case 5:return {cups:[0,0],choice:null};
    case 6:return {phase:0,passengers:t.start};
    case 7:return {plates:Array(t.groups).fill(0),answer:''};
    case 8:return {minutes:0};
    case 9:return {lights:Array(t.extra*t.each).fill(false),answer:''};
    case 10:return {tiles:[],choice:''};
  }
}

const result=(ok,hint,explain)=>({ok,hint,explain});
export function assess(t,s) {
  switch(t.unit) {
    case 1: {
      if(t.round===0) {
        const sorted=[...t.numbers].sort((a,b)=>a-b);
        return result(s.order.length===3&&s.order.every((v,i)=>v===sorted[i]),'先找最小的貨號，再往後數；個位的 9 再多一，十位會改變。',`${sorted.join(' → ')}，貨號排好了！數數時留意百、十、一的變化。`);
      }
      const total=s.counts.reduce((sum,c,i)=>sum+c*[100,10,1][i],0);
      return result(total===t.target && s.counts[0]<=t.limitHundreds,
        s.counts[0]>t.limitHundreds?'這次百元用完了，試試看十元和一元。':`現在是 ${total} 元，${total<t.target?`還差 ${t.target-total}`:`多了 ${total-t.target}`} 元。先看看十元和一元。`,
        `${s.counts[0]} 個百、${s.counts[1]} 個十、${s.counts[2]} 個一，合起來 ${t.target} 元。不同付法也能一樣多！`);
    }
    case 2: {
      if(t.round===2) return result(s.sign===(t.a>t.b?'>':t.a<t.b?'<':'='),'先比較十位；十位相同，再看個位。',`${t.a} ${s.sign} ${t.b}，比較時先看十位，再看個位。`);
      return result(s.counts[0]*10+s.counts[1]===t.target && s.counts[1]<10 && s.exchanged===true,
        s.counts[1]>=10?'個粒滿十個了，按「十個一合成一個十」。':t.round===0?'先把兩堆積木合起來，再把十個一換成一個十。':'不夠拿走時，先把一個十拆成十個一，再移走需要的數量。',
        `${t.a}${t.round===0?'＋':'－'}${t.b}＝${t.target}。一個十和十個一的數量相同。`);
    }
    case 3:return result(s.offset===t.origin && s.cut===t.length,s.offset!==t.origin?'先把尺的 0 對準木板左端。':'數的是兩端之間的格子；調整切割線，做出指定的長度。',`零刻度對準起點，${t.length} 個 1 公分就是 ${t.length} 公分。`);
    case 4:return result(s.answer!=='' && Number(s.answer)===t.total-t.part && s.verify==='add',Number(s.answer)!==t.total-t.part?'全部減去已找到的，就是還沒找到的。':'再選一種方法，把兩部分合起來檢查總數。',`${t.total}－${t.part}＝${t.total-t.part}；${t.part}＋${t.total-t.part}＝${t.total}，找回的數量正確！`);
    case 5: {
      const answer=t.capacities[0]===t.capacities[1]?2:t.round===1?(t.capacities[0]<t.capacities[1]?0:1):(t.capacities[0]>t.capacities[1]?0:1);
      return result(s.cups.every((v,i)=>v===t.capacities[i]) && s.choice===answer,s.cups.some((v,i)=>v<t.capacities[i])?'先用同一個小杯子，把兩個容器都倒滿。':'杯子大小相同，裝滿時用的杯數多就裝得多，杯數一樣就裝得一樣多。',`甲裝 ${t.capacities[0]} 杯，乙裝 ${t.capacities[1]} 杯。比較容量不能只看高矮。`);
    }
    case 6: {
      const expected=t.start+t.steps[0]+(s.phase?t.steps[1]:0);
      return result(s.passengers===expected,'上車要增加，下車要減少；從這一站開始的人數接著算。',s.phase?`先 ${t.start} → ${t.start+t.steps[0]}，再 → ${expected}，兩次變化都記住了！`:`第一站有 ${expected} 位乘客，帶著這個人數前往第二站。`);
    }
    case 7:return result(s.plates.length===t.groups && s.plates.every(v=>v===t.each) && s.answer!=='' && Number(s.answer)===t.each*t.groups,s.plates.some(v=>v!==t.each)?`每盤都要 ${t.each} 片，一共 ${t.groups} 盤。看看哪盤需要調整。`:`可以每次加 ${t.each}，數 ${t.groups} 次。`,`${t.each} 片一盤 × ${t.groups} 盤＝${t.each*t.groups} 片，乘法表示幾個一樣多。`);
    case 8:return result(s.minutes===t.target,'長針看分鐘，短針看幾點；長針走一大格是五分鐘。',t.round===2?`${clockText(t.start)} 再過 ${t.duration} 分鐘，是 ${clockText(t.target)}。`:`${clockText(t.target)}，時針也會隨著分針慢慢移動。`);
    case 9:return result(s.lights.length===t.extra*t.each && s.lights.every(Boolean) && s.answer!=='' && Number(s.answer)===(t.base+t.extra)*t.each,'先點亮空缺的燈，再把原有的幾組和新增的幾組合起來。',`${t.each}×${t.base+t.extra}＝${t.each*t.base}＋${t.each*t.extra}＝${t.each*(t.base+t.extra)}。已知的幾組可以幫忙算！`);
    case 10:return result(s.tiles.length===t.shape.length && t.shape.every(v=>s.tiles.includes(v)) && s.choice===(t.shape.length>t.other?'left':t.shape.length<t.other?'right':'same'),'把左邊的房間完整鋪滿，不重疊、不留洞；再數兩邊一樣大的方格。',`左邊 ${t.shape.length} 格，右邊 ${t.other} 格。單位相同，才能公平比較面的大小。`);
  }
}

export function clockText(minutes) {return `${Math.floor(minutes/60)%12||12} 點 ${minutes%60} 分`;}
export function createGame(unit,seed=0) {
  const tasks=[0,1,2].map(r=>createTask(unit,r,seed));
  return {unit,seed,tasks,round:0,state:initialState(tasks[0]),results:[],solved:false,finished:false,assisted:false,demoStage:-1,feedback:'',success:false};
}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function act(game,a) {
  if(game.finished) return game;
  const g=structuredClone(game), t=g.tasks[g.round], s=g.state;
  if(a.type==='next') {
    if(!g.solved) return game;
    if(g.round===2) return {...g,finished:true};
    g.round++;g.state=initialState(g.tasks[g.round]);g.solved=false;g.assisted=false;g.demoStage=-1;g.feedback='';g.success=false;return g;
  }
  if(g.solved) return game;
  if(a.type==='demo') {g.assisted=true;g.demoStage=g.demoStage===0?1:0;return g;}
  if(a.type==='close-demo') {g.demoStage=-1;return g;}
  if(a.type==='hint') {g.assisted=true;g.feedback=assess(t,s).hint;g.success=false;return g;}
  if(a.type==='check') {
    const r=assess(t,s);g.success=r.ok;g.feedback=r.ok?r.explain:r.hint;
    if(!r.ok) {g.assisted=true;return g;}
    if(t.unit===6 && s.phase===0) {s.phase=1;return g;}
    g.solved=true;g.results.push({round:g.round,independent:!g.assisted});return g;
  }
  g.feedback='';g.success=false;
  if(a.type==='set' && ['offset','cut','answer','minutes','verify','choice','sign','passengers'].includes(a.key)) {
    s[a.key]=a.value;
  }
  if(a.type==='counter' && ['counts','plates'].includes(a.key) && Number.isInteger(a.index) && a.index>=0 && a.index<s[a.key]?.length) {
    s[a.key][a.index]=clamp(s[a.key][a.index]+a.delta,0,a.key==='plates'?9:25);
  }
  if(a.type==='exchange' && t.unit===2) {
    if(a.direction==='join' && s.counts[1]>=10) {s.counts[0]++;s.counts[1]-=10;s.exchanged=true;}
    if(a.direction==='split' && s.counts[0]>0) {s.counts[0]--;s.counts[1]+=10;s.exchanged=true;}
  }
  if(a.type==='pour' && t.unit===5 && [0,1].includes(a.index)) s.cups[a.index]=Math.min(t.capacities[a.index],s.cups[a.index]+1);
  if(a.type==='bus' && t.unit===6) s.passengers=clamp(s.passengers+a.delta,0,60);
  if(a.type==='order' && t.unit===1 && t.round===0 && t.numbers.includes(a.value) && !s.order.includes(a.value)) s.order.push(a.value);
  if(a.type==='undo-order' && t.unit===1 && t.round===0) s.order.pop();
  if(a.type==='light' && t.unit===9 && a.index>=0 && a.index<s.lights.length) s.lights[a.index]=!s.lights[a.index];
  if(a.type==='tile' && t.unit===10 && t.shape.includes(a.index)) s.tiles=s.tiles.includes(a.index)?s.tiles.filter(v=>v!==a.index):[...s.tiles,a.index];
  return g;
}
