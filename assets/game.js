/* ---------------- screen router ---------------- */
const screens=[...document.querySelectorAll('.screen')];
const chips=document.getElementById('chips');
screens.forEach(s=>{
  const b=document.createElement('button');
  b.className='chip'; b.textContent=s.dataset.name; b.onclick=()=>go(s.id);
  chips.appendChild(b);
});
function go(id){
  screens.forEach(s=>s.classList.toggle('on', s.id===id));
  [...chips.children].forEach((c,i)=>c.classList.toggle('on', screens[i].id===id));
  document.querySelectorAll('.ov').forEach(o=>o.classList.remove('on'));
  if(id==='s-game') startLevel();
  if(id==='s-map') buildMap();
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-go]'); if(t){ blip(660,.05); go(t.dataset.go); }
});
document.getElementById('s-splash').onclick=()=>go('s-login');
go('s-splash');
[...chips.children][0].classList.add('on');

/* ---------------- splash sprinkles ---------------- */
const sp=document.getElementById('sprinkles');
const sColors=['#E02B45','#4E3AA8','#8CC63F','#FFC93C','#7A4A2B','#FF9CC3'];
for(let i=0;i<26;i++){
  const d=document.createElement('div'); d.className='sprinkle';
  const w=4+Math.random()*7;
  d.style.cssText=`width:${w}px;height:${w*(Math.random()>.5?1:2.2)}px;left:${Math.random()*100}%;top:${-Math.random()*400}px;background:${sColors[i%6]};animation-duration:${5+Math.random()*6}s;animation-delay:${-Math.random()*8}s`;
  sp.appendChild(d);
}

/* ---------------- level map ---------------- */
function swirlPoint(t){
  const cx=180, baseY=506, topY=112, TURNS=3.05;
  const a=-Math.PI/2 + t*TURNS*2*Math.PI;
  const rx=100*(1-t*0.80);
  const ry=27*(1-t*0.55);
  return {
    x: cx + rx*Math.cos(a),
    y: baseY - t*(baseY-topY) + ry*Math.sin(a),
    r: 36*(1-t*0.74),
    front: Math.sin(a)
  };
}
function buildMap(){
  const host=document.getElementById('swirlMap'); if(host.dataset.built) return; host.dataset.built=1;

  let blobs='';
  for(let i=0;i<=190;i++){
    const p=swirlPoint(i/190);
    blobs+=`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="url(#swg)" stroke="#EFD9E3" stroke-width="1" stroke-opacity=".5"/>`;
  }
  host.innerHTML=`
  <svg viewBox="0 0 360 640" width="360" height="640">
    <defs>
      <radialGradient id="swg" cx="34%" cy="28%" r="78%">
        <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F0D8E4"/>
      </radialGradient>
      <linearGradient id="cup" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#F6E5EC"/><stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EBD3DE"/>
      </linearGradient>
    </defs>
    <ellipse cx="180" cy="612" rx="108" ry="16" fill="#8A0B44" opacity=".14"/>
    ${blobs}
    <path d="M74 500h212l-20 96a16 16 0 0 1-16 13H110a16 16 0 0 1-16-13z" fill="url(#cup)" stroke="#E4C7D5" stroke-width="2"/>
    <ellipse cx="180" cy="500" rx="106" ry="15" fill="#FFFFFF" stroke="#E4C7D5" stroke-width="2"/>
    <text x="180" y="558" text-anchor="middle" font-family="Baloo 2, sans-serif" font-size="19" font-weight="800" fill="#C10F5E">Yogurtland</text>
    <text x="180" y="574" text-anchor="middle" font-family="Poppins, sans-serif" font-size="9" font-weight="700" fill="#8CC63F">get real.</text>
  </svg>`;

  const toppings=[[0.10,'🍓',22],[0.24,'🫐',18],[0.38,'🥝',20],[0.52,'🍫',17],[0.66,'🥭',16],[0.80,'🍥',14]];
  toppings.forEach(([t,e,s])=>{
    const p=swirlPoint(t+0.055);
    const d=document.createElement('div'); d.className='topping';
    d.style.cssText=`left:${p.x-46*(1-t*.7)}px;top:${p.y+4}px;font-size:${s}px`;
    d.textContent=e; host.appendChild(d);
  });

  for(let i=0;i<7;i++){
    const lvl=i+1, t=0.055+i*0.142, p=swirlPoint(t);
    const state = lvl<4?'done' : lvl===4?'now':'lock';
    const n=document.createElement('div');
    n.className='node '+state;
    n.style.left=p.x+'px'; n.style.top=p.y+'px';
    const sc=1-t*0.22; n.style.scale=sc;
    n.textContent = state==='lock' ? '🔒' : lvl;
    if(state!=='lock') n.onclick=()=>go('s-game');
    host.appendChild(n);

    const st=document.createElement('div'); st.className='stars';
    st.style.left=p.x+'px'; st.style.top=(p.y+30*sc)+'px';
    st.style.fontSize=(12*sc)+'px';
    st.textContent = state==='done' ? '⭐⭐⭐' : state==='now' ? '' : '☆☆☆';
    st.style.opacity = state==='lock' ? .35 : 1;
    host.appendChild(st);

    if(lvl===5||lvl===7){
      const g=document.createElement('div'); g.className='gift';
      g.style.left=(p.x + (p.x<180?-44:44))+'px'; g.style.top=p.y+'px'; g.textContent='🎁';
      host.appendChild(g);
    }
    if(state==='now'){
      const y=document.createElement('div'); y.className='youhere';
      y.style.left=(p.x + (p.x<180?66:-66))+'px'; y.style.top=(p.y-2)+'px';
      y.textContent='YOU ARE HERE';
      host.appendChild(y);
    }
  }
  const tip=swirlPoint(1);
  const cherry=document.createElement('div'); cherry.className='gift';
  cherry.style.cssText=`left:${tip.x}px;top:${tip.y-16}px;font-size:26px`;
  cherry.textContent='🍒'; host.appendChild(cherry);
  const flag=document.createElement('div'); flag.className='tipflag';
  flag.style.cssText=`left:${tip.x}px;top:${tip.y-48}px`;
  flag.textContent='FREE CUP · LEVEL 12'; host.appendChild(flag);
}
document.getElementById('homeProg').style.width='62%';

