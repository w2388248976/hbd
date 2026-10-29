import { backgroundTrack } from './music-config.js';
const $ = selector => document.querySelector(selector);
let room, giftOpened=false, canBlow=false, finished=false;
const found=new Set();let speechTimer,toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3600);}
function speak(message){$('#speech').textContent=message;$('#speech').classList.add('show');clearTimeout(speechTimer);speechTimer=setTimeout(()=>$('#speech').classList.remove('show'),4200);}
function openDialog(id){const d=$('#'+id);if(!d.open)d.showModal();}
function openWish(){openDialog('wish-dialog');}
function openGift(){
  if(!giftOpened){giftOpened=true;room?.openGift();$('#step-1').classList.add('done');$('#scene-tip').textContent='🍓 再点一下蛋糕，选一句生日祝福';$('[data-object="gift"]').textContent='🍓 点一下蛋糕';speak('是草莓味的生日蛋糕！\n再点一下，选一句你喜欢的祝福吧。');playNotes([523.25,659.25,783.99],.2);}
  else if(canBlow&&!finished)openDialog('candle-dialog');else openWish();
}
const secrets={guitar:['生','拨动琴弦，愿热爱永远有回响。'],golden:['日','大金毛摇着尾巴，把好运送给你！'],dachshund:['快','小腊肠跑了好远，只为送来一个抱抱。'],cat:['乐','灰色猫咪悄悄说：今天也要被温柔以待。']};
function pick(id){
  if(id==='gift'){openGift();return;}
  if(id==='monkey'){room?.excite('monkey');speak('小猴子来串门啦！\n愿你新的一岁，闪闪发光。');return;}
  const secret=secrets[id];if(!secret)return;
  room?.excite(id);found.add(id);$(`[data-object="${id}"]`).classList.add('found');$('#found-count').innerHTML=`发现彩蛋 <b>${found.size} / 4</b>`;
  if(id==='guitar')playNotes([196,246.94,293.66,392],.15,true);
  if(found.size===4){speak('「生 · 日 · 快 · 乐」\n你找到藏在小屋里的全部心意啦！');$('#found-count').innerHTML='集齐彩蛋 <b>生日快乐 ♡</b>';}
  else speak(`${secret[1]}\n你找到了一枚「${secret[0]}」字彩蛋。`);
}
document.querySelectorAll('[data-object]').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.object)));
$('#start-explore').addEventListener('click',()=>{$('#room-stage').scrollIntoView({behavior:'smooth',block:'center'});$('#room-stage').focus({preventScroll:true});speak('欢迎来到 JACK 的生日小屋。\n点点小动物和吉他，也别忘了中间的礼物。');});
$('#reset-view').addEventListener('click',()=>{room?.reset();toast('回到小屋最初的角度');});
document.querySelectorAll('[data-open-wish]').forEach(button=>button.addEventListener('click',openWish));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));

// Preset wishes stay in this visit; no API or database is needed.
$('#wish-form').addEventListener('submit',e=>{
  e.preventDefault();
  const selected=$('input[name="wish"]:checked');
  if(!selected)return;
  canBlow=true;
  $('#step-2').classList.add('done');
  $('#wish-dialog').close();
  if(!giftOpened){giftOpened=true;room?.openGift();$('#step-1').classList.add('done');$('[data-object="gift"]').textContent='🍓 点一下蛋糕';}
  $('#selected-wish').textContent=selected.value;
  $('#birthday-reveal>span').textContent=selected.value+' ♡';
  $('#scene-tip').textContent='祝福已选好，吹灭蜡烛，让烟花绽放';
  if(finished){speak(selected.value+' ♡');toast('这份心意，送给 JACK ♡');}
  else openDialog('candle-dialog');
});

// Start the supplied audio on entry; retry on a gesture when autoplay is blocked.
let audioContext,musicOn=false,musicWanted=true,musicPending=false,musicBlocked=false;
let musicRequest=0;
const backgroundAudio=$('#background-audio');
backgroundAudio.volume=.45;
backgroundAudio.src=backgroundTrack.src;
function audio(){if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();return audioContext;}
function playNotes(notes,spacing=.24,force=false){if(!musicOn&&!force)return;try{const ctx=audio();notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(ctx.destination);const t=ctx.currentTime+i*spacing;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+1.1);o.start(t);o.stop(t+1.2);});}catch{}}
function updateMusicControl(){
  $('#sound-toggle').setAttribute('aria-pressed',String(musicOn));
  $('#sound-label').textContent=musicOn?'音乐 · 播放中':musicBlocked?'轻点开启音乐':musicWanted?'音乐 · 加载中':'音乐 · 已暂停';
  $('#sound-toggle').setAttribute('aria-label',musicOn?'暂停背景音乐':'播放背景音乐');
  $('#sound-toggle').title=backgroundTrack.title;
}
async function startMusic(manual=false){
  if(!musicWanted||document.hidden||musicPending)return;
  const request=++musicRequest;
  musicPending=true;
  try{
    await backgroundAudio.play();
    if(request!==musicRequest)return;
    musicOn=true;musicBlocked=false;
  }catch(error){
    if(request!==musicRequest)return;
    musicOn=false;musicBlocked=true;
    if(manual&&error.name!=='NotAllowedError'&&error.name!=='AbortError')toast('音乐暂时无法播放，请稍后再试。');
  }finally{
    if(request===musicRequest){musicPending=false;updateMusicControl();}
  }
}
function pauseMusic(){
  musicRequest++;musicPending=false;musicOn=false;
  backgroundAudio.pause();updateMusicControl();
}
$('#sound-toggle').addEventListener('click',()=>{
  if(musicOn||musicPending){musicWanted=false;musicBlocked=false;pauseMusic();}
  else{musicWanted=true;startMusic(true);}
});
function unlockMusic(event){
  if(event.target.closest?.('#sound-toggle'))return;
  if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
  if(musicWanted&&backgroundAudio.paused)startMusic();
}
document.addEventListener('click',unlockMusic,true);
document.addEventListener('keydown',unlockMusic,true);
backgroundAudio.addEventListener('playing',()=>{musicOn=true;musicBlocked=false;updateMusicControl();});
backgroundAudio.addEventListener('pause',()=>{musicOn=false;updateMusicControl();});
backgroundAudio.addEventListener('error',()=>{musicOn=false;musicBlocked=true;updateMusicControl();});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){audioContext?.suspend();pauseMusic();}
  else if(musicWanted){audioContext?.resume();startMusic();}
});
updateMusicControl();
startMusic();

