/* ---------------- screen router ---------------- */
const screens=[...document.querySelectorAll('.screen')];
const LEVELS=[
  {n:1,name:'Berry Blast',mode:'collect',targetType:0,goal:15,moves:18,target:6000,types:6},
  {n:2,name:'Kiwi Rush',mode:'collect',targetType:2,goal:18,moves:20,target:7600,types:6},
  {n:3,name:'Chocolate Drop',mode:'collect',targetType:4,goal:20,moves:19,target:9000,types:6,reward:'off-3'},
  {n:4,name:'Mango Pop',mode:'collect',targetType:3,goal:22,moves:18,target:10600,types:6},
  {n:5,name:'Mochi Mix',mode:'collect',targetType:5,goal:24,moves:17,target:12400,types:6,reward:'off-5'},
  {n:6,name:'Score Sprint',mode:'score',goal:14000,moves:17,target:14000,types:6},
  {n:7,name:'Cup Finale',mode:'collect',targetType:0,goal:30,moves:16,target:16800,types:6,reward:'off-10'}
];
const REWARDS={
  'off-3':{title:'3% off your cup',short:'3% off',desc:'3% off any regular cup. Valid until Sep 30, 2026 at any Yogurtland store.',code:'YL-A8F92K',valid:'Valid until Sep 30, 2026',icon:'🥉'},
  'off-5':{title:'5% off your cup',short:'5% off',desc:'5% off any regular cup. Valid until Oct 31, 2026 at any Yogurtland store.',code:'YL-C7D34M',valid:'Valid until Oct 31, 2026',icon:'🥈'},
  'off-10':{title:'10% off your cup',short:'10% off',desc:'10% off any regular cup — you crushed the finale. Valid until Nov 30, 2026 at any Yogurtland store.',code:'YL-F9P21Q',valid:'Valid until Nov 30, 2026',icon:'🥇'}
};
const SAVE_KEY='froyo-crush-progress-v2';
let state=loadState();
let activeRewardId=null;
let justUnlockedReward=null;
let staffRewardId=null;

const GATED=new Set(['s-home','s-map','s-game','s-rewards','s-coupon','s-used','s-reward','s-staff','s-settings','s-history']);
function go(id){
  if(GATED.has(id) && !(state.auth&&state.auth.loggedIn)) id='s-login';
  screens.forEach(s=>s.classList.toggle('on', s.id===id));
  document.querySelectorAll('.ov').forEach(o=>o.classList.remove('on'));
  renderProgress();
  if(id==='s-rewards') renderRewards();
  if(id==='s-coupon') renderCoupon(activeRewardId);
  if(id==='s-used') redeemActiveCoupon();
  if(id==='s-reward') renderUnlockedReward();
  if(id==='s-login') syncAuthScreen();
  if(id==='s-staff') renderStaffReady();
  if(id==='s-settings') renderSettings();
  if(id==='s-history') renderHistory();
  if(id==='s-game') startLevel();
  if(id==='s-map') buildMap();
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-go]'); if(t){ blip(660,.05); go(t.dataset.go); }
});
document.getElementById('s-splash').onclick=()=>go((state.auth&&state.auth.loggedIn)?'s-home':'s-login');
go('s-splash');
applySettings();

