/* 自分の記録と称号。記録はこの端末のブラウザにだけ保存される */
(function(){
  const KEY='jomae-site-v1';
  function load(){let s={};try{s=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}s.days=s.days||{};s.stats=s.stats||{played:0,wins:0,streak:0,best:0,last:''};s.practice=s.practice||{played:0,wins:0};return s}
  // 称号：解錠した回数（今日の問題・過去問の合計）で上がる
  const RANKS=[[0,'見習い'],[1,'駆け出しの錠前師'],[10,'錠前師'],[30,'腕利きの錠前師'],[60,'熟練の錠前師'],[100,'名人錠前師'],[200,'伝説の錠前師']];
  // バッジ：条件を満たすと獲得
  const BADGES=[
    {id:'first',name:'はじめての解錠',how:'問題を1問解錠する',ok:r=>r.allWins>=1},
    {id:'one',name:'一発解錠',how:'1回目で解錠する',ok:r=>r.dist[1]>=1},
    {id:'last',name:'粘り勝ち',how:'6回目で解錠する',ok:r=>r.dist[6]>=1},
    {id:'hard',name:'難問突破',how:'★★★の問題を解錠する',ok:r=>r.hardWins>=1},
    {id:'s3',name:'3日連続',how:'今日の問題を3日続けて解錠',ok:r=>r.best>=3},
    {id:'s7',name:'1週間連続',how:'7日続けて解錠',ok:r=>r.best>=7},
    {id:'s30',name:'1か月連続',how:'30日続けて解錠',ok:r=>r.best>=30},
    {id:'s100',name:'100日連続',how:'100日続けて解錠',ok:r=>r.best>=100},
    {id:'w10',name:'10回解錠',how:'合計10問を解錠',ok:r=>r.allWins>=10},
    {id:'w50',name:'50回解錠',how:'合計50問を解錠',ok:r=>r.allWins>=50},
    {id:'past10',name:'過去問コレクター',how:'過去問を10問解錠',ok:r=>r.pastWins>=10},
    {id:'prac20',name:'練習の鬼',how:'練習問題を20問解錠',ok:r=>r.practice.wins>=20},
  ];
  function compute(s){
    s=s||load();const st=s.stats;
    const dist={1:0,2:0,3:0,4:0,5:0,6:0,x:0};let wins=0,done=0,live=0,liveWins=0,pastWins=0,hardWins=0,sumTries=0;
    for(const [d,v] of Object.entries(s.days)){if(!v||!v.done)continue;done++;
      if(v.won){wins++;sumTries+=v.guesses.length;dist[v.guesses.length]=(dist[v.guesses.length]||0)+1;if(v.lv===3)hardWins++;if(v.live)liveWins++;else pastWins++}else dist.x++;
      if(v.live)live++}
    const allWins=wins+s.practice.wins;
    // 連続記録は保存値を使い、最後に解いた日が昨日より前なら途切れている
    const today=new Date(Date.now()+9*3600e3).toISOString().slice(0,10);const y=new Date(Date.now()+9*3600e3-864e5).toISOString().slice(0,10);
    const streak=(st.last===today||st.last===y)?st.streak:0;
    const r={done,wins,dist,avg:wins?sumTries/wins:0,rate:done?wins/done:0,streak,best:st.best||0,live,liveWins,pastWins,hardWins,practice:s.practice,allWins};
    r.rank=RANKS.filter(x=>allWins>=x[0]).at(-1)[1];
    const nx=RANKS.find(x=>allWins<x[0]);r.next=nx?{name:nx[1],left:nx[0]-allWins}:null;
    r.badges=BADGES.map(b=>({id:b.id,name:b.name,how:b.how,got:!!b.ok(r)}));
    return r;
  }
  // 結果画面用：前回から新しく取ったバッジ
  function newly(s){s=s||load();const got=compute(s).badges.filter(b=>b.got).map(b=>b.id);const seen=s.seenBadges||[];const fresh=got.filter(id=>!seen.includes(id));s.seenBadges=got;try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');raw.seenBadges=got;localStorage.setItem(KEY,JSON.stringify(raw))}catch(e){}return BADGES.filter(b=>fresh.includes(b.id)).map(b=>b.name)}
  window.JomaeRecords={load,compute,newly,RANKS,BADGES};
  // 記録ページ
  const el=document.getElementById('records');if(!el)return;
  const r=compute();const max=Math.max(1,...Object.values(r.dist));
  const bar=(label,n)=>`<div class="bar-row"><span>${label}</span><span class="bar"><i style="width:${Math.max(n?8:0,n/max*100)}%"></i></span><b>${n}</b></div>`;
  el.innerHTML=`<div class="rank win"><span class="muted small">いまの称号</span><div class="rank-name">${r.rank}</div>${r.next?`<span class="small muted">あと${r.next.left}問の解錠で「${r.next.name}」</span>`:'<span class="small muted">最高の称号です</span>'}</div>
<div class="tiles"><div><b>${r.done}</b>挑戦</div><div><b>${r.wins}</b>解錠</div><div><b>${Math.round(r.rate*100)}%</b>解錠率</div><div><b>${r.wins?r.avg.toFixed(1):'-'}</b>平均回数</div><div><b>${r.streak}</b>連続</div><div><b>${r.best}</b>最高連続</div></div>
<h2>何回目で解けたか</h2><div class="dist win">${[1,2,3,4,5,6].map(n=>bar(n+'回',r.dist[n])).join('')}${bar('失敗',r.dist.x)}</div>
<p class="small muted">今日の問題 ${r.liveWins}問・過去問 ${r.pastWins}問・練習 ${r.practice.wins}問を解錠</p>
<h2>バッジ <span class="small muted">${r.badges.filter(b=>b.got).length} / ${r.badges.length}</span></h2>
<ul class="badges">${r.badges.map(b=>`<li class="${b.got?'got':''}"><span class="bi" aria-hidden="true">${b.got?'★':'？'}</span><span><b>${b.name}</b><br><span class="small muted">${b.how}</span></span></li>`).join('')}</ul>
<p class="small muted">記録はこの端末のブラウザに保存されています。ブラウザのデータを消すと記録も消えます。</p>`;
})();
