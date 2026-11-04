'use strict';
/* 모기담곰 홈페이지 설정: 초대 링크를 받으면 아래 두 주소만 변경하세요. */
const GUILD_CONFIG = {
  discordUrl: '', // 예: 'https://discord.gg/초대코드'
  openChatUrl: '' // 예: 'https://open.kakao.com/o/초대코드'
};
const $ = selector => document.querySelector(selector);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gate = $('#gate');
const toast = $('#toast');
let toastTimer;
let audioEnabled = false;
const bgMusic = $('#bgMusic');
const musicBtn = $('#soundBtn');
const musicVolume = $('#musicVolume');
const DEFAULT_VOLUME = 0.18; // 배경음악 기본 음량 18%
bgMusic.volume = DEFAULT_VOLUME;
musicVolume.value = String(Math.round(DEFAULT_VOLUME*100));
let musicRequested = false;
function updateMusicButton(){
  const playing = !bgMusic.paused;
  musicBtn.textContent = playing ? '❚❚' : '♫';
  musicBtn.setAttribute('aria-pressed',String(playing));
  musicBtn.setAttribute('aria-label',playing ? '배경음악 일시정지' : '배경음악 재생');
  musicBtn.title = playing ? 'SMILEY 일시정지' : 'SMILEY 재생';
}
async function playMusic({silentFailure=false}={}){
  musicRequested = true;
  try { await bgMusic.play(); updateMusicButton(); }
  catch {
    updateMusicButton();
    if(!silentFailure) notify('브라우저가 음악 재생을 막았어요. 음악 버튼을 다시 눌러주세요.');
  }
}
// 시작 화면에서는 절대 자동 재생하지 않습니다.
// 사용자가 「음악과 함께 입장」을 클릭할 때만 재생을 시작합니다.
bgMusic.pause();

musicVolume.addEventListener('input',()=>{
  bgMusic.volume=Number(musicVolume.value)/100;
  musicVolume.title=`배경음악 음량 ${musicVolume.value}%`;
  const gateVolume = $('#gateVolume');
  if(gateVolume) gateVolume.value = musicVolume.value;
});
bgMusic.addEventListener('play',updateMusicButton);
bgMusic.addEventListener('pause',updateMusicButton);
bgMusic.addEventListener('error',()=>notify('음악 파일을 불러오지 못했어요.'));
let audioContext;
const safeRandom = (min,max) => min+Math.random()*(max-min);

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}
function tone(freq=600,duration=.11){
  if(!audioEnabled) return;
  try{
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state === 'suspended') audioContext.resume();
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(freq,audioContext.currentTime);
    gain.gain.setValueAtTime(.0001,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.035,audioContext.currentTime+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);
    osc.connect(gain).connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration+.01);
  }catch{/* audio is optional */}
}
function sparkle(count=40){
  if(reducedMotion) return;
  const root=$('#confetti'),palette=['#f7d69b','#a6e6d5','#f2b9c7','#e7edff'];
  for(let i=0;i<count;i++){
    const el=document.createElement('i');el.className='confetti-piece';
    el.style.left=`${safeRandom(0,100)}%`;
    el.style.background=palette[Math.floor(Math.random()*palette.length)];
    el.style.borderRadius=Math.random()>.5?'50%':'2px';
    el.style.setProperty('--fall',`${safeRandom(2.8,5.6)}s`);
    el.style.setProperty('--drift',`${safeRandom(-250,250)}px`);
    el.style.animationDelay=`${safeRandom(0,.6)}s`;
    root.appendChild(el);setTimeout(()=>el.remove(),6500);
  }
}
function enter(){
  if(gate.classList.contains('hidden'))return;
  gate.classList.add('hidden');gate.setAttribute('aria-hidden','true');
  document.body.classList.remove('gate-active');
  // 입장 기록을 저장하지 않아 항상 시작 화면을 볼 수 있습니다.
  tone(620);setTimeout(()=>tone(880),120);
  sparkle(35);
  $('#enterBtn').blur();
}
$('#enterBtn').addEventListener('click',()=>{playMusic();enter();});
$('#quietEnterBtn').addEventListener('click',()=>{musicRequested=false;bgMusic.pause();enter();});
// 시작 화면은 새로고침/재방문 시에도 항상 표시합니다.
const gateVolume = $('#gateVolume');
if (gateVolume) {
  gateVolume.value = musicVolume.value;
  gateVolume.addEventListener('input', () => {
    musicVolume.value = gateVolume.value;
    musicVolume.dispatchEvent(new Event('input'));
  });
}