function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
    return {
      currentLevel:saved.currentLevel||1,
      unlockedLevel:Math.max(1,saved.unlockedLevel||1),
      stars:saved.stars||{},
      rewards:saved.rewards||{},
      history:saved.history||[],
      seenTutorial:!!saved.seenTutorial,
      auth:(saved.auth&&saved.auth.code)?{code:String(saved.auth.code),loggedIn:!!saved.auth.loggedIn}:null,
      settings:Object.assign({sound:true,vibration:true,reducedMotion:false}, saved.settings||{})
    };
  }catch(e){
    return {currentLevel:1,unlockedLevel:1,stars:{},rewards:{},history:[],seenTutorial:false,auth:null,settings:{sound:true,vibration:true,reducedMotion:false}};
  }
}
function saveState(){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function applySettings(){ document.body.classList.toggle('reduce-motion', !!state.settings.reducedMotion); }
function addHistory(type,text){
  state.history=[{type,text,at:new Date().toISOString()},...(state.history||[])].slice(0,20);
  saveState();
}
function levelFor(n){ return LEVELS.find(l=>l.n===n) || LEVELS[LEVELS.length-1]; }
function currentLevel(){ return levelFor(Math.min(state.currentLevel, state.unlockedLevel)); }
function nextReward(){
  return LEVELS.find(l=>l.n>=state.unlockedLevel && l.reward && !state.rewards[l.reward]);
}
function isGoalComplete(){ return currentLevel().mode==='score' ? score>=targetScore : goal<=0; }
function goalHits(hits){
  const level=currentLevel();
  return level.mode==='collect' ? hits.filter(t=>t.type===level.targetType) : [];
}
function goalText(){
  const level=currentLevel();
  if(level.mode==='score') return Math.max(0,targetScore-score).toLocaleString();
  return 'x'+Math.max(0,goal);
}
function goalIcon(){
  const level=currentLevel();
  return level.mode==='score' ? '★' : TYPES[level.targetType].e;
}

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
function renderProgress(){
  const level=currentLevel();
  const reward=nextReward();
  document.getElementById('homeLevel').textContent=String(level.n).padStart(2,'0');
  document.getElementById('gameLevel').textContent=String(level.n).padStart(2,'0');
  document.getElementById('clearLevel').textContent='Level '+String(level.n).padStart(2,'0');
  if(reward){
    const remaining=Math.max(0,reward.n-state.unlockedLevel+1);
    const r=REWARDS[reward.reward];
    const segStart=LEVELS.reduce((m,l)=>(l.reward&&l.n<reward.n)?Math.max(m,l.n):m,0);
    const segTotal=Math.max(1,reward.n-segStart);
    const pct=Math.max(0,Math.min(100,(segTotal-remaining)/segTotal*100));
    document.getElementById('homeReward').innerHTML=(r.short||r.title).replace(' ','<br>')+' '+r.icon;
    document.getElementById('homeNote').innerHTML='Clear <b>'+remaining+' more level'+(remaining===1?'':'s')+'</b> to unlock it';
    document.getElementById('mapRewardTitle').textContent=r.title;
    document.getElementById('mapRewardNote').textContent='Clear '+remaining+' more level'+(remaining===1?'':'s');
    document.getElementById('homeProg').style.width=pct+'%';
  }else{
    document.getElementById('homeReward').innerHTML='All<br>claimed 🏆';
    document.getElementById('homeNote').innerHTML='All rewards unlocked';
    document.getElementById('mapRewardTitle').textContent='All rewards';
    document.getElementById('mapRewardNote').textContent='All rewards unlocked';
    document.getElementById('homeProg').style.width='100%';
  }
}

function buildMap(){
  const host=document.getElementById('swirlMap');
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

  const toppings=[[0.10,'🍓',22],[0.24,'🫐',18],[0.38,'🥝',20],[0.52,'🍫',17],[0.66,'🥭',16],[0.80,'🍡',14]];
  toppings.forEach(([t,e,s])=>{
    const p=swirlPoint(t+0.055);
    const d=document.createElement('div'); d.className='topping';
    d.style.cssText=`left:${p.x-46*(1-t*.7)}px;top:${p.y+4}px;font-size:${s}px`;
    d.textContent=e; host.appendChild(d);
  });

  LEVELS.forEach((level,i)=>{
    const lvl=level.n, t=0.055+i*0.142, p=swirlPoint(t);
    const nodeState = lvl===state.currentLevel?'now' : lvl<=state.unlockedLevel?'done':'lock';
    const n=document.createElement('div');
    n.className='node '+nodeState;
    n.style.left=p.x+'px'; n.style.top=p.y+'px';
    const sc=1-t*0.22; n.style.scale=sc;
    n.textContent = nodeState==='lock' ? '🔒' : lvl;
    if(nodeState!=='lock') n.onclick=()=>{ state.currentLevel=lvl; saveState(); go('s-game'); };
    host.appendChild(n);

    const st=document.createElement('div'); st.className='stars';
    st.style.left=p.x+'px'; st.style.top=(p.y+30*sc)+'px';
    st.style.fontSize=(12*sc)+'px';
    const earned=state.stars[lvl]||0;
    st.textContent = earned ? '★'.repeat(earned)+'☆'.repeat(3-earned) : nodeState==='now' ? '' : '☆☆☆';
    st.style.opacity = nodeState==='lock' ? .35 : 1;
    host.appendChild(st);

    if(level.reward){
      const g=document.createElement('div'); g.className='gift';
      g.style.left=(p.x + (p.x<180?-44:44))+'px'; g.style.top=p.y+'px'; g.textContent='🎁';
      host.appendChild(g);
    }
    if(nodeState==='now'){
      const y=document.createElement('div'); y.className='youhere';
      y.style.left=(p.x + (p.x<180?66:-66))+'px'; y.style.top=(p.y-2)+'px';
      y.textContent='YOU ARE HERE';
      host.appendChild(y);
    }
  });
}

function renderRewards(){
  const list=document.getElementById('rewardList');
  const earnedIds=Object.keys(state.rewards);
  const available=earnedIds.filter(id=>!state.rewards[id].used);
  const redeemed=earnedIds.filter(id=>state.rewards[id].used);
  document.getElementById('availableCount').textContent='AVAILABLE ('+available.length+')';
  document.getElementById('redeemedCount').textContent='REDEEMED ('+redeemed.length+')';
  if(!earnedIds.length){
    list.innerHTML='<div class="empty-state">Clear reward levels to unlock coupons.</div>';
    return;
  }
  list.innerHTML=earnedIds.map(id=>{
    const reward=REWARDS[id], used=state.rewards[id].used;
    return `
      <div class="rcard ${used?'used':''}">
        <div class="ic">${reward.icon}</div>
        <div style="flex:1">
          <h4>${reward.title}</h4>
          <small>${used?'Redeemed':reward.valid}</small>
          <code>${reward.code}</code>
        </div>
        <button class="use" data-reward="${id}" ${used?'disabled':''}>${used?'USED':'USE'}</button>
      </div>`;
  }).join('');
  list.querySelectorAll('[data-reward]').forEach(btn=>{
    btn.onclick=()=>{
      activeRewardId=btn.dataset.reward;
      go('s-coupon');
    };
  });
}
function renderUnlockedReward(){
  const id=justUnlockedReward || activeRewardId || Object.keys(state.rewards)[0];
  const reward=REWARDS[id];
  if(!reward) return;
  document.getElementById('rewardTitle').textContent=reward.title.toUpperCase();
  document.getElementById('rewardDesc').textContent=reward.desc;
}
function renderCoupon(id){
  const reward=REWARDS[id] || REWARDS[Object.keys(state.rewards)[0]];
  if(!reward) return;
  activeRewardId=Object.keys(REWARDS).find(key=>REWARDS[key]===reward) || activeRewardId;
  document.getElementById('couponTitle').textContent=reward.title.toUpperCase();
  document.getElementById('couponCode').textContent=reward.code;
  document.getElementById('couponValid').textContent=reward.valid;
  const saved=state.rewards[activeRewardId];
  document.getElementById('couponStatus').textContent=saved && saved.used ? 'Already redeemed' : 'Ready for staff scan';
}
function redeemActiveCoupon(){
  if(activeRewardId && state.rewards[activeRewardId]){
    const wasUsed=state.rewards[activeRewardId].used;
    state.rewards[activeRewardId].used=true;
    state.rewards[activeRewardId].usedAt=new Date().toISOString();
    if(!wasUsed) addHistory('redeem','Redeemed '+REWARDS[activeRewardId].title);
    saveState();
    renderUsedCoupon(activeRewardId);
  }
}
function renderUsedCoupon(id){
  const reward=REWARDS[id];
  if(!reward) return;
  const usedAt=state.rewards[id] && state.rewards[id].usedAt ? new Date(state.rewards[id].usedAt) : new Date();
  document.getElementById('usedTitle').textContent=reward.title.toUpperCase();
  document.getElementById('usedCode').textContent=reward.code;
  document.getElementById('usedDate').textContent='Redeemed '+usedAt.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})+' · '+usedAt.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
}
function rewardIdByCode(code){
  const clean=(code||'').trim().toUpperCase();
  return Object.keys(REWARDS).find(id=>REWARDS[id].code===clean);
}
function setStaffResult(kind,title,message){
  const box=document.getElementById('staffResult');
  box.classList.toggle('ok', kind==='ok');
  box.classList.toggle('bad', kind==='bad');
  box.querySelector('h4').textContent=title;
  box.querySelector('p').textContent=message;
}
function renderStaffReady(){
  staffRewardId=null;
  document.getElementById('staffRedeem').disabled=true;
  setStaffResult('', 'Ready to verify', 'Enter a coupon code from the customer screen.');
}
function checkStaffCode(){
  const code=document.getElementById('staffCode').value;
  const id=rewardIdByCode(code);
  staffRewardId=null;
  document.getElementById('staffRedeem').disabled=true;
  if(!id){
    setStaffResult('bad','Code not found','This coupon code is not recognized.');
    return;
  }
  if(!state.rewards[id]){
    setStaffResult('bad','Not unlocked yet',REWARDS[id].title+' has not been earned on this device.');
    return;
  }
  if(state.rewards[id].used){
    setStaffResult('bad','Already redeemed',REWARDS[id].title+' was already marked as used.');
    return;
  }
  staffRewardId=id;
  document.getElementById('staffRedeem').disabled=false;
  setStaffResult('ok','Valid coupon',REWARDS[id].title+' is available to redeem.');
}
function staffRedeemCoupon(){
  if(!staffRewardId || !state.rewards[staffRewardId]) return;
  state.rewards[staffRewardId].used=true;
  state.rewards[staffRewardId].usedAt=new Date().toISOString();
  addHistory('staff','Staff redeemed '+REWARDS[staffRewardId].title);
  saveState();
  setStaffResult('ok','Redeemed',REWARDS[staffRewardId].title+' is now marked as used.');
  document.getElementById('staffRedeem').disabled=true;
  activeRewardId=staffRewardId;
  renderRewards();
}
function renderSettings(){
  document.getElementById('setSound').checked=!!state.settings.sound;
  document.getElementById('setVibration').checked=!!state.settings.vibration;
  document.getElementById('setMotion').checked=!!state.settings.reducedMotion;
  const signedIn=!!(state.auth&&state.auth.code);
  document.getElementById('settingsCode').textContent=signedIn?state.auth.code:'Not signed in';
  document.getElementById('logOut').hidden=!(state.auth&&state.auth.loggedIn);
  applySettings();
}

