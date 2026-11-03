/* 今日の錠前：遊ぶ画面。#game の data-mode = today | date | practice */
(function(){
  const C=window.JomaeCore,CFG=window.JOMAE_CONFIG||{};
  const root=document.getElementById('game');if(!root)return;
  const MAX=6,START=CFG.startDate||'2026-11-02';
  const mode=root.dataset.mode;const base=root.dataset.root||'/';const linkStyle=root.dataset.links||'clean';
  const href=p=>linkStyle==='file'?base+(p?p+'/':'')+'index.html':base+(p?p+'/':'');
  const $=s=>root.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  const pad3=n=>String(n).padStart(3,'0');
  // 保存（失敗しても遊べる）
  const KEY='jomae-site-v1';
  let store={};try{store=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){store={}}
  store.days=store.days||{};store.memo=store.memo||{};store.stats=store.stats||{played:0,wins:0,streak:0,best:0,last:''};store.practice=store.practice||{played:0,wins:0};
  const R=window.JomaeRecords;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}};

  let date=null,puzzle=null,day=null,input=[],memo=null,practice=mode==='practice',walk=null;
  const today=C.todayJST();
  function load(){
    if(practice){puzzle=C.gen(Math.floor(Math.random()*1e9));date=null;day={guesses:[],done:false,won:false};memo=newMemo();}
    else{date=mode==='date'?root.dataset.date:(today<START?START:today);puzzle=C.daily(date);
      day=store.days[date]||{guesses:[],done:false,won:false};memo=store.memo[date]||newMemo();}
    input=[];walk=null;render();
  }
  function newMemo(){return{cells:Array(40).fill(0),cols:Array(10).fill(0)}}
  const isToday=()=>!practice&&date===(today<START?START:today);

  // 判定の表示
  const fb=(h,b)=>h+b===0?'<span class="fbr"><span class="pip x"></span><span class="muted">ひとつも含まれない</span></span>':
    (h?`<span class="fbr">${'<span class="pip h"></span>'.repeat(h)}<span>${h}つ 位置も正しい</span></span>`:'')+(b?`<span class="fbr">${'<span class="pip b"></span>'.repeat(b)}<span>${b}つ 位置ちがい</span></span>`:'');
  const plate=(g,h,b,tag,mine)=>`<div class="plate win${mine?' mine':''}"><span class="tag">${tag}</span><span class="digits" aria-label="${g.join('')}">${g.map(x=>`<span class="d">${x}</span>`).join('')}</span><span class="fb">${fb(h,b)}</span></div>`;

  function render(){
    const n=practice?null:C.numOf(date);
    const lv=C.level(C.solution(puzzle.cl).steps.length);
    root.innerHTML=`
<div class="ph"><span class="no">${practice?'練習問題':'No.'+pad3(n)}</span><span class="dt">${practice?'記録には残りません':esc(date.replace(/-/g,'/'))} <span class="stars" title="難しさ">${'★'.repeat(lv)}${'☆'.repeat(3-lv)}</span></span></div>
<section aria-label="手がかり"><div class="plates" id="plates"></div></section>
<div class="memo-head"><h2>メモ表</h2><button class="btn small" id="memoClear" type="button">全部消す</button></div>
<div class="memo win" id="memo" role="group" aria-label="メモ表"></div>
<p class="hint">マス：空 → × → ●　上の数字：消す → 必ず入る → 戻す</p>
<div class="lock win" id="lock"><div class="slots" id="slots"></div><div class="tries" id="tries"></div>
<div class="pad" id="pad">${[1,2,3,4,5,6,7,8,9,0].map(k=>`<button class="k" type="button" data-n="${k}" id="k${k}">${k}</button>`).join('')}</div>
<div class="acts" id="acts"><button class="k w" type="button" id="del">消す</button><button class="k w go" type="button" id="go">解錠する</button></div></div>
<div class="msg" id="msg" role="status"></div>
${practice?'<div class="row"><button class="btn" type="button" id="giveup">答えと解き方を見る</button></div>':''}
<div id="result" hidden></div><div id="walk" hidden></div>`;
    $('#pad').addEventListener('click',e=>{const k=e.target.closest('[data-n]');if(k)press(+k.dataset.n)});
    $('#del').onclick=del;$('#go').onclick=submit;
    $('#memo').addEventListener('click',memoTap);
    $('#memoClear').onclick=()=>{memo=newMemo();saveMemo();renderMemo()};
    if(practice)$('#giveup').onclick=()=>{if(!day.done){finish(false);openWalk()}};
    renderPlates();renderMemo();renderLock();if(day.done)renderResult();
  }
  function renderPlates(){
    let h=puzzle.cl.map((c,i)=>plate(c.g,c.h,c.b,String.fromCharCode(65+i))).join('');
    day.guesses.forEach(g=>{const [hh,bb]=C.sc(g,puzzle.secret);if(hh<4)h+=plate(g,hh,bb,'推',true)});
    $('#plates').innerHTML=h;
  }
  const colState=n=>memo.cols[n]||0;
  function renderMemo(){
    let h='<span></span>';
    for(let n=0;n<10;n++){const c=colState(n);h+=`<button type="button" class="mh${c===1?' out':c===2?' in':''}" data-col="${n}" aria-label="${n}：${['未定','答えに入らない','必ず入る'][c]}">${n}</button>`}
    for(let p=0;p<4;p++){h+=`<span class="ml">${p+1}桁目</span>`;
      for(let n=0;n<10;n++){const o=colState(n)===1,v=o?1:memo.cells[p*10+n];h+=`<button type="button" class="mc v${v}${o?' out':''}" data-cell="${p*10+n}" aria-label="${p+1}桁目の${n}">${v===1?'×':v===2?'●':''}</button>`}}
    $('#memo').innerHTML=h;
  }
  function memoTap(e){
    const col=e.target.closest('[data-col]'),cell=e.target.closest('[data-cell]');
    if(col){const n=+col.dataset.col;memo.cols[n]=(colState(n)+1)%3}
    else if(cell){const i=+cell.dataset.cell;if(colState(i%10)===1)return;memo.cells[i]=(memo.cells[i]+1)%3}
    else return;saveMemo();renderMemo();
  }
  function saveMemo(){if(!practice){store.memo[date]=memo;save()}}
  function renderLock(){
    if(day.done){
      $('#slots').innerHTML=puzzle.secret.map(x=>`<span class="slot ${day.won?'open':'shut'}">${x}</span>`).join('');
      $('#tries').innerHTML=`<span class="state${day.won?'':' ng'}">${day.won?'解錠しました':'今日は開きませんでした'}</span>`;
      $('#pad').hidden=true;$('#acts').hidden=true;const g=root.querySelector('#giveup');if(g)g.hidden=true;return;
    }
    $('#slots').innerHTML=[0,1,2,3].map(i=>`<span class="slot${i===input.length?' cur':''}">${input[i]??''}</span>`).join('');
    $('#tries').textContent=`残り ${MAX-day.guesses.length} 回`;
    root.querySelectorAll('.k[data-n]').forEach(k=>k.disabled=input.includes(+k.dataset.n)||input.length>=4);
    $('#del').disabled=!input.length;$('#go').disabled=input.length<4;
  }
  function press(n){if(day.done||input.length>=4||input.includes(n))return;input.push(n);$('#msg').textContent='';renderLock()}
  function del(){if(day.done)return;input.pop();renderLock()}
  document.addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea'))return;if(/^[0-9]$/.test(e.key))press(+e.key);else if(e.key==='Backspace')del();else if(e.key==='Enter')submit()});
  function submit(){
    if(day.done||input.length<4)return;const g=input.slice();input=[];day.guesses.push(g);
    const [h]=C.sc(g,puzzle.secret);
    if(h===4)finish(true);else if(day.guesses.length>=MAX)finish(false);
    else{const L=$('#lock');L.classList.remove('shake');void L.offsetWidth;L.classList.add('shake');$('#msg').textContent='開きません。判定を手がかりに加えました。';persist()}
    renderPlates();renderLock();
  }
  function persist(){if(!practice){store.days[date]=day;save()}}
  function finish(won){
    day.done=true;day.won=won;day.live=isToday();day.lv=C.level(C.solution(puzzle.cl).steps.length);
    if(practice){store.practice.played++;if(won)store.practice.wins++;save()}
    if(isToday()){const s=store.stats;s.played++;if(won){s.wins++;s.streak=s.last===C.addDays(date,-1)?s.streak+1:1;s.best=Math.max(s.best,s.streak)}else s.streak=0;s.last=date}
    persist();$('#msg').textContent='';renderLock();renderResult();
    setTimeout(()=>{try{$('#lock').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}catch(e){}},60);
  }
  function shareText(){
    const rows=day.guesses.map(g=>{const [h,b]=C.sc(g,puzzle.secret);return '🟧'.repeat(h)+'🟨'.repeat(b)+'⬛'.repeat(4-h-b)});
    const rank=R?'\n🔑 '+R.compute(store).rank:'';
    return `今日の錠前 No.${pad3(C.numOf(date))} ${day.won?day.guesses.length:'×'}/${MAX}\n${rows.join('\n')}${rank}${CFG.siteUrl?'\n'+CFG.siteUrl:''}`;
  }
  function renderResult(){
    const r=$('#result');r.hidden=false;r.className='result win';
    const s=store.stats;const pastAnswer=!practice&&date<today;
    let h=`<div class="clear${day.won?'':' ng'}">${day.won?'解錠成功！':'今日は開かず'}</div><div>暗証番号は <b style="font-weight:400;font-size:22px;letter-spacing:.12em;color:var(--yel)">${puzzle.secret.join('')}</b>${day.won?`（${day.guesses.length}回目）`:''}</div>`;
    if(!practice){h+=`<div class="share" id="share">${esc(shareText())}</div><div class="row"><button class="btn y" type="button" id="copy">結果をコピー</button><button class="btn" type="button" id="walkBtn">解き方を見る</button></div>`;
      if(isToday())h+=`<div class="stats"><div><b>${s.played}</b>挑戦</div><div><b>${s.played?Math.round(s.wins/s.played*100):0}%</b>解錠率</div><div><b>${s.streak}</b>連続</div><div><b>${s.best}</b>最高</div></div><div class="next" id="next"></div>`;
      if(pastAnswer)h+=`<a class="btn" href="${href('puzzle/'+date+'/answer')}">解き方ページを開く</a>`;
      h+=`<div class="row"><a class="btn" href="${href('practice')}">練習問題を解く</a><a class="btn" href="${href('archive')}">過去問</a></div>`;
    }else h+=`<div class="row"><button class="btn y" type="button" id="more">もう1問</button><button class="btn" type="button" id="walkBtn">解き方を見る</button></div>`;
    if(R){const rec=R.compute(store);const nb=R.newly(store);save();
      h+=`<div class="rank-mini">称号 <b>${esc(rec.rank)}</b>${rec.next?`<span class="small muted">あと${rec.next.left}問で「${esc(rec.next.name)}」</span>`:''}</div>${nb.length?`<div class="newb">バッジ獲得！ ${nb.map(x=>`<b>${esc(x)}</b>`).join('・')}</div>`:''}<a class="small" href="${href('record')}">記録とバッジを見る</a>`}
    r.innerHTML=h+ad()+promo();
    const c=r.querySelector('#copy');if(c)c.onclick=()=>{const t=shareText();const ok=()=>c.textContent='コピーしました';const fb2=()=>{const sel=getSelection(),rg=document.createRange();rg.selectNodeContents(r.querySelector('#share'));sel.removeAllRanges();sel.addRange(rg);c.textContent='選択した文字をコピーしてください'};try{navigator.clipboard.writeText(t).then(ok,fb2)}catch(e){fb2()}};
    r.querySelector('#walkBtn').onclick=openWalk;
    const m=r.querySelector('#more');if(m)m.onclick=()=>{load();scrollTo(0,0)};
    if(isToday())tick();
    try{window.adsbygoogle&&r.querySelectorAll('ins.adsbygoogle').forEach(()=>(adsbygoogle=window.adsbygoogle||[]).push({}))}catch(e){}
  }
  function ad(){return CFG.adsenseClient&&CFG.adsenseSlot?`<ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="${esc(CFG.adsenseClient)}" data-ad-slot="${esc(CFG.adsenseSlot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`:''}
  function promo(){return CFG.bookUrl?`<div class="promo win" style="width:100%"><span>紙で解くなら：${esc(CFG.bookTitle||'今日の錠前 パズル本')}</span><a class="btn y" href="${esc(CFG.bookUrl)}" target="_blank" rel="noopener">本を見る</a></div>`:''}
  function tick(){const el=root.querySelector('#next');if(!el)return;const now=Date.now()+9*3600e3;const t=C.addDays(today,1).split('-').map(Number);let s=Math.max(0,Math.floor((Date.UTC(t[0],t[1]-1,t[2])-now)/1000));el.textContent=`次の錠前まで ${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;if(s>0)setTimeout(tick,1000)}
  // 解き方（1手ずつ）
  function openWalk(){walk={steps:C.solution(puzzle.cl).steps,i:0};const w=$('#walk');w.hidden=false;w.className='walk win';drawWalk();setTimeout(()=>{try{w.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}},50)}
  function drawWalk(){
    const s=walk.steps[walk.i];
    $('#walk').innerHTML=`<div class="walk-h"><h2>解き方</h2><span class="muted">${walk.i+1} / ${walk.steps.length}</span></div><p class="walk-msg">${esc(s.msg)}</p>${C_grid(s)}<p class="small muted">緑の枠がこの手順で変わったマス。●確定 ×その桁には来ない ―答えに入らない</p><div class="walk-nav"><button class="btn" type="button" id="wp">前へ</button><button class="btn y" type="button" id="wn">次へ</button></div>`;
    $('#wp').disabled=walk.i===0;$('#wn').disabled=walk.i===walk.steps.length-1;
    $('#wp').onclick=()=>{walk.i--;drawWalk()};$('#wn').onclick=()=>{walk.i++;drawWalk()};
  }
  window.JomaeGrid=C_grid;
  function C_grid(s){
    const hl=new Set();s.ch.forEach(c=>{if(c[0]==='rm'||c[0]==='fix')hl.add(c[1]*10+c[2]);else if(c[0]==='out')for(let p=0;p<4;p++)hl.add(p*10+c[1])});
    const fx=p=>{let k=-1,c=0;for(let n=0;n<10;n++)if(s.cd[p][n]){c++;k=n}return c===1?k:-1};
    let h='<div class="memo"><span></span>';for(let n=0;n<10;n++)h+=`<span class="mh${s.st[n]===-1?' out':s.st[n]===1?' in':''}">${n}</span>`;
    for(let p=0;p<4;p++){const f=fx(p);h+=`<span class="ml">${p+1}桁目</span>`;for(let n=0;n<10;n++){let t='',c='';if(s.st[n]===-1){t='―';c=' out'}else if(f===n){t='●';c=' v2'}else if(!s.cd[p][n])t='×';h+=`<span class="mc${c}${hl.has(p*10+n)?' hl':''}">${t}</span>`}}
    return h+'</div>';
  }
  load();
})();
