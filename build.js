// 今日の錠前 サイト生成。使い方: node build.js [--today=YYYY-MM-DD] [--out=dist] [--links=clean|file]
// 毎日0時（日本時間）に実行すると、その日の問題ページと前日の解き方ページが増えます。
const fs=require('fs'),path=require('path');
const C=require('./src/core.js');
const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const CFG=JSON.parse(fs.readFileSync(path.join(__dirname,'config.json'),'utf8'));
const TODAY=args.today||C.todayJST();const OUT=path.resolve(__dirname,args.out||'dist');const LINKS=args.links||'clean';
const START=CFG.startDate;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const pad3=n=>String(n).padStart(3,'0');
const dates=[];for(let d=START;d<=TODAY;d=C.addDays(d,1))dates.push(d);
const PH=(v,label)=>v?esc(v):`【${label}】`;

// ページ間リンク：本番は /puzzle/2026-11-02/ 、プレビューは相対パス＋index.html
function rel(fromDir,to){const a=fromDir?fromDir.split('/'):[];const up='../'.repeat(a.length);return up+(to?to+'/':'')+(LINKS==='file'?'index.html':'')}
function asset(fromDir,file){return LINKS==='file'?'../'.repeat(fromDir?fromDir.split('/').length:0)+file:'/'+file}
function rootOf(fromDir){return LINKS==='file'?'../'.repeat(fromDir?fromDir.split('/').length:0):'/'}