/* ---------------- sign in / log in ---------------- */
let authTab='signin';
function syncAuthScreen(){
  authTab=(state.auth&&state.auth.code)?'login':'signin';
  renderAuthTab();
}
function renderAuthTab(){
  const signup=authTab==='signin';
  document.getElementById('tabSignin').classList.toggle('on',signup);
  document.getElementById('tabLogin').classList.toggle('on',!signup);
  document.getElementById('authHint').textContent=signup
    ? "Create a 6-digit code you'll remember"
    : 'Enter your 6-digit player code';
  document.getElementById('authSubmit').textContent=signup?'CREATE PLAYER':'LOG IN';
  document.getElementById('authError').textContent='';
  const inputs=[...document.querySelectorAll('#code input')];
  inputs.forEach(el=>el.value='');
  inputs[0].focus();
}
function authCode(){
  return [...document.querySelectorAll('#code input')].map(el=>el.value.replace(/\D/g,'')).join('');
}
function submitAuth(){
  const code=authCode();
  const err=document.getElementById('authError');
  if(code.length!==6){ err.textContent='Enter all 6 digits.'; return; }
  if(authTab==='signin'){
    state.auth={code,loggedIn:true};
    saveState(); blip(880,.12,'triangle',.05); go('s-home');
  }else if(state.auth&&state.auth.code===code){
    state.auth.loggedIn=true;
    saveState(); blip(880,.12,'triangle',.05); go('s-home');
  }else{
    err.textContent='No player found with that code.';
  }
}
function logOut(){
  if(state.auth) state.auth.loggedIn=false;
  saveState();
  go('s-login');
}
function updateSetting(key,value){
  state.settings[key]=value;
  saveState();
  applySettings();
  document.getElementById('settingsNote').textContent='Settings saved on this device.';
}
function resetProgress(){
  state={currentLevel:1,unlockedLevel:1,stars:{},rewards:{},history:[],seenTutorial:false,auth:state.auth,settings:state.settings};
  activeRewardId=null;
  justUnlockedReward=null;
  staffRewardId=null;
  saveState();
  renderProgress();
  renderRewards();
  renderSettings();
  document.getElementById('settingsNote').textContent='Progress reset. Settings were kept.';
}
function renderHistory(){
  const list=document.getElementById('historyList');
  const items=state.history||[];
  if(!items.length){
    list.innerHTML='<div class="empty-state">Play levels or redeem coupons to build history.</div>';
    return;
  }
  list.innerHTML=items.map(item=>{
    const at=new Date(item.at);
    const stamp=at.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · '+at.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
    return `<div class="history-item"><i>${historyIcon(item.type)}</i><div><h4>${item.text}</h4><small>${stamp}</small></div></div>`;
  }).join('');
}
function historyIcon(type){
  if(type==='reward') return '🎁';
  if(type==='redeem'||type==='staff') return '✓';
  if(type==='help') return '+';
  return '★';
}

