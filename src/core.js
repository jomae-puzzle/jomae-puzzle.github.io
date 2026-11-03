/* 今日の錠前 共通ロジック（ブラウザとNodeの両方で使う） */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.JomaeCore=factory();})(typeof self!=='undefined'?self:this,function(){
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const P=[];for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<10;c++)for(let d=0;d<10;d++){if(new Set([a,b,c,d]).size===4)P.push([a,b,c,d])}
function sc(g,s){let h=0,b=0;for(let i=0;i<4;i++){if(g[i]===s[i])h++;else if(s.includes(g[i]))b++}return[h,b]}
function count(cl){let n=0;for(const p of P){if(cl.every(c=>{const r=sc(c.g,p);return r[0]===c.h&&r[1]===c.b})){if(++n>1)return n}}return n}
// 直接推論だけのソルバー（仮定・背理法なし）
function solveDirect(cl){
  const st=Array(10).fill(0); // 1 in, -1 out
  const cd=[0,1,2,3].map(()=>Array(10).fill(true));
  let ch=true,steps=0;
  const out=n=>{if(st[n]!==-1){st[n]=-1;for(let p=0;p<4;p++)cd[p][n]=false;ch=true}};
  const inn=n=>{if(st[n]===0){st[n]=1;ch=true}};
  const rm=(p,n)=>{if(cd[p][n]){cd[p][n]=false;ch=true}};
  const fix=(p,n)=>{inn(n);for(let m=0;m<10;m++)if(m!==n)rm(p,m);for(let q=0;q<4;q++)if(q!==p)rm(q,n)};
  const fixed=p=>{let k=-1,c=0;for(let n=0;n<10;n++)if(cd[p][n]){c++;k=n}return c===1?k:-1};
  while(ch&&steps<200){ch=false;steps++;
    for(const {g,h,b} of cl){
      if(h===0)for(let i=0;i<4;i++)rm(i,g[i]);
      const k=h+b;let ik=0,uk=0;for(const x of g){if(st[x]===1)ik++;else if(st[x]===0)uk++}
      if(ik===k)for(const x of g)if(st[x]===0)out(x);
      if(ik+uk===k)for(const x of g)if(st[x]===0)inn(x);
      let hc=0,hp=0;for(let i=0;i<4;i++){if(cd[i][g[i]]){hp++;if(fixed(i)===g[i])hc++}}
      if(hc===h)for(let i=0;i<4;i++)if(fixed(i)!==g[i])rm(i,g[i]);
      if(hp===h)for(let i=0;i<4;i++)if(cd[i][g[i]])fix(i,g[i]);
      let bc=0,bp=0;const bpos=[];
      for(let i=0;i<4;i++){const x=g[i];
        const cert=st[x]===1&&!cd[i][x];
        const elsewhere=[0,1,2,3].some(q=>q!==i&&cd[q][x]);
        const poss=st[x]!==-1&&elsewhere&&fixed(i)!==x;
        if(cert)bc++;if(poss){bp++;bpos.push(i)}}
      if(bc===b)for(let i=0;i<4;i++){const x=g[i];if(!(st[x]===1&&!cd[i][x])){for(let q=0;q<4;q++)if(q!==i)rm(q,x)}}
      if(bp===b)for(const i of bpos){inn(g[i]);rm(i,g[i])}
    }
    for(let n=0;n<10;n++)if(st[n]!==-1&&![0,1,2,3].some(p=>cd[p][n]))out(n);
    for(let p=0;p<4;p++){const ps=[];for(let n=0;n<10;n++)if(cd[p][n])ps.push(n);if(ps.length===1)fix(p,ps[0])}
    for(let n=0;n<10;n++)if(st[n]===1){const qs=[0,1,2,3].filter(p=>cd[p][n]);if(qs.length===1)fix(qs[0],n)}
    if(st.filter(x=>x===1).length===4)for(let n=0;n<10;n++)if(st[n]===0)out(n);
    if(st.filter(x=>x===-1).length===6)for(let n=0;n<10;n++)if(st[n]===0)inn(n);
  }
  const ans=[0,1,2,3].map(fixed);
  return ans.every(x=>x>=0)?{ans,steps}:null;
}
function genOnce(r){const secret=P[Math.floor(r()*P.length)];let cand=P,cl=[],guard=0;
  while(cand.length>1&&guard++<300){const g=P[Math.floor(r()*P.length)];const [h,b]=sc(g,secret);if(h===4||(h+b===0&&r()<0.7))continue;
    const nc=cand.filter(p=>{const x=sc(g,p);return x[0]===h&&x[1]===b});if(nc.length<cand.length){cl.push({g,h,b});cand=nc}}
  if(!solveDirect(cl))return null;
  for(let i=cl.length-1;i>=0;i--){if(cl.length<=3)break;const t=cl.slice(0,i).concat(cl.slice(i+1));if(solveDirect(t))cl=t}
  return{secret,cl}}
function gen(seed){const r=mulberry32(seed);for(let t=0;t<500;t++){const x=genOnce(r);if(x)return Object.assign(x,{tries:t+1})}return null}

// 解き方ログ付きソルバー（ゲームにも同じコードを入れる）
function explainDirect(cl){
  const L=i=>String.fromCharCode(65+i);
  const st=Array(10).fill(0);const cd=[0,1,2,3].map(()=>Array(10).fill(true));
  let ch=true,rounds=0,cur=[];const steps=[];
  const out=n=>{if(st[n]!==-1){st[n]=-1;for(let p=0;p<4;p++)cd[p][n]=false;ch=true;cur.push(['out',n])}};
  const inn=n=>{if(st[n]===0){st[n]=1;ch=true;cur.push(['in',n])}};
  const rm=(p,n)=>{if(cd[p][n]){cd[p][n]=false;ch=true;cur.push(['rm',p,n])}};
  const fixed=p=>{let k=-1,c=0;for(let n=0;n<10;n++)if(cd[p][n]){c++;k=n}return c===1?k:-1};
  const fix=(p,n)=>{const was=fixed(p)===n&&st[n]===1;inn(n);for(let m=0;m<10;m++)if(m!==n)rm(p,m);for(let q=0;q<4;q++)if(q!==p)rm(q,n);if(!was)cur.push(['fix',p,n])};
  const J=a=>a.join('・');
  const step=(fn,msg)=>{cur=[];fn();if(cur.length)steps.push({msg:typeof msg==='function'?msg():msg,ch:cur.slice(),st:st.slice(),cd:cd.map(r=>r.slice())})};
  while(ch&&rounds<200){ch=false;rounds++;
    cl.forEach(({g,h,b},ci)=>{const l=L(ci),gs=g.join('');
      if(h===0)step(()=>{for(let i=0;i<4;i++)rm(i,g[i])},`${l}「${gs}」は●がない → どの数字も、この並びの位置には来ない`);
      const k=h+b;let ik=0,uk=0;const ins=[],unk=[];for(const x of g){if(st[x]===1){ik++;ins.push(x)}else if(st[x]===0){uk++;unk.push(x)}}
      if(ik===k&&uk)step(()=>{for(const x of unk)out(x)},k===0?`${l}「${gs}」はどの数字も含まれない → ${J(unk)}を消す`:`${l}「${gs}」で答えに入るのは${k}個。${J(ins)}で埋まったので、${J(unk)}は入らない`);
      if(ik+uk===k&&uk)step(()=>{for(const x of unk)inn(x)},`${l}「${gs}」で答えに入るのは${k}個。残っている候補は${J(ins.concat(unk))}だけ → ${J(unk)}も答えに入る`);
      let hc=0,hp=0;const hcs=[],hps=[];for(let i=0;i<4;i++){if(cd[i][g[i]]){hp++;hps.push(i);if(fixed(i)===g[i]){hc++;hcs.push(i)}}}
      if(hc===h)step(()=>{for(let i=0;i<4;i++)if(fixed(i)!==g[i])rm(i,g[i])},h===0?null:`${l}「${gs}」の●${h}つは${J(hcs.map(i=>g[i]))}で確定済み → 他の数字はこの並びの位置には来ない`);
      if(hp===h&&h>0)step(()=>{for(const i of hps)fix(i,g[i])},`${l}「${gs}」の●は${h}つ。この並びの位置にまだ入りうるのは${J(hps.map(i=>`${g[i]}（${i+1}桁目）`))}だけ → 確定`);
      let bc=0,bp=0;const bcs=[],bps=[];
      for(let i=0;i<4;i++){const x=g[i];const cert=st[x]===1&&!cd[i][x];const elsewhere=[0,1,2,3].some(q=>q!==i&&cd[q][x]);const poss=st[x]!==-1&&elsewhere&&fixed(i)!==x;
        if(cert){bc++;bcs.push(x)}if(poss){bp++;bps.push(i)}}
      if(bc===b)step(()=>{for(let i=0;i<4;i++){const x=g[i];if(!(st[x]===1&&!cd[i][x])){for(let q=0;q<4;q++)if(q!==i)rm(q,x)}}},
        b===0?`${l}「${gs}」は○がない → この中の数字は、答えに入るならこの並びと同じ位置にしか来られない`:`${l}「${gs}」の○${b}つは${J(bcs)}で確定済み → 他の数字は、答えに入るならこの並びと同じ位置にしか来られない`);
      if(bp===b&&b>0)step(()=>{for(const i of bps){inn(g[i]);rm(i,g[i])}},`${l}「${gs}」の○は${b}つ。位置ちがいになりうるのは${J(bps.map(i=>g[i]))}だけ → どれも答えに入り、この並びの位置ではない`);
    });
    for(let n=0;n<10;n++)if(st[n]!==-1&&![0,1,2,3].some(p=>cd[p][n]))step(()=>out(n),`${n}は入れる桁がなくなった → 答えに入らない`);
    for(let p=0;p<4;p++){const ps=[];for(let n=0;n<10;n++)if(cd[p][n])ps.push(n);if(ps.length===1&&!cur.length)step(()=>fix(p,ps[0]),`${p+1}桁目に入れる数字は${ps[0]}だけ → 確定`)}
    for(let n=0;n<10;n++)if(st[n]===1){const qs=[0,1,2,3].filter(p=>cd[p][n]);if(qs.length===1)step(()=>fix(qs[0],n),`${n}は答えに入るが、入れるのは${qs[0]+1}桁目だけ → 確定`)}
    {const ins=[];for(let n=0;n<10;n++)if(st[n]===1)ins.push(n);if(ins.length===4){const rest=[];for(let n=0;n<10;n++)if(st[n]===0)rest.push(n);if(rest.length)step(()=>rest.forEach(out),`答えの4つは${J(ins)}に決まった → ${J(rest)}は入らない`)}}
    {const outs=st.filter(x=>x===-1).length;if(outs===6){const rest=[];for(let n=0;n<10;n++)if(st[n]===0)rest.push(n);if(rest.length)step(()=>rest.forEach(inn),`6つの数字が消えた → 残りの${J(rest)}は答えに入る`)}}
  }
  const ans=[0,1,2,3].map(fixed);
  return{ans:ans.every(x=>x>=0)?ans:null,steps:steps.filter(s=>s.msg)};
}

function short(m){
  const r=[
    [/^([A-H])「(\d+)」は●がない → .*$/,(_,l,g)=>`${l}：●なし → ${[...g].join('・')}はそれぞれその位置に×`],
    [/^([A-H])「(\d+)」は○がない → .*$/,(_,l)=>`${l}：○なし → この数字は、入るならこの位置だけ`],
    [/^([A-H])「(\d+)」はどの数字も含まれない → (.*)を消す$/,(_,l,g,x)=>`${l}：どれも含まれない → ${x}を消す`],
    [/^([A-H])「(\d+)」で答えに入るのは(\d)個。(.*)で埋まったので、(.*)は入らない$/,(_,l,g,k,a,b)=>`${l}：${k}個は${a}で埋まった → ${b}を消す`],
    [/^([A-H])「(\d+)」で答えに入るのは(\d)個。残っている候補は(.*)だけ → (.*)(?:は|も)答えに入る$/,(_,l,g,k,a,b)=>`${l}：残る候補がちょうど${k}個 → ${b}が入る`],
    [/^([A-H])「(\d+)」の●(\d)つは(.*)で確定済み → .*$/,(_,l,g,k,a)=>`${l}：●は${a}で確定 → 他の数字はその位置に×`],
    [/^([A-H])「(\d+)」の●は(\d)つ。この並びの位置にまだ入りうるのは(.*)だけ → 確定$/,(_,l,g,k,a)=>`${l}：●になりうるのは${a}だけ → 確定`],
    [/^([A-H])「(\d+)」は○がない → .*$/,(_,l)=>`${l}：○なし → この数字は、入るならこの位置だけ`],
    [/^([A-H])「(\d+)」の○(\d)つは(.*)で確定済み → .*$/,(_,l,g,k,a)=>`${l}：○は${a}で確定 → 他の数字は、入るならこの位置だけ`],
    [/^([A-H])「(\d+)」の○は(\d)つ。位置ちがいになりうるのは(.*)だけ → .*$/,(_,l,g,k,a)=>`${l}：○になりうるのは${a}だけ → 入る（この位置ではない）`],
    [/^(\d)は入れる桁がなくなった → 答えに入らない$/,(_,n)=>`${n}は入れる桁がない → 消す`],
    [/^(\d)桁目に入れる数字は(\d)だけ → 確定$/,(_,p,n)=>`${p}桁目に入るのは${n}だけ → 確定`],
    [/^(\d)は答えに入るが、入れるのは(\d)桁目だけ → 確定$/,(_,n,p)=>`${n}が入れるのは${p}桁目だけ → 確定`],
    [/^答えの4つは(.*)に決まった → (.*)は入らない$/,(_,a,b)=>`4つが${a}に決まった → ${b}を消す`],
    [/^6つの数字が消えた → 残りの(.*)は答えに入る$/,(_,a)=>`6つ消えた → 残りの${a}が入る`],
  ];
  for(const [re,f] of r){if(re.test(m))return m.replace(re,f)}
  throw new Error('unmapped: '+m);
}


const dropRedundant=(steps,cl)=>steps.filter(x=>{const m=/^([A-H])「\d+」は●がない/.exec(x.msg);if(!m)return true;const c=cl[m[1].charCodeAt(0)-65];return c.h+c.b>0});
// 解き方：短い文と、その時点のメモ表
function solution(cl){const e=explainDirect(cl);const st=dropRedundant(e.steps.filter(x=>!x.end),cl);return{ans:e.ans,steps:st.map(x=>({msg:short(x.msg),st:x.st,cd:x.cd,ch:x.ch}))}}
const EPOCH=Date.UTC(2026,10,1);
function seedOf(iso){const[y,m,d]=iso.split('-').map(Number);return y*10000+m*100+d}
function numOf(iso){const[y,m,d]=iso.split('-').map(Number);return Math.floor((Date.UTC(y,m-1,d)-EPOCH)/864e5)+1}
function todayJST(){return new Date(Date.now()+9*3600e3).toISOString().slice(0,10)}
function addDays(iso,n){const[y,m,d]=iso.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10)}
function daily(iso){return gen(seedOf(iso))}
function level(n){return n<=9?1:n<=13?2:3}
return{P,sc,count,gen,solution,short,seedOf,numOf,todayJST,addDays,daily,level,mulberry32};
});