musicBtn.addEventListener('click',()=>{
  if(bgMusic.paused) playMusic();
  else {musicRequested=false; bgMusic.pause();}
});
$('#themeBtn').addEventListener('click',()=>{
  document.body.classList.toggle('light-mode');
  const active=document.body.classList.contains('light-mode');
  $('#themeBtn').setAttribute('aria-pressed',String(active));
  $('#themeBtn').textContent=active?'☀':'☾';
  notify(active?'새벽빛 모드가 켜졌어요 ☀':'다시 밤하늘로 돌아왔어요 ☾');tone(660);
});
$('#menuBtn').addEventListener('click',()=>{
  const active=$('#mobileNav').classList.toggle('open');
  $('#menuBtn').setAttribute('aria-expanded',String(active));
});
document.querySelectorAll('#mobileNav a').forEach(a=>a.addEventListener('click',()=>{
  $('#mobileNav').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');
}));
$('#expandRules').addEventListener('click',()=>{
  const expanded=$('#rulesList').classList.toggle('expanded');
  $('#expandRules').setAttribute('aria-expanded',String(expanded));
  $('#expandRules').innerHTML=expanded?'간단히 보기 <span aria-hidden="true">−</span>':'규칙 자세히 보기 <span aria-hidden="true">＋</span>';
  tone(520);
});
function openGuildLink(url,platform){
  if(!url){notify(`${platform} 초대 링크를 아직 등록하지 않았어요. 운영진에게 문의해 주세요.`);return;}
  try{
    const parsed=new URL(url);
    const allowed=platform==='디스코드'?['discord.gg','discord.com']:['open.kakao.com'];
    if(parsed.protocol!=='https:'||!allowed.includes(parsed.hostname)){notify('초대 링크 주소를 확인해 주세요.');return;}
    window.open(parsed.href,'_blank','noopener,noreferrer');
  }catch{notify('초대 링크 주소를 확인해 주세요.');}
}
$('#discordBtn').addEventListener('click',()=>openGuildLink(GUILD_CONFIG.discordUrl,'디스코드'));
$('#kakaoBtn').addEventListener('click',()=>openGuildLink(GUILD_CONFIG.openChatUrl,'오픈채팅'));
function nextQuestClock(){
  const now=new Date();
  const korea=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Seoul'}));
  const candidates=[];
  for(let days=0;days<=2;days++)for(const [hour,min] of [[0,10],[23,0]]){
    const d=new Date(korea);d.setDate(korea.getDate()+days);d.setHours(hour,min,0,0);
    if(d>korea)candidates.push(d);
  }
  const next=candidates.sort((a,b)=>a-b)[0];
  if(!next)return;
  const minutes=Math.max(0,Math.ceil((next-korea)/60000));
  const h=Math.floor(minutes/60),m=minutes%60;
  const remaining=h?`${h}시간 ${m}분`:`${m}분`;
  $('#nextQuest').textContent=`☽ 다음 길퀘 시작까지 약 ${remaining} · 매일 시작 시각 기준`;
}
nextQuestClock();setInterval(nextQuestClock,60000);
if(!reducedMotion){
  const stars=$('#stars');
  for(let i=0;i<95;i++){
    const s=document.createElement('span');s.className='star';
    const size=safeRandom(.8,2.4);
    s.style.cssText=`left:${safeRandom(0,100)}%;top:${safeRandom(0,100)}%;width:${size}px;height:${size}px;--opacity:${safeRandom(.14,.7)};--duration:${safeRandom(1.5,4.5)}s;--delay:${safeRandom(-5,0)}s`;
    stars.appendChild(s);
  }
  window.addEventListener('pointermove',e=>{
    const glow=$('.cursor-glow');glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';
  },{passive:true});
}
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
function onScroll(){
  const scrollable=document.documentElement.scrollHeight-innerHeight;
  $('#scrollProgress').style.width=(scrollable>0?scrollY/scrollable*100:0)+'%';
  $('#backTop').classList.toggle('show',scrollY>450);
}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
$('#backTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:reducedMotion?'instant':'smooth'}));
// 비밀 입력: 화면 어디에서나 a → s → a, 연속 세 글자 입력 시 발동
let buffer='';
function activateSecret(){
  if(!gate.classList.contains('hidden')) enter();
  const secret=$('#secret');secret.classList.add('active');secret.setAttribute('aria-hidden','false');
  sparkle(85);tone(523);setTimeout(()=>tone(659),140);setTimeout(()=>tone(784),280);
  $('#secretClose').focus();
}
function closeSecret(){
  $('#secret').classList.remove('active');$('#secret').setAttribute('aria-hidden','true');
}
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if($('#secret').classList.contains('active'))closeSecret();
    if($('#mobileNav').classList.contains('open')){$('#mobileNav').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');}
    return;
  }
  if(e.ctrlKey||e.altKey||e.metaKey||e.key.length!==1||/INPUT|TEXTAREA/.test(document.activeElement?.tagName||''))return;
  buffer=(buffer+e.key.toLowerCase()).slice(-3);
  if(buffer==='asa'){buffer='';activateSecret();}
});
$('#secretClose').addEventListener('click',closeSecret);
$('.secret-backdrop').addEventListener('click',closeSecret);
// 장식용 별 클릭 시 작은 반응
$('.brand-icon').addEventListener('click',()=>tone(740));

// Character card surprises: uses the original four user-provided images.
document.querySelectorAll('.character-tile').forEach(tile=>{
  tile.addEventListener('click',()=>{
    notify(tile.dataset.bear);
    tone(740,.12);
    sparkle(18);
    tile.animate([{transform:'translateY(0) rotate(0)'},{transform:'translateY(-14px) rotate(-4deg)'},{transform:'translateY(0) rotate(0)'}],{duration:560,easing:'ease-out'});
  });
});