/* ---------------- sound (tiny) ---------------- */
let actx=null;
function blip(freq,dur=.08,type='sine',vol=.05){
  if(!state.settings.sound) return;
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
function buzz(ms){ if(!state.settings.vibration) return; try{ navigator.vibrate && navigator.vibrate(ms) }catch(e){} }
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
    paintTile(o);
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
let targetScore=6000;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cell=()=>board.clientWidth/C;
function typeName(type){
  return ['strawberries','blueberries','kiwis','mangoes','chocolates','mochi'][type] || 'toppings';
}

function makeTile(type, special=null){
  const t=TYPES[type];
  const el=document.createElement('div');
  el.className='tile';
  el.innerHTML=`<span class="body" style="background:radial-gradient(circle at 32% 26%, ${t.a}, ${t.b} 78%)"></span><span class="gloss"></span><em>${t.e}</em>`;
  board.appendChild(el);
  const o={type, special, el};
  paintTile(o);
  return o;
}
function paintTile(o){
  const t=TYPES[o.type];
  o.el.classList.toggle('special-line-h', o.special==='line-h');
  o.el.classList.toggle('special-line-v', o.special==='line-v');
  o.el.classList.toggle('special-bomb', o.special==='bomb');
  o.el.querySelector('.body').style.background=`radial-gradient(circle at 32% 26%, ${t.a}, ${t.b} 78%)`;
  o.el.querySelector('em').textContent = o.special==='bomb' ? '✦' : t.e;
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
function matchGroups(g){
  const groups=[];
  for(let r=0;r<R;r++) for(let c=0;c<C-2;c++){
    const a=g[r][c],b=g[r][c+1],d=g[r][c+2];
    if(a&&b&&d&&a.type===b.type&&b.type===d.type){
      const tiles=[];
      let k=c; while(k<C&&g[r][k]&&g[r][k].type===a.type){tiles.push(g[r][k]);k++}
      groups.push({tiles, dir:'h'});
      c=k-1;
    }
  }
  for(let c=0;c<C;c++) for(let r=0;r<R-2;r++){
    const a=g[r][c],b=g[r+1][c],d=g[r+2][c];
    if(a&&b&&d&&a.type===b.type&&b.type===d.type){
      const tiles=[];
      let k=r; while(k<R&&g[k][c]&&g[k][c].type===a.type){tiles.push(g[k][c]);k++}
      groups.push({tiles, dir:'v'});
      r=k-1;
    }
  }
  return groups;
}
function matchesAt(g){
  const hit=new Set();
  matchGroups(g).forEach(group=>group.tiles.forEach(t=>hit.add(t)));
  return [...hit];
}
function buildBoard(){
  const level=currentLevel();
  board.innerHTML='';
  grid=[];
  for(let r=0;r<R;r++){
    grid[r]=[];
    for(let c=0;c<C;c++){
      let t, tries=0;
      do{ t=Math.floor(Math.random()*level.types); tries++;
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
  const level=currentLevel();
  moves=level.moves; goal=level.goal; targetScore=level.target; score=0; sel=null; busy=false; armed=null;
  boosters={shuffle:3,bomb:2,hammer:1};
  shownScore=0; clearHint();
  buildBoard(); syncHud();
  document.querySelectorAll('.ov').forEach(o=>o.classList.remove('on'));
  document.querySelectorAll('.st').forEach(s=>s.classList.remove('on','burst'));
  scheduleHint();
  maybeShowTutorial();
}
function maybeShowTutorial(){
  const t=document.getElementById('tutorial');
  if(!t) return;
  t.classList.toggle('on', !state.seenTutorial);
}
function completeTutorial(){
  const t=document.getElementById('tutorial');
  if(t) t.classList.remove('on');
  if(!state.seenTutorial){
    state.seenTutorial=true;
    saveState();
  }
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
  mv.closest('.pill').classList.toggle('warn', moves<=5 && !isGoalComplete());
  document.getElementById('goalLabel').textContent=currentLevel().mode==='score' ? 'Score left' : 'Goal';
  document.getElementById('goalIcon').textContent=goalIcon();
  document.getElementById('goalLeft').textContent=goalText();
  rollScore();
  const p=Math.min(100, score/targetScore*100);
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
  down={o,x:e.clientX,y:e.clientY,drag:false};
  el.setPointerCapture && el.setPointerCapture(e.pointerId);
  if(armed){ useArmed(o); down=null; return; }
  clearSel(); sel=o; o.el.classList.add('sel');
});
board.addEventListener('pointermove',e=>{
  if(!down||busy) return;
  const dx=e.clientX-down.x, dy=e.clientY-down.y;
  const dist=Math.hypot(dx,dy);
  if(dist<6) return;
  down.drag=true;
  const o=down.o, s=cell(), max=s*.82;
  let tx=0, ty=0;
  if(Math.abs(dx)>Math.abs(dy)) tx=Math.max(-max,Math.min(max,dx));
  else ty=Math.max(-max,Math.min(max,dy));
  o.el.classList.add('dragging');
  o.el.style.transform=`translate(${o.c*s+s*0.07}px, ${o.r*s+s*0.07}px) translate(${tx}px, ${ty}px)`;
});
board.addEventListener('pointerup',e=>{
  if(!down||busy){down=null;return}
  const dx=e.clientX-down.x, dy=e.clientY-down.y;
  down.o.el.classList.remove('dragging');
  if(Math.abs(dx)>16||Math.abs(dy)>16){
    completeTutorial();
    const o=down.o;
    let r=o.r,c=o.c;
    if(Math.abs(dx)>Math.abs(dy)) c+= dx>0?1:-1; else r+= dy>0?1:-1;
    if(grid[r]&&grid[r][c]){ clearSel(); trySwap(o,grid[r][c]); }
    else place(o,o.r,o.c);
  }else{
    place(down.o,down.o.r,down.o.c);
  }
  down=null;
});
board.addEventListener('pointercancel',()=>{
  if(down){
    down.o.el.classList.remove('dragging');
    place(down.o,down.o.r,down.o.c);
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
    const specials=[a,b].filter(t=>t.special);
    if(specials.length){
      moves--; syncHud();
      await clearSpecials(specials);
      busy=false; checkEnd(); return;
    }
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
    const groups=matchGroups(grid);
    if(!groups.length) break;
    const specials=createSpecials(groups);
    const hits=expandSpecialHits(groupsToHits(groups, specials));
    if(!hits.length) break;
    combo++;
    if(combo>1) showCombo(combo);
    const collected=goalHits(hits);
    const wasOpen=!isGoalComplete();
    goal-=collected.length;
    const pts=hits.length*40*combo;
    score+=pts;
    blip(440+combo*110,.09,'triangle',.05);
    buzz(combo>=3?26:10);
    if(combo>=3){ flashScreen(); shake(); }
    shockwave(hits);
    collected.forEach((t,i)=>flyToGoal(t, i*70));
    if(wasOpen && isGoalComplete()) setTimeout(()=>{ showBanner('GOAL COMPLETE!'); blip(1320,.2,'triangle',.06) }, 260);
    popTiles(hits, pts);
    hits.forEach(t=>{ grid[t.r][t.c]=null; });
    specials.forEach(({tile, special})=>{
      if(!tile.el.isConnected) return;
      tile.special=special;
      tile.el.classList.remove('pop');
      paintTile(tile);
      grid[tile.r][tile.c]=tile;
      tile.el.querySelector('.body').animate(
        [{scale:.55, rotate:'-12deg'},{scale:1.18, rotate:'8deg'},{scale:1, rotate:'0deg'}],
        {duration:420,easing:'cubic-bezier(.2,1.5,.4,1)'}
      );
    });
    syncHud();
    await sleep(230);
    hits.forEach(t=>t.el.remove());
    dropAndFill();
    await sleep(240);
  }
}
function groupsToHits(groups, specials){
  const saved=new Set(specials.map(s=>s.tile));
  const hit=new Set();
  groups.forEach(group=>group.tiles.forEach(t=>{ if(!saved.has(t)) hit.add(t); }));
  return [...hit];
}
function createSpecials(groups){
  const made=[];
  const used=new Set();
  groups
    .filter(group=>group.tiles.length>=4 && !group.tiles.some(t=>t.special))
    .sort((a,b)=>b.tiles.length-a.tiles.length)
    .forEach(group=>{
      const tile=group.tiles[Math.floor(group.tiles.length/2)];
      if(used.has(tile)) return;
      used.add(tile);
      made.push({tile, special:group.tiles.length>=5 ? 'bomb' : group.dir==='h' ? 'line-h' : 'line-v'});
    });
  if(made.length){
    const best=made.some(s=>s.special==='bomb') ? 'FROYO BOMB!' : 'LINE CLEAR!';
    showBanner(best);
    blip(1180,.16,'triangle',.055);
  }
  return made;
}
function expandSpecialHits(hits){
  const all=new Set(hits);
  let expanded=true;
  while(expanded){
    expanded=false;
    [...all].forEach(t=>{
      if(!t.special) return;
      const before=all.size;
      if(t.special==='line-h'){
        for(let c=0;c<C;c++) if(grid[t.r][c]) all.add(grid[t.r][c]);
      }else if(t.special==='line-v'){
        for(let r=0;r<R;r++) if(grid[r][t.c]) all.add(grid[r][t.c]);
      }else if(t.special==='bomb'){
        for(let r=t.r-1;r<=t.r+1;r++) for(let c=t.c-1;c<=t.c+1;c++)
          if(grid[r]&&grid[r][c]) all.add(grid[r][c]);
      }
      expanded = expanded || all.size>before;
    });
  }
  if([...all].some(t=>t.special)){
    showBanner('SPECIAL BLAST!');
    flashScreen(); shake(); buzz(28);
  }
  return [...all];
}
async function clearSpecials(specials){
  const hits=expandSpecialHits(specials);
  const collected=goalHits(hits);
  const wasOpen=!isGoalComplete();
  goal-=collected.length;
  const pts=hits.length*55;
  score+=pts;
  collected.forEach((t,i)=>flyToGoal(t, i*65));
  popTiles(hits, pts);
  hits.forEach(t=>{ grid[t.r][t.c]=null; });
  syncHud();
  await sleep(230);
  hits.forEach(t=>t.el.remove());
  dropAndFill();
  await sleep(260);
  if(wasOpen && isGoalComplete()) showBanner('GOAL COMPLETE!');
  await resolve();
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
      const o=makeTile(Math.floor(Math.random()*currentLevel().types));
      place(o, r-R, c, true);
      grid[r][c]=o;
      requestAnimationFrame(()=>requestAnimationFrame(()=>place(o,r,c)));
      landBounce(o, moved++*18);
    }
  }
}
function showCombo(n){
  const el=document.getElementById('combo');
  el.textContent = n>=4 ? 'YUM! x'+n : n===3 ? 'SWEET! x3' : 'COMBO x2';
  el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
}
function shake(){
  const p=document.querySelector('.boardwrap');
  p.classList.add('shake');
  setTimeout(()=>p.classList.remove('shake'),240);
}

async function checkEnd(){
  clearHint();
  if(isGoalComplete()){ setTimeout(levelClear,760); return; }
  if(moves<=0){
    const level=currentLevel();
    const left=level.mode==='score' ? Math.max(0,targetScore-score).toLocaleString()+' points' : Math.max(0,goal)+' more '+typeName(level.targetType);
    document.getElementById('failText').innerHTML='You needed <b id="failLeft">'+left+'</b>. Try a booster or one more run.';
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
  const level=currentLevel();
  const stars = score>=targetScore?3 : score>=targetScore*.66?2 : 1;
  state.stars[level.n]=Math.max(state.stars[level.n]||0, stars);
  addHistory('level','Cleared Level '+level.n+' with '+stars+' star'+(stars===1?'':'s'));
  justUnlockedReward=null;
  if(level.reward && !state.rewards[level.reward]){
    state.rewards[level.reward]={earned:true,used:false,earnedAt:new Date().toISOString()};
    justUnlockedReward=level.reward;
    activeRewardId=level.reward;
    addHistory('reward','Unlocked '+REWARDS[level.reward].title);
  }
  const next=LEVELS.find(l=>l.n>level.n);
  if(next && level.n>=state.unlockedLevel){
    state.unlockedLevel=Math.max(state.unlockedLevel,next.n);
    state.currentLevel=next.n;
  }else if(level.n<state.unlockedLevel){
    state.currentLevel=state.unlockedLevel;
  }
  saveState();
  renderProgress();
  const row=document.getElementById('clearStars');
  [...row.children].forEach((s,i)=>s.classList.toggle('on', i<stars));
  document.getElementById('clearScore').textContent=score.toLocaleString();
  document.getElementById('clearMsg').textContent = stars===3
    ? 'Perfect run. Your progress is saved.'
    : 'Level cleared. Your progress is saved.';
  const btn=document.getElementById('clearNext');
  btn.dataset.go=justUnlockedReward ? 's-reward' : 's-home';
  btn.textContent=justUnlockedReward ? 'UNLOCK REWARD ▶' : 'NEXT LEVEL ▶';
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
document.getElementById('extraMoves').onclick=()=>{
  moves+=5;
  document.getElementById('ovFail').classList.remove('on');
  syncHud();
  showBanner('+5 MOVES!');
  addHistory('help','Used +5 moves on Level '+currentLevel().n);
  scheduleHint();
};
document.getElementById('failShuffle').onclick=async()=>{
  document.getElementById('ovFail').classList.remove('on');
  busy=true;
  await shuffleBoard();
  await resolve();
  busy=false;
  addHistory('help','Shuffled after failing Level '+currentLevel().n);
  checkEnd();
};
document.getElementById('tutorialOk').onclick=completeTutorial;
document.getElementById('staffCheck').onclick=checkStaffCode;
document.getElementById('staffRedeem').onclick=staffRedeemCoupon;
document.getElementById('staffCode').addEventListener('keydown',e=>{ if(e.key==='Enter') checkStaffCode(); });
document.getElementById('setSound').onchange=e=>updateSetting('sound', e.target.checked);
document.getElementById('setVibration').onchange=e=>updateSetting('vibration', e.target.checked);
document.getElementById('setMotion').onchange=e=>updateSetting('reducedMotion', e.target.checked);
document.getElementById('resetProgress').onclick=resetProgress;
document.getElementById('logOut').onclick=logOut;
document.getElementById('tabSignin').onclick=()=>{ authTab='signin'; renderAuthTab(); };
document.getElementById('tabLogin').onclick=()=>{ authTab='login'; renderAuthTab(); };
document.getElementById('authSubmit').onclick=submitAuth;

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
  hits=expandSpecialHits(hits);
  goal-=goalHits(hits).length;
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
  el.oninput=()=>{
    el.value=el.value.replace(/\D/g,'').slice(0,1);
    if(el.value&&arr[i+1]) arr[i+1].focus();
  };
  el.onkeydown=e=>{
    if(e.key==='Backspace'&&!el.value&&arr[i-1]) arr[i-1].focus();
    else if(e.key==='Enter') submitAuth();
  };
});
window.addEventListener('resize',()=>{
  if(!grid.length) return;
  for(let r=0;r<R;r++)for(let c=0;c<C;c++) if(grid[r][c]) place(grid[r][c],r,c,true);
});