/* ---------------- sound (tiny) ---------------- */
let actx=null;
function blip(freq,dur=.08,type='sine',vol=.05){
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(), g=actx.createGain();
    o.type=type; o.frequency.value=freq; g.gain.value=vol;
    o.connect(g); g.connect(actx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime+dur);
    o.stop(actx.currentTime+dur+.02);
  }catch(e){}
}

/* ---------------- feedback helpers ---------------- */
function buzz(ms){ try{ navigator.vibrate && navigator.vibrate(ms) }catch(e){} }
function flashScreen(){
  const f=document.getElementById('flash');
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
function showBanner(txt){
  const b=document.getElementById('banner');
  b.textContent=txt; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
}
function shockwave(hits){
  const s=cell();
  const mx=hits.reduce((a,t)=>a+t.c,0)/hits.length*s + s/2;
  const my=hits.reduce((a,t)=>a+t.r,0)/hits.length*s + s/2;
  const w=document.createElement('div'); w.className='wave';
  w.style.left=mx+'px'; w.style.top=my+'px'; w.style.width=w.style.height='20px';
  board.appendChild(w);
  w.animate([{width:'20px',height:'20px',opacity:.85},{width:(s*3.4)+'px',height:(s*3.4)+'px',opacity:0}],
            {duration:480,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=()=>w.remove();
}
function flyToGoal(t, delay){
  const phone=document.getElementById('phone'), pr=phone.getBoundingClientRect();
  const tr=t.el.getBoundingClientRect();
  const target=document.querySelector('.hud .goal em').getBoundingClientRect();
  const f=document.createElement('div'); f.className='flyer'; f.textContent=TYPES[t.type].e;
  f.style.left=(tr.left-pr.left+tr.width/2)+'px';
  f.style.top=(tr.top-pr.top+tr.height/2)+'px';
  phone.appendChild(f);
  const dx=target.left-tr.left+(target.width-tr.width)/2;
  const dy=target.top-tr.top+(target.height-tr.height)/2;
  f.animate([
    {transform:'translate(-50%,-50%) scale(1)'},
    {transform:`translate(calc(-50% + ${dx*0.4}px), calc(-50% + ${dy*0.4-46}px)) scale(1.3)`, offset:.45},
    {transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.4)`, opacity:.85}
  ],{duration:620, delay:delay||0, fill:'backwards', easing:'cubic-bezier(.45,0,.25,1)'})
   .onfinish=()=>{ f.remove(); popGoal(); };
}
function popGoal(){
  const pill=document.getElementById('goalLeft').closest('.pill');
  pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
  blip(980,.05,'sine',.035);
}
let shownScore=0, rollRaf=null;
function rollScore(){
  cancelAnimationFrame(rollRaf);
  const el=document.getElementById('scoreVal');
  const step=()=>{
    const d=score-shownScore;
    if(Math.abs(d)<1.2) shownScore=score; else shownScore+=d*0.2;
    el.textContent=Math.round(shownScore).toLocaleString();
    if(shownScore!==score) rollRaf=requestAnimationFrame(step);
  };
  step();
}
/* hints + deadlock */
let hintTimer=null, hinted=[];
function clearHint(){
  hinted.forEach(t=>t.el.classList.remove('hint')); hinted=[];
  if(hintTimer){clearTimeout(hintTimer); hintTimer=null}
}
function scheduleHint(){
  clearHint();
  hintTimer=setTimeout(()=>{
    const m=findMove(); if(!m) return;
    hinted=m; m.forEach(t=>t.el.classList.add('hint'));
  }, 4500);
}
function findMove(){
  for(let r=0;r<R;r++) for(let c=0;c<C;c++){
    for(const [dr,dc] of [[0,1],[1,0]]){
      const r2=r+dr, c2=c+dc; if(r2>=R||c2>=C) continue;
      const a=grid[r][c], b=grid[r2][c2]; if(!a||!b) continue;
      grid[r][c]=b; grid[r2][c2]=a;
      const ok=matchesAt(grid).length>0;
      grid[r][c]=a; grid[r2][c2]=b;
      if(ok) return [a,b];
    }
  }
  return null;
}
async function shuffleBoard(){
  const types=[]; for(let r=0;r<R;r++)for(let c=0;c<C;c++) types.push(grid[r][c].type);
  do{ types.sort(()=>Math.random()-.5) }while(false);
  let i=0;
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    const o=grid[r][c], t=TYPES[types[i++]];
    o.type=TYPES.indexOf(t);
    o.el.querySelector('.body').style.background=`radial-gradient(circle at 32% 26%, ${t.a}, ${t.b} 78%)`;
    o.el.querySelector('em').textContent=t.e;
    o.el.animate([{rotate:'0deg'},{rotate:'360deg'}],{duration:430,delay:(r+c)*12});
  }
  blip(700,.18,'sawtooth',.04); buzz(20);
  await sleep(560);
}

/* ---------------- match-3 ---------------- */
const C=8,R=8;
const TYPES=[
  {k:'straw', e:'🍓', a:'#FF8A9A', b:'#D31E3C'},
  {k:'blue',  e:'🫐', a:'#8FA0FF', b:'#2E3C93'},
  {k:'kiwi',  e:'🥝', a:'#C6EC7C', b:'#5C8C1E'},
  {k:'mango', e:'🥭', a:'#FFD97A', b:'#E08A00'},
  {k:'choco', e:'🍫', a:'#C89A6B', b:'#6B3E1D'},
  {k:'mochi', e:'🍥', a:'#FFE3EE', b:'#E8A9C4'}
];
const board=document.getElementById('board');
let grid=[], busy=false, sel=null, moves=18, goal=15, score=0, armed=null;
let boosters={shuffle:3,bomb:2,hammer:1};
const TARGET=6000;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cell=()=>board.clientWidth/C;

function makeTile(type){
  const t=TYPES[type];
  const el=document.createElement('div');
  el.className='tile';
  el.innerHTML=`<span class="body" style="background:radial-gradient(circle at 32% 26%, ${t.a}, ${t.b} 78%)"></span><span class="gloss"></span><em>${t.e}</em>`;
  board.appendChild(el);
  return {type, el};
}
function place(o,r,c,instant){
  const s=cell(), pad=s*0.07;
  o.el.style.width=o.el.style.height=(s-pad*2)+'px';
  o.el.style.fontSize=(s*0.44)+'px';
  if(instant) o.el.style.transition='none';
  o.el.style.transform=`translate(${c*s+pad}px, ${r*s+pad}px)`;
  if(instant) requestAnimationFrame(()=>o.el.style.transition='');
  o.r=r; o.c=c;
}
function matchesAt(g){
  const hit=new Set();
  for(let r=0;r<R;r++) for(let c=0;c<C-2;c++){
    const a=g[r][c],b=g[r][c+1],d=g[r][c+2];
    if(a&&b&&d&&a.type===b.type&&b.type===d.type){
      let k=c; while(k<C&&g[r][k]&&g[r][k].type===a.type){hit.add(g[r][k]);k++}
    }
  }
  for(let c=0;c<C;c++) for(let r=0;r<R-2;r++){
    const a=g[r][c],b=g[r+1][c],d=g[r+2][c];
    if(a&&b&&d&&a.type===b.type&&b.type===d.type){
      let k=r; while(k<R&&g[k][c]&&g[k][c].type===a.type){hit.add(g[k][c]);k++}
    }
  }
  return [...hit];
}
function buildBoard(){
  board.innerHTML='';
  grid=[];
  for(let r=0;r<R;r++){
    grid[r]=[];
    for(let c=0;c<C;c++){
      let t, tries=0;
      do{ t=Math.floor(Math.random()*TYPES.length); tries++;
        grid[r][c]={type:t};
      }while(tries<20 && quickBad(r,c));
      grid[r][c]=makeTile(t);
      place(grid[r][c],r,c,true);
      grid[r][c].el.dataset.r=r; grid[r][c].el.dataset.c=c;
    }
  }
}
function quickBad(r,c){
  const t=grid[r][c].type;
  if(c>=2&&grid[r][c-1]&&grid[r][c-2]&&grid[r][c-1].type===t&&grid[r][c-2].type===t) return true;
  if(r>=2&&grid[r-1][c]&&grid[r-2][c]&&grid[r-1][c].type===t&&grid[r-2][c].type===t) return true;
  return false;
}
function startLevel(){
  moves=18; goal=15; score=0; sel=null; busy=false; armed=null;
  boosters={shuffle:3,bomb:2,hammer:1};
  shownScore=0; clearHint();
  buildBoard(); syncHud();
  document.querySelectorAll('.ov').forEach(o=>o.classList.remove('on'));
  document.querySelectorAll('.st').forEach(s=>s.classList.remove('on','burst'));
  scheduleHint();
}
function litStar(id,on){
  const el=document.getElementById(id);
  if(on && !el.classList.contains('on')){
    el.classList.add('on','burst'); blip(1200,.12,'triangle',.05);
    setTimeout(()=>el.classList.remove('burst'),560);
  }
}
function syncHud(){
  const mv=document.getElementById('movesLeft');
  mv.textContent=moves;
  mv.closest('.pill').classList.toggle('warn', moves<=5 && goal>0);
  document.getElementById('goalLeft').textContent='x'+Math.max(0,goal);
  rollScore();
  const p=Math.min(100, score/TARGET*100);
  document.getElementById('scoreFill').style.width=p+'%';
  litStar('st1', p>=33); litStar('st2', p>=66); litStar('st3', p>=97);
  cShuffle.textContent=boosters.shuffle; cBomb.textContent=boosters.bomb; cHammer.textContent=boosters.hammer;
  boShuffle.classList.toggle('off',!boosters.shuffle);
  boBomb.classList.toggle('off',!boosters.bomb);
  boHammer.classList.toggle('off',!boosters.hammer);
}

/* input: click or swipe */
let down=null;
board.addEventListener('pointerdown',e=>{
  const el=e.target.closest('.tile'); if(!el||busy) return;
  clearHint();
  const o=find(el); if(!o) return;
  down={o,x:e.clientX,y:e.clientY};
  if(armed){ useArmed(o); down=null; return; }
  if(sel && sel!==o && adjacent(sel,o)){ const a=sel; clearSel(); trySwap(a,o); down=null; return; }
  clearSel(); sel=o; o.el.classList.add('sel');
});
board.addEventListener('pointerup',e=>{
  if(!down||busy){down=null;return}
  const dx=e.clientX-down.x, dy=e.clientY-down.y;
  if(Math.abs(dx)>16||Math.abs(dy)>16){
    const o=down.o;
    let r=o.r,c=o.c;
    if(Math.abs(dx)>Math.abs(dy)) c+= dx>0?1:-1; else r+= dy>0?1:-1;
    if(grid[r]&&grid[r][c]){ clearSel(); trySwap(o,grid[r][c]); }
  }
  down=null;
});
function find(el){ for(let r=0;r<R;r++)for(let c=0;c<C;c++) if(grid[r][c]&&grid[r][c].el===el) return grid[r][c]; }
function adjacent(a,b){ return Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1 }
function clearSel(){ if(sel){sel.el.classList.remove('sel'); sel=null} }

async function trySwap(a,b){
  busy=true; blip(520,.06);
  swapCells(a,b); place(a,a.r,a.c); place(b,b.r,b.c);
  await sleep(190);
  if(matchesAt(grid).length===0){
    swapCells(a,b); place(a,a.r,a.c); place(b,b.r,b.c);
    shake(); blip(180,.12,'square',.04);
    await sleep(200); busy=false; return;
  }
  moves--; syncHud();
  await resolve();
  busy=false; checkEnd();
}
function swapCells(a,b){
  const ar=a.r,ac=a.c;
  grid[a.r][a.c]=b; grid[b.r][b.c]=a;
  a.r=b.r; a.c=b.c; b.r=ar; b.c=ac;
}

async function resolve(){
  let combo=0;
  while(true){
    const hits=matchesAt(grid);
    if(!hits.length) break;
    combo++;
    if(combo>1) showCombo(combo);
    const straws=hits.filter(t=>TYPES[t.type].k==='straw');
    const wasOpen=goal>0;
    goal-=straws.length;
    const pts=hits.length*40*combo;
    score+=pts;
    blip(440+combo*110,.09,'triangle',.05);
    buzz(combo>=3?26:10);
    if(combo>=3){ flashScreen(); shake(); }
    shockwave(hits);
    straws.forEach((t,i)=>flyToGoal(t, i*70));
    if(wasOpen && goal<=0) setTimeout(()=>{ showBanner('GOAL COMPLETE!'); blip(1320,.2,'triangle',.06) }, 260);
    popTiles(hits, pts);
    hits.forEach(t=>{ grid[t.r][t.c]=null; });
    syncHud();
    await sleep(230);
    hits.forEach(t=>t.el.remove());
    dropAndFill();
    await sleep(240);
  }
}
function popTiles(hits, pts){
  hits.forEach(t=>{
    t.el.classList.add('pop');
    const s=cell();
    for(let i=0;i<4;i++){
      const p=document.createElement('div'); p.className='spark';
      p.style.left=(t.c*s+s/2)+'px'; p.style.top=(t.r*s+s/2)+'px';
      p.style.background=TYPES[t.type].a;
      board.appendChild(p);
      const ang=Math.random()*6.28, d=18+Math.random()*22;
      p.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},
                 {transform:`translate(${Math.cos(ang)*d-6}px, ${Math.sin(ang)*d-6}px) scale(0)`,opacity:0}],
                {duration:420,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>p.remove();
    }
  });
  const f=hits[0], s=cell();
  const lab=document.createElement('div'); lab.className='float';
  lab.style.left=(f.c*s+s/2)+'px'; lab.style.top=(f.r*s)+'px'; lab.textContent='+'+pts;
  board.appendChild(lab); setTimeout(()=>lab.remove(),800);
}
function landBounce(o,d){
  setTimeout(()=>{
    if(!o.el.isConnected) return;
    o.el.classList.add('land');
    setTimeout(()=>o.el.classList.remove('land'),300);
  }, 200+d);
}
function dropAndFill(){
  for(let c=0;c<C;c++){
    let write=R-1, moved=0;
    for(let r=R-1;r>=0;r--){
      if(grid[r][c]){
        if(write!==r){
          grid[write][c]=grid[r][c]; grid[r][c]=null;
          place(grid[write][c],write,c); landBounce(grid[write][c], moved++*18);
        }
        write--;
      }
    }
    for(let r=write;r>=0;r--){
      const o=makeTile(Math.floor(Math.random()*TYPES.length));
      place(o, r-R, c, true);
      grid[r][c]=o;
      requestAnimationFrame(()=>place(o,r,c));
      landBounce(o, moved++*18);
    }
  }
}
function showCombo(n){
  const el=document.getElementById('combo');
  el.textContent = n>=4 ? 'YUM! x'+n : n===3 ? 'SWEET! x3' : 'COMBO x2';
  el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
}
function shake(){ const p=document.getElementById('phone'); p.classList.add('shake'); setTimeout(()=>p.classList.remove('shake'),340) }

async function checkEnd(){
  clearHint();
  if(goal<=0){ setTimeout(levelClear,760); return; }
  if(moves<=0){
    document.getElementById('failLeft').textContent=goal;
    blip(160,.4,'sawtooth',.05); buzz([30,60,30]);
    setTimeout(()=>document.getElementById('ovFail').classList.add('on'),380);
    return;
  }
  if(!findMove()){
    busy=true; showBanner('NO MOVES — SHUFFLING');
    await sleep(400); await shuffleBoard(); await resolve(); busy=false;
  }
  if(moves===5||moves===3) showBanner(moves+' MOVES LEFT!');
  if(moves<=3) buzz(18);
  scheduleHint();
}
function levelClear(){
  const stars = score>=TARGET?3 : score>=TARGET*.66?2 : 1;
  const row=document.getElementById('clearStars');
  [...row.children].forEach((s,i)=>s.classList.toggle('on', i<stars));
  document.getElementById('clearScore').textContent=score.toLocaleString();
  document.getElementById('clearMsg').textContent = stars===3
    ? 'Perfect run. Two levels to your free topping.'
    : 'Level cleared. Two levels to your free topping.';
  document.getElementById('ovClear').classList.add('on');
  confettiBurst();
  [880,1100,1320].forEach((f,i)=>setTimeout(()=>blip(f,.14,'triangle',.05), i*130));
}
function confettiBurst(){
  const box=document.getElementById('confetti');
  const cols=['#FFC93C','#C10F5E','#A8D84B','#FF8FB8','#FFFFFF','#8FA0FF'];
  for(let i=0;i<70;i++){
    const d=document.createElement('div'); d.className='conf';
    d.style.left=Math.random()*100+'%'; d.style.top='-20px';
    d.style.background=cols[i%cols.length];
    d.style.animationDuration=(1.6+Math.random()*1.6)+'s';
    d.style.animationDelay=(Math.random()*.5)+'s';
    box.appendChild(d); setTimeout(()=>d.remove(),3600);
  }
}
document.getElementById('retry').onclick=startLevel;
document.getElementById('boReset').onclick=startLevel;

/* boosters */
boShuffle.onclick=async()=>{
  if(!boosters.shuffle||busy) return;
  boosters.shuffle--; busy=true; clearHint(); syncHud();
  await shuffleBoard();
  await resolve(); busy=false; checkEnd();
};
boBomb.onclick=()=>arm('bomb', boBomb);
boHammer.onclick=()=>arm('hammer', boHammer);
function arm(k,btn){
  if(!boosters[k]||busy) return;
  document.querySelectorAll('.bo').forEach(b=>b.classList.remove('armed'));
  if(armed===k){armed=null; return}
  armed=k; btn.classList.add('armed'); clearSel();
}
async function useArmed(o){
  const k=armed; armed=null;
  document.querySelectorAll('.bo').forEach(b=>b.classList.remove('armed'));
  if(!boosters[k]) return;
  boosters[k]--; busy=true;
  let hits=[];
  if(k==='hammer'){ hits=[o]; blip(300,.1,'square',.05); }
  else{
    for(let r=o.r-1;r<=o.r+1;r++) for(let c=o.c-1;c<=o.c+1;c++)
      if(grid[r]&&grid[r][c]) hits.push(grid[r][c]);
    blip(110,.3,'sawtooth',.06); shake();
  }
  goal-=hits.filter(t=>TYPES[t.type].k==='straw').length;
  score+=hits.length*30;
  popTiles(hits, hits.length*30);
  hits.forEach(t=>grid[t.r][t.c]=null);
  syncHud(); await sleep(240);
  hits.forEach(t=>t.el.remove());
  dropAndFill(); await sleep(260);
  await resolve(); busy=false; checkEnd();
}

/* code inputs */
document.querySelectorAll('#code input').forEach((el,i,arr)=>{
  el.oninput=()=>{ if(el.value&&arr[i+1]) arr[i+1].focus(); };
});
window.addEventListener('resize',()=>{
  if(!grid.length) return;
  for(let r=0;r<R;r++)for(let c=0;c<C;c++) if(grid[r][c]) place(grid[r][c],r,c,true);
});