function layout(dir,{title,desc,body,nav='',game=false,rec=false,noindex=false,wide=false}){
  const L=to=>LINKS==='file'?rel(dir,to):'/'+(to?to+'/':'');
  const canon=CFG.siteUrl?CFG.siteUrl.replace(/\/$/,'')+'/'+(dir?dir+'/':''):'';
  const navItem=(to,label,key)=>`<a href="${L(to)}"${nav===key?' aria-current="page"':''}>${label}</a>`;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${canon?`<link rel="canonical" href="${esc(canon)}"><meta property="og:url" content="${esc(canon)}">`:''}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">
${CFG.siteUrl?`<meta property="og:image" content="${esc(CFG.siteUrl.replace(/\/$/,''))}/og.png">`:''}<meta name="twitter:card" content="summary_large_image">
${noindex?'<meta name="robots" content="noindex">':''}
${CFG.googleVerification?`<meta name="google-site-verification" content="${esc(CFG.googleVerification)}">`:''}
<meta name="theme-color" content="#12133a"><link rel="manifest" href="${asset(dir,'manifest.webmanifest')}">
<link rel="icon" href="${asset(dir,'icons/icon-192.png')}"><link rel="apple-touch-icon" href="${asset(dir,'icons/apple-touch-icon.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap">
<link rel="stylesheet" href="${asset(dir,'style.css')}">
${CFG.adsenseClient?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(CFG.adsenseClient)}" crossorigin="anonymous"></script>`:''}
${CFG.analyticsToken?`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(CFG.analyticsToken)}"}'></script>`:''}
</head><body><div class="wrap${wide?' wide':''}">
<header class="site-h"><a class="logo" href="${L('')}">今日の錠前</a><nav class="nav" aria-label="メニュー">${navItem('','今日の問題','today')}${navItem('archive','過去問','archive')}${navItem('practice','練習','practice')}${navItem('record','記録','record')}${navItem('guide','遊び方','guide')}</nav></header>
<main>${body}</main>
<footer class="site-f"><a href="${L('about')}">運営者情報</a><a href="${L('privacy')}">プライバシーポリシー</a><a href="${L('contact')}">お問い合わせ</a>${CFG.instagram?`<a href="${esc(CFG.instagram)}" rel="noopener" target="_blank">Instagram</a>`:''}<span>© 2026 ${PH(CFG.operator,'運営者名')}</span></footer>
</div>
${game?`<script src="${asset(dir,'config.js')}"></script><script src="${asset(dir,'core.js')}"></script><script src="${asset(dir,'records.js')}"></script><script src="${asset(dir,'game.js')}"></script>`:''}${rec&&!game?`<script src="${asset(dir,'records.js')}"></script>`:''}
${LINKS==='clean'?`<script>if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))</script>`:''}
</body></html>`;
}
function write(dir,html){const d=path.join(OUT,dir);fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,'index.html'),html)}
const fbTxt=(h,b)=>h+b===0?'<span class="fbr"><span class="pip x"></span><span class="muted">ひとつも含まれない</span></span>':(h?`<span class="fbr">${'<span class="pip h"></span>'.repeat(h)}<span>${h}つ 位置も正しい</span></span>`:'')+(b?`<span class="fbr">${'<span class="pip b"></span>'.repeat(b)}<span>${b}つ 位置ちがい</span></span>`:'');
const plate=(c,i)=>`<div class="plate win"><span class="tag">${String.fromCharCode(65+i)}</span><span class="digits">${c.g.map(x=>`<span class="d">${x}</span>`).join('')}</span><span class="fb">${fbTxt(c.h,c.b)}</span></div>`;
function grid(s){
  const hl=new Set();s.ch.forEach(c=>{if(c[0]==='rm'||c[0]==='fix')hl.add(c[1]*10+c[2]);else if(c[0]==='out')for(let p=0;p<4;p++)hl.add(p*10+c[1])});
  const fx=p=>{let k=-1,c=0;for(let n=0;n<10;n++)if(s.cd[p][n]){c++;k=n}return c===1?k:-1};
  let h='<div class="memo win"><span></span>';for(let n=0;n<10;n++)h+=`<span class="mh${s.st[n]===-1?' out':s.st[n]===1?' in':''}">${n}</span>`;
  for(let p=0;p<4;p++){const f=fx(p);h+=`<span class="ml">${p+1}桁目</span>`;for(let n=0;n<10;n++){let t='',c='';if(s.st[n]===-1){t='―';c=' out'}else if(f===n){t='●';c=' v2'}else if(!s.cd[p][n])t='×';h+=`<span class="mc${c}${hl.has(p*10+n)?' hl':''}">${t}</span>`}}
  return h+'</div>';
}
const stars=n=>{const l=C.level(n);return '★'.repeat(l)+'☆'.repeat(3-l)};
const jdate=d=>{const[y,m,dd]=d.split('-').map(Number);return `${y}年${m}月${dd}日（${'日月火水木金土'[new Date(Date.UTC(y,m-1,dd)).getUTCDay()]}）`};
const adSlot=()=>CFG.adsenseClient&&CFG.adsenseSlot?`<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(CFG.adsenseClient)}" data-ad-slot="${esc(CFG.adsenseSlot)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({})</script>`:'';
const noscript=(dir,d)=>{const p=C.daily(d);return `<noscript><div class="plates">${p.cl.map(plate).join('')}</div><p>このページで遊ぶにはJavaScriptを有効にしてください。</p></noscript>`};

fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
// トップ（今日の問題。日付はブラウザで決まる）
write('',layout('',{title:'今日の錠前｜毎日1問の暗証番号推理パズル',desc:'手がかりから4桁の暗証番号を推理する、毎日1問のパズル。仮定なしで必ず解けて、全問に解き方つき。',nav:'today',game:true,
  body:`<div id="game" data-mode="today" data-root="${rootOf('')}" data-links="${LINKS}"></div>${noscript('',TODAY)}`}));
// 日付ごとの問題
for(const d of dates){const dir=`puzzle/${d}`;const p=C.daily(d);const n=C.numOf(d);const st=C.solution(p.cl).steps.length;
  write(dir,layout(dir,{title:`No.${pad3(n)}（${d.slice(5).replace('-','/')}）｜今日の錠前`,desc:`${jdate(d)}の今日の錠前。手がかり${p.cl.length}つから4桁の暗証番号を推理します。難しさ${stars(st)}`,
    body:`<h1 class="small muted" style="font-size:14px;margin:6px 0 0">${jdate(d)}の問題</h1><div id="game" data-mode="date" data-date="${d}" data-root="${rootOf(dir)}" data-links="${LINKS}"></div>${noscript(dir,d)}
<p class="small" style="margin-top:18px">${d<TODAY?`<a href="${LINKS==='file'?rel(dir,dir+'/answer'):'/'+dir+'/answer/'}">この日の解き方を見る</a>`:'解き方のページは明日公開します。'}</p>`,game:true}));}
// 解き方ページ（前日まで）
for(const d of dates.filter(x=>x<TODAY)){const dir=`puzzle/${d}/answer`;const p=C.daily(d);const n=C.numOf(d);const s=C.solution(p.cl);
  const key=s.steps.find(x=>!/：●なし/.test(x.msg))||s.steps[0];
  write(dir,layout(dir,{title:`No.${pad3(n)}の答えと解き方（${d.slice(5).replace('-','/')}）｜今日の錠前`,desc:`${jdate(d)}の今日の錠前の答えと、仮定を使わずに解く全${s.steps.length}手順をメモ表の図つきで解説します。`,
    body:`<h1>No.${pad3(n)} の答えと解き方</h1><p class="muted small">${jdate(d)}　難しさ <span class="stars">${stars(s.steps.length)}</span>　全${s.steps.length}手順</p>
<div class="plates">${p.cl.map(plate).join('')}</div>
<details style="margin-top:18px"><summary class="btn" style="list-style:none">答えを表示する</summary><div class="ans-big">${p.secret.map(x=>`<span>${x}</span>`).join('')}</div></details>
<h2>決め手の一手</h2><p>${esc(key.msg)}</p>
<h2>全手順</h2><p class="small muted">緑の枠が、その手順で変わったマスです。●確定　×その桁には来ない　―答えに入らない</p>
<div class="steps">${s.steps.map((x,i)=>`<div class="step"><p><span class="sn">${i+1}.</span>${esc(x.msg)}</p>${grid(x)}</div>`).join('')}</div>
${adSlot()}<p class="row" style="justify-content:flex-start;margin-top:20px"><a class="btn" href="${LINKS==='file'?'../index.html':'/'+'puzzle/'+d+'/'}">この問題で遊ぶ</a><a class="btn y" href="${LINKS==='file'?rel(dir,''):'/'}">今日の問題へ</a></p>`}));}
// 過去問
{const byM={};dates.slice().reverse().forEach(d=>{(byM[d.slice(0,7)]=byM[d.slice(0,7)]||[]).push(d)});
 const L=to=>LINKS==='file'?rel('archive',to):'/'+to+'/';
 write('archive',layout('archive',{title:'過去問一覧｜今日の錠前',desc:'これまでの今日の錠前の問題と解き方の一覧です。',nav:'archive',
  body:`<h1>過去問</h1><p class="muted small">解いた問題には印がつきます（この端末に記録）。</p>${Object.entries(byM).map(([m,ds])=>`<section class="month"><h2>${m.replace('-','年')}月</h2><ul class="days">${ds.map(d=>{const st=C.solution(C.daily(d).cl).steps.length;return `<li data-date="${d}"><a href="${L('puzzle/'+d)}">No.${pad3(C.numOf(d))}</a><span>${d.slice(5).replace('-','/')} <span class="stars">${stars(st)}</span> <span class="solved"></span></span>${d<TODAY?`<a class="small" href="${L('puzzle/'+d+'/answer')}">解き方</a>`:'<span class="small muted">明日公開</span>'}</li>`}).join('')}</ul></section>`).join('')}
<script>try{const s=JSON.parse(localStorage.getItem('jomae-site-v1')||'{}').days||{};document.querySelectorAll('.days li').forEach(li=>{const d=s[li.dataset.date];if(d&&d.done)li.querySelector('.solved').textContent=d.won?'解錠済み':'挑戦済み'})}catch(e){}</script>`}));}
// 練習
write('practice',layout('practice',{title:'練習問題｜今日の錠前',desc:'何問でも解ける今日の錠前の練習問題。どれも仮定なしで解けて、解き方つきです。',nav:'practice',game:true,
  body:`<div id="game" data-mode="practice" data-root="${rootOf('practice')}" data-links="${LINKS}"></div>`}));
// 記録と称号
write('record',layout('record',{title:'記録と称号｜今日の錠前',desc:'今日の錠前の自分の記録、称号、バッジ。',nav:'record',rec:true,noindex:true,
  body:`<h1>記録と称号</h1><div id="records"><p class="muted">記録を読み込んでいます。</p></div>`}));
// 遊び方とコツ
{const ex=C.gen(424242);const s=C.solution(ex.cl);
 write('guide',layout('guide',{title:'遊び方と解き方のコツ｜今日の錠前',desc:'今日の錠前のルール、メモ表の使い方、仮定を使わずに解くための4つのコツを例題で解説します。',nav:'guide',
  body:`<article class="prose"><h1>遊び方と解き方のコツ</h1>
<p>手がかりから<b>4桁の暗証番号</b>を推理するパズルです。4つの数字はすべてちがいます。手がかりには、ためしに入れた番号と、その判定が書いてあります。</p>
<ul><li><span class="pip h"></span> <b>位置も正しい</b>：数字が答えに入っていて、場所も同じ</li><li><span class="pip b"></span> <b>位置ちがい</b>：数字は答えに入っているが、場所がちがう</li></ul>
<p>判定は個数だけで、どの数字が当たっているかは教えてくれません。チャンスは6回。外れた番号の判定も、新しい手がかりとして加わります。問題は毎日0時（日本時間）に変わります。</p>
<h2>メモ表の使い方</h2><p>マスをタップすると「空 → × → ●」と切り替わります。×はその桁に来ない、●はその桁で確定。上の数字をタップすると「消す（答えに入らない）→ 必ず入る → 戻す」と切り替わります。</p>
<h2>解き方の4つのコツ</h2><ol><li><b>●のない手がかりから×をつける。</b>その番号の数字は、どれもその場所には来ません。</li><li><b>○のない手がかりは「入るなら同じ場所」。</b>その中で答えに入る数字は、手がかりと同じ場所にしかありません。</li><li><b>●と○の合計を数える。</b>合計は、その番号の中で答えに入る数字の数です。わかった数字で埋まったら残りは消し、残りの候補が合計とちょうど同じなら全部入ります。</li><li><b>表で1つに絞る。</b>入れる数字が1つだけになった桁は、そこで決まりです。</li></ol>
<p>どの問題も、この4つの組み合わせだけで解けます。「もし〇〇だとすると矛盾する」という仮定は必要ありません。</p>
<h2>例題</h2></article><div class="plates">${ex.cl.map(plate).join('')}</div>
<div class="steps">${s.steps.map((x,i)=>`<div class="step"><p><span class="sn">${i+1}.</span>${esc(x.msg)}</p>${grid(x)}</div>`).join('')}</div>
<p style="margin-top:14px">答えは <b style="font-weight:400;color:var(--yel);font-size:22px;letter-spacing:.1em">${ex.secret.join('')}</b> です。</p>
<p class="row" style="justify-content:flex-start"><a class="btn y" href="${LINKS==='file'?rel('guide',''):'/'}">今日の問題を解く</a><a class="btn" href="${LINKS==='file'?rel('guide','practice'):'/practice/'}">練習問題</a></p>`}));}
// 運営者情報・ホーム画面に追加
write('about',layout('about',{title:'運営者情報｜今日の錠前',desc:'今日の錠前の運営者情報と、ホーム画面に追加する方法。',
  body:`<article class="prose"><h1>運営者情報</h1><p>サイト名：今日の錠前<br>運営者：${PH(CFG.operator,'運営者名')}<br>お問い合わせ：<a href="${LINKS==='file'?rel('about','contact'):'/contact/'}">お問い合わせページ</a></p>
<p>今日の錠前は、毎日1問の暗証番号推理パズルです。問題と解き方はプログラムで作成し、すべての問題で答えがただ1つに決まること、仮定を使わずに解けることを確認しています。</p>
<h2>ホーム画面に追加する</h2><p>ホーム画面に追加すると、アプリのようにアイコンから開けます。</p><ul><li><b>iPhone（Safari）</b>：画面下の共有ボタン → 「ホーム画面に追加」</li><li><b>Android（Chrome）</b>：右上のメニュー → 「ホーム画面に追加」または「アプリをインストール」</li></ul></article>`}));
// プライバシーポリシー
write('privacy',layout('privacy',{title:'プライバシーポリシー｜今日の錠前',desc:'今日の錠前のプライバシーポリシー。',
  body:`<article class="prose"><h1>プライバシーポリシー</h1><p>${PH(CFG.operator,'運営者名')}（以下「運営者」）は、今日の錠前（以下「本サイト」）における利用者の情報の取り扱いを、次のとおり定めます。</p>
<h2>1. 端末に保存する情報</h2><p>本サイトは、遊んだ記録（解いた日、入力した番号、メモ表、連続記録）を、利用者のブラウザ内（ローカルストレージ）にだけ保存します。これらの情報が運営者に送られることはありません。ブラウザの設定から削除できます。</p>
<h2>2. アクセス解析</h2><p>本サイトは、利用状況の把握のためにアクセス解析ツール（${PH(CFG.analyticsName,'使用するツール名')}）を使う場合があります。ページの閲覧情報が、ツールの提供者に送られます。個人を特定する情報は含みません。</p>
<h2>3. 広告</h2><p>本サイトは、第三者配信の広告サービス（Google アドセンス）を利用する場合があります。広告配信事業者は、利用者の興味に応じた広告を表示するためにCookieを使うことがあります。Cookieを無効にする方法や、Google アドセンスの詳細は、<a href="https://policies.google.com/technologies/ads?hl=ja" rel="noopener" target="_blank">Googleの広告に関するポリシー</a>をご覧ください。</p>
<h2>4. 外部に送信される情報</h2><p>上記2・3のツールを利用する場合、閲覧したページのURL、ブラウザの種類、Cookieなどの識別子が、各事業者に送信されます。送信先と利用目的は各事業者のポリシーに従います。</p>
<h2>5. お問い合わせ</h2><p>本ポリシーに関するお問い合わせは、<a href="${LINKS==='file'?rel('privacy','contact'):'/contact/'}">お問い合わせページ</a>からお願いします。</p>
<p class="small muted">制定日：${START.replace(/-/g,'/')}</p></article>`}));
// お問い合わせ
write('contact',layout('contact',{title:'お問い合わせ｜今日の錠前',desc:'今日の錠前へのお問い合わせ。',
  body:`<article class="prose"><h1>お問い合わせ</h1><p>ご意見・不具合のご報告は、次のメールアドレスまでお寄せください。</p><p><b style="user-select:all">${PH(CFG.contactEmail,'連絡先メールアドレス')}</b></p><p class="small muted">お返事までお時間をいただくことがあります。</p></article>`}));
// 共通ファイル
for(const f of ['style.css','game.js','core.js','records.js'])fs.copyFileSync(path.join(__dirname,'src',f),path.join(OUT,f));
fs.writeFileSync(path.join(OUT,'config.js'),'window.JOMAE_CONFIG='+JSON.stringify({siteUrl:CFG.siteUrl,startDate:START,bookUrl:CFG.bookUrl,bookTitle:CFG.bookTitle,adsenseClient:CFG.adsenseClient,adsenseSlot:CFG.adsenseSlot})+';\n');
fs.cpSync(path.join(__dirname,'static'),OUT,{recursive:true});
// サイトマップ
if(CFG.siteUrl){const u=CFG.siteUrl.replace(/\/$/,'');const urls=['','archive/','practice/','guide/','about/'].concat(dates.map(d=>`puzzle/${d}/`)).concat(dates.filter(d=>d<TODAY).map(d=>`puzzle/${d}/answer/`));
  fs.writeFileSync(path.join(OUT,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x=>`<url><loc>${u}/${x}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${u}/sitemap.xml\n`);}
console.log(`built ${OUT}: today=${TODAY}, puzzles=${dates.length}, answers=${dates.filter(d=>d<TODAY).length}, links=${LINKS}`);