// Holding is an accessible alternative to microphone input; both trigger the same ending.
let holdTimer=null,micStream=null,micCtx=null,micFrame=null,micTimeout=null;
function cancelHold(){clearTimeout(holdTimer);holdTimer=null;$('#blow-button').classList.remove('holding');}
function startHold(e){if(e.type==='keydown'&&![' ','Enter'].includes(e.key))return;if(e.repeat||holdTimer)return;e.preventDefault();$('#blow-button').classList.add('holding');holdTimer=setTimeout(celebrate,1000);}
$('#blow-button').addEventListener('pointerdown',e=>{if(e.button!==0)return;$('#blow-button').setPointerCapture(e.pointerId);startHold(e);});
$('#blow-button').addEventListener('keydown',startHold);
for(const event of ['pointerup','pointercancel','lostpointercapture','keyup','blur'])$('#blow-button').addEventListener(event,cancelHold);
function stopMic(){if(micFrame)cancelAnimationFrame(micFrame);clearTimeout(micTimeout);micStream?.getTracks().forEach(t=>t.stop());micStream=null;micCtx?.close();micCtx=null;$('#mic-button').disabled=false;}
$('#candle-dialog').addEventListener('close',()=>{cancelHold();stopMic();});
$('#mic-button').addEventListener('click',async()=>{
  $('#mic-button').disabled=true;$('#mic-status').textContent='正在请求麦克风权限…';
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('unsupported');
    micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    if(!$('#candle-dialog').open){stopMic();return;}
    micCtx=new(window.AudioContext||window.webkitAudioContext)();await micCtx.resume();const analyser=micCtx.createAnalyser();analyser.fftSize=1024;micCtx.createMediaStreamSource(micStream).connect(analyser);const values=new Uint8Array(analyser.fftSize);let sustained=0,previous=performance.now();
    $('#mic-status').textContent='麦克风已开启，对着麦克风持续轻吹约 1 秒。';
    const listen=()=>{if(!micCtx)return;analyser.getByteTimeDomainData(values);const rms=Math.sqrt(values.reduce((sum,v)=>sum+((v-128)/128)**2,0)/values.length);const now=performance.now();sustained=rms>.085?sustained+Math.min(now-previous,100):Math.max(0,sustained-35);previous=now;if(sustained>750){celebrate();return;}micFrame=requestAnimationFrame(listen);};listen();
    micTimeout=setTimeout(()=>{stopMic();$('#mic-status').textContent='暂时没有检测到吹气，可以重试，或按住上方按钮。';},15000);
  }catch{stopMic();$('#mic-status').textContent='麦克风未开启，请按住上方按钮，同样能吹灭蜡烛。';}
});
function celebrate(){
  if(!canBlow)return;cancelHold();stopMic();$('#candle-dialog').close();room?.blow();finished=true;
  $('#step-3').classList.add('done');$('#scene-tip').textContent='愿每一个心愿，都在未来轻轻实现。';
  $('#room-stage').scrollIntoView({behavior:'smooth',block:'center'});$('#birthday-reveal').classList.add('show');$('#birthday-reveal').setAttribute('aria-hidden','false');$('#room-stage').setAttribute('aria-label','蜡烛已经吹灭，金粉色烟花绽放。生日快乐，陈思罕！');
  setTimeout(fireworks,400);playNotes([523.25,659.25,783.99,1046.5],.25,true);toast('生日快乐，陈思罕！愿所有美好都向你奔赴。');
}
function fireworks(){
  const canvas=$('#fireworks'),ctx=canvas.getContext('2d');const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.scale(dpr,dpr);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let particles=[];const colors=['#d5ae68','#e9b7b1','#efcdd1','#c49b63','#efd293','#d799a4'];
  function burst(){const x=r.width*(.2+Math.random()*.6),y=r.height*(.08+Math.random()*.35);for(let i=0;i<(reduced?18:64);i++){const a=Math.PI*2*i/64,s=.8+Math.random()*2.5;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color:colors[i%colors.length],size:1+Math.random()*1.5});}}
  let start=performance.now(),next=0,last=start;
  function frame(now){const t=now-start,delta=Math.min((now-last)/16.67,2);last=now;ctx.clearRect(0,0,r.width,r.height);if(t>next&&t<(reduced?700:5500)){burst();next+=reduced?1000:650;}particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx*delta;p.y+=p.vy*delta;p.vy+=.022*delta;p.vx*=.99;p.life-=.008*delta;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;if(particles.length||t<5500)requestAnimationFrame(frame);else ctx.clearRect(0,0,r.width,r.height);}requestAnimationFrame(frame);
}

try{
  const {createRoom}=await import('./room.js');room=createRoom($('#scene-container'),pick);$('#loading').hidden=true;
}catch(error){
  console.error('3D room failed:',error);$('#loading').textContent='当前设备未能打开 3D 场景，可使用下方按钮继续探索和完成生日惊喜。';$('#loading').style.padding='40px';$('#loading').style.textAlign='center';
}
