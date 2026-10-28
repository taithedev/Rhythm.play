/* Rhythm.play // original phonk-driven cursor chase, no copyrighted audio */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const canvas=$('gameCanvas'),frame=$('gameFrame');
if(!canvas||!frame)return;
const g=canvas.getContext('2d');if(!g)return;
const W=920,H=560,BPM=150,BEAT=60/BPM,STEP=BEAT/4,BARS=48,TOTAL=BARS*16,DURATION=BARS*4*BEAT;
const palette=['#8c85ff','#b47bff','#ff73bb','#76f5ca'];
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const fmt=n=>Math.max(0,Math.floor(n)).toLocaleString('en-US');
const clock=n=>Math.floor(Math.max(0,n)/60)+':'+String(Math.floor(Math.max(0,n)%60)).padStart(2,'0');
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
let mode='idle',ac=null,master=null,noise=null,origin=0,scheduler=null,nextStep=0,vol=.64;
let chart=[],dots=[],parts=[],nextDot=0,score=0,hits=0,misses=0,combo=0,bestCombo=0,t=0,lastFrame=performance.now(),lastHud=-1,flash=0;
let pointer={x:W/2,y:H/2,active:false,touch:false},feedbackTimer;
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
$('durationTime').textContent=clock(DURATION);

function makeChart(){
 const r=rng(160510);const items=[];
 let index=0;
 for(let at=1.2;at<DURATION-3.4;at+=BEAT){
  if(index%11===8)at+=BEAT/2;
  items.push({at,index,edge:index%4,rowX:110+r()*(W-220),rowY:110+r()*(H-220),amp:16+r()*44,phase:r()*Math.PI*2,duration:2.6+r()*.52-.34*(at/DURATION),radius:12+r()*4.5,caught:false,missed:false});
  index++;
 }
 return items;
}
function position(o,age){
 const f=clamp(age/o.duration,0,1),shift=Math.sin(f*Math.PI*(1.75+o.index%3*.3)+o.phase)*o.amp;
 if(o.edge===0)return{x:-38+(W+76)*f,y:clamp(o.rowY+shift,50,H-50)};
 if(o.edge===1)return{x:W+38-(W+76)*f,y:clamp(o.rowY+shift,50,H-50)};
 if(o.edge===2)return{x:clamp(o.rowX+shift,50,W-50),y:-38+(H+76)*f};
 return{x:clamp(o.rowX+shift,50,W-50),y:H+38-(H+76)*f};
}
function accuracy(){return hits+misses?hits/(hits+misses)*100:100;}
function grade(){const a=accuracy();return a>=96?'S':a>=86?'A':a>=72?'B':a>=52?'C':'D';}
function hud(force=false){
 if(!force&&Math.floor(t*10)===lastHud)return;
 lastHud=Math.floor(t*10);
 $('scoreValue').textContent=fmt(score);
 $('comboValue').innerHTML=fmt(combo)+'<span>×</span>';
 $('accuracyValue').textContent=accuracy().toFixed(1)+'%';
 $('accuracyMeter').style.width=accuracy().toFixed(1)+'%';
 $('gradeValue').textContent=hits+misses?grade():'—';
 $('hitsValue').textContent=fmt(hits);$('missesValue').textContent=fmt(misses);
 $('remainingValue').textContent=(hits+misses)+' / '+chart.length+' TARGETS';
 $('currentTime').textContent=clock(t);
 $('songProgress').style.width=(clamp(t/DURATION,0,1)*100).toFixed(2)+'%';
 $('progressStatus').textContent=mode==='playing'?'NOW PLAYING':mode==='paused'?'PAUSED':mode==='done'?'TRACK COMPLETE':'READY TO PLAY';
 $('gameStatus').textContent=mode==='playing'?'PLAYING LIVE':mode==='paused'?'SESSION PAUSED':mode==='done'?'RUN COMPLETE':'ARCADE READY';
}
function overlay(name){
 for(const k of ['start','pause','results'])$(k+'Overlay').classList.toggle('hidden',k!==name);
 $('pauseBtn').disabled=!['playing','paused'].includes(mode);
 $('pauseBtn').textContent=mode==='paused'?'▶  RESUME':'Ⅱ  PAUSE';
 hud(true);
}
function notice(message){
 const el=$('hitNotice');el.textContent=message;el.classList.add('show');
 clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>el.classList.remove('show'),300);
}
function createNoise(){
 const b=ac.createBuffer(1,Math.ceil(ac.sampleRate),ac.sampleRate);
 const data=b.getChannelData(0),r=rng(715501);
 for(let i=0;i<data.length;i++)data[i]=(r()*2-1);
 return b;
}
function env(param,at,peak,stop){
 param.setValueAtTime(.0001,at);param.exponentialRampToValueAtTime(Math.max(peak,.0002),at+.004);
 param.exponentialRampToValueAtTime(.0001,at+stop);
}
function tone(at,freq,duration,type,level,filterFrequency=0){
 const osc=ac.createOscillator(),amp=ac.createGain();
 osc.type=type;osc.frequency.setValueAtTime(freq,at);env(amp.gain,at,level,duration);
 if(filterFrequency){
  const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=filterFrequency;
  osc.connect(filter);filter.connect(amp);
 }else osc.connect(amp);
 amp.connect(master);osc.start(at);osc.stop(at+duration+.02);
}
function kick(at,weight=1){
 const o=ac.createOscillator(),v=ac.createGain();
 o.type='sine';o.frequency.setValueAtTime(178,at);o.frequency.exponentialRampToValueAtTime(42,at+.15);
 env(v.gain,at,.63*weight,.29);o.connect(v);v.connect(master);o.start(at);o.stop(at+.32);
 tone(at,340,.04,'triangle',.095*weight);
}
function bass(at,frequency,duration=.27){
 const low=ac.createBiquadFilter();low.type='lowpass';low.frequency.value=190;
 const o=ac.createOscillator(),amp=ac.createGain();
 o.type='sawtooth';o.frequency.setValueAtTime(frequency*1.28,at);o.frequency.exponentialRampToValueAtTime(frequency,at+.055);
 env(amp.gain,at,.11,duration);o.connect(low);low.connect(amp);amp.connect(master);o.start(at);o.stop(at+duration+.02);
 tone(at,frequency/2,duration+.06,'sine',.24);
}
function noiseHit(at,duration,hp,level){
 const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),amp=ac.createGain();
 source.buffer=noise;filter.type='highpass';filter.frequency.value=hp;
 env(amp.gain,at,level,duration);
 source.connect(filter);filter.connect(amp);amp.connect(master);source.start(at);source.stop(at+duration+.01);
}
function clap(at){
 noiseHit(at,.135,1350,.22);
 noiseHit(at+.018,.10,1700,.08);
 tone(at,190,.055,'triangle',.05);
}
function cowbell(at,freq,level=1){
 const o1=ac.createOscillator(),o2=ac.createOscillator(),mix=ac.createGain(),filter=ac.createBiquadFilter(),amp=ac.createGain();
 o1.type='square';o2.type='square';o1.frequency.value=freq;o2.frequency.value=freq*1.5;
 mix.gain.value=.34;filter.type='bandpass';filter.frequency.value=1200;filter.Q.value=.8;
 env(amp.gain,at,.052*level,.19);
 o1.connect(mix);o2.connect(mix);mix.connect(filter);filter.connect(amp);amp.connect(master);
 o1.start(at);o2.start(at);o1.stop(at+.21);o2.stop(at+.21);
}
function musicStep(step,at){
 const s=step%16,bar=Math.floor(step/16);
 if([0,7,8,11].includes(s)||(bar%4===3&&s===14))kick(at,s===0?1:.74);
 if(s===4||s===12)clap(at);
 if(s%2===0)noiseHit(at,(s===6||s===14)?.09:.045,6500,(s===6||s===14)?.065:.039);
 if(s===15)noiseHit(at,.16,5400,.06);
 if([0,6,8,12].includes(s))bass(at,[55,51.91,46.25,49][Math.floor(bar/4)%4],s===0?.32:.23);
 const line=[0,-1,-1,7,-1,-1,4,-1,2,-1,7,-1,4,-1,2,-1];
 if(line[s]>=0){
  const notes=[0,3,5,7,10,12,15,17];
  const root=[392,349.23,329.63,369.99][Math.floor(bar/4)%4];
  cowbell(at,root*Math.pow(2,notes[line[s]]/12),s===0?1.06:.82);
 }
}
function schedule(){
 if(mode!=='playing'||!ac)return;
 while(nextStep<TOTAL && origin+nextStep*STEP<ac.currentTime+.22){
  const when=origin+nextStep*STEP;
  if(when>ac.currentTime-.015)musicStep(nextStep,Math.max(when,ac.currentTime+.006));
  nextStep++;
 }
}
function shutdown(){
 if(scheduler){clearInterval(scheduler);scheduler=null;}
 const old=ac;ac=null;master=null;noise=null;
 if(old&&old.state!=='closed')try{void old.close().catch(()=>{});}catch(_){}
}
function reset(){
 chart=makeChart();dots=[];parts=[];nextDot=0;
 score=hits=misses=combo=bestCombo=0;t=0;nextStep=0;lastHud=-1;flash=0;pointer.active=false;
 $('hitNotice').classList.remove('show');hud(true);
}
async function start(){
 shutdown();reset();mode='idle';
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio){$('progressStatus').textContent='AUDIO NOT SUPPORTED';notice('WEB AUDIO REQUIRED');return;}
 try{
  ac=new Audio();noise=createNoise();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-15;comp.knee.value=16;comp.ratio.value=3;comp.attack.value=.003;comp.release.value=.16;
  master=ac.createGain();master.gain.value=vol*.76;master.connect(comp);comp.connect(ac.destination);
  await ac.resume();origin=ac.currentTime+.08;mode='playing';overlay(null);
  schedule();scheduler=setInterval(schedule,65);window.dispatchEvent(new Event('rhythm:started'));
 }catch(e){shutdown();mode='idle';overlay('start');$('progressStatus').textContent='AUDIO INIT FAILED';notice('COULD NOT START AUDIO');}
}
async function pause(){
 if(mode==='playing'&&ac){
  mode='paused';overlay('pause');
  try{await ac.suspend();}catch(_){}
 }else if(mode==='paused'&&ac){
  try{await ac.resume();mode='playing';overlay(null);schedule();}
  catch(_){notice('AUDIO UNAVAILABLE');}
 }
}
function particles(x,y,color){
 const r=rng(((x*13+y*17+t*1000)|0)>>>0);
 for(let i=0;i<14;i++){
  const a=r()*Math.PI*2,v=28+r()*150;
  parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,age:0,ttl:.26+r()*.32,size:1+r()*2.4,color});
 }
 if(parts.length>190)parts.splice(0,parts.length-190);
}
function collect(dot){
 if(mode!=='playing'||dot.caught||dot.missed)return;
 dot.caught=true;hits++;combo++;bestCombo=Math.max(combo,bestCombo);
 score+=1000+Math.min(combo,90)*14;
 const p=position(dot,t-dot.at);
 particles(p.x,p.y,palette[dot.index%4]);flash=Math.min(.11,flash+.042);
 notice(combo>1?fmt(combo)+'× COMBO':'+1,000');hud(true);
}
function missed(dot){
 if(dot.caught||dot.missed)return;
 dot.missed=true;misses++;combo=0;hud(true);
}
function segmentDistance(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay;
 const fraction=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);
 return Math.hypot(px-(ax+fraction*dx),py-(ay+fraction*dy));
}
function collisions(previous){
 if(mode!=='playing'||!pointer.active)return;
 for(const d of dots){
  if(d.caught||d.missed)continue;
  const age=t-d.at;if(age<0||age>d.duration)continue;
  const p=position(d,age);
  const range=d.radius+10;
  const hit=previous?segmentDistance(p.x,p.y,previous.x,previous.y,pointer.x,pointer.y)<=range:Math.hypot(p.x-pointer.x,p.y-pointer.y)<=range;
  if(hit)collect(d);
 }
}
function handlePointer(e){
 if(mode!=='playing')return;
 if(e.pointerType==='touch'&&e.cancelable)e.preventDefault();
 const r=canvas.getBoundingClientRect();
 const previous=pointer.active?{x:pointer.x,y:pointer.y}:null;
 pointer.x=clamp((e.clientX-r.left)*W/Math.max(1,r.width),0,W);
 pointer.y=clamp((e.clientY-r.top)*H/Math.max(1,r.height),0,H);
 pointer.touch=e.pointerType==='touch';pointer.active=true;
 collisions(previous);
}
function finish(){
 if(mode!=='playing')return;
 for(const dot of dots)if(!dot.caught&&!dot.missed)missed(dot);
 mode='done';t=DURATION;
 $('resultScore').textContent=fmt(score);
 $('resultAccuracy').textContent=accuracy().toFixed(1)+'%';
 $('resultCombo').textContent=fmt(bestCombo);
 $('resultGrade').textContent=grade();
 overlay('results');shutdown();
 window.dispatchEvent(new CustomEvent('rhythm:completed',{detail:{score,accuracy:accuracy(),maxCombo:bestCombo,hits,misses,grade:grade(),track:'Midnight Run'}}));
}
function coloredDot(x,y,r,color,alpha){
 const fade=clamp(alpha,0,1);if(fade<=0)return;
 g.save();g.globalCompositeOperation='lighter';g.shadowColor=color;g.fillStyle=color;
 g.globalAlpha=fade*.12;g.shadowBlur=50;
 g.beginPath();g.arc(x,y,r*2.4,0,Math.PI*2);g.fill();
 g.globalAlpha=fade*.3;g.shadowBlur=28;
 g.beginPath();g.arc(x,y,r*1.5,0,Math.PI*2);g.fill();
 g.globalAlpha=fade;g.shadowBlur=19;
 g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
 g.shadowBlur=0;g.fillStyle='#fff';g.globalAlpha=fade*.85;
 g.beginPath();g.arc(x-r*.18,y-r*.2,r*.30,0,Math.PI*2);g.fill();g.restore();
}
function draw(dt){
 g.setTransform(1,0,0,1,0,0);g.fillStyle='#070707';g.fillRect(0,0,W,H);
 g.strokeStyle='#ffffff0b';g.lineWidth=1;
 for(let x=40;x<W;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
 for(let y=40;y<H;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
 const glow=g.createRadialGradient(W/2,H/2,40,W/2,H/2,W*.7);glow.addColorStop(0,'#ffffff0b');glow.addColorStop(1,'#00000000');
 g.fillStyle=glow;g.fillRect(0,0,W,H);
 g.strokeStyle='#ffffff28';g.strokeRect(48,48,W-96,H-96);
 g.strokeStyle='#ffffff17';g.beginPath();g.arc(W/2,H/2,130,0,Math.PI*2);g.stroke();
 g.strokeStyle='#ffffff25';g.beginPath();g.arc(W/2,H/2,76+(t%BEAT)/BEAT*11,0,Math.PI*2);g.stroke();
 g.strokeStyle='#ffffff65';for(const [x,y,sx,sy] of [[48,48,1,1],[W-48,48,-1,1],[48,H-48,1,-1],[W-48,H-48,-1,-1]]){
  g.beginPath();g.moveTo(x,y+sy*14);g.lineTo(x,y);g.lineTo(x+sx*14,y);g.stroke();
 }
 for(const dot of dots){
  if(dot.caught||dot.missed)continue;
  const age=t-dot.at;if(age<0||age>dot.duration)continue;
  const p=position(dot,age),fade=clamp(Math.min(age/.2,(dot.duration-age)/.28),0,1);
  const color=palette[dot.index%4];
  coloredDot(p.x,p.y,dot.radius,color,fade);
  g.save();g.strokeStyle='#ffffff74';g.lineWidth=1.2;g.beginPath();
  g.arc(p.x,p.y,dot.radius+9,0,Math.PI*2*(1-age/dot.duration));g.stroke();g.restore();
 }
 for(const p of parts){
  p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=160*dt;
  coloredDot(p.x,p.y,p.size,p.color,clamp(1-p.age/p.ttl,0,1));
 }
 parts=parts.filter(p=>p.age<p.ttl);
 if(pointer.active&&mode==='playing'){
  g.save();g.strokeStyle='#ffffffee';g.lineWidth=1.5;g.shadowColor='#fff';g.shadowBlur=12;
  g.beginPath();g.arc(pointer.x,pointer.y,pointer.touch?16:12,0,Math.PI*2);g.stroke();
  g.shadowBlur=0;g.fillStyle='#fff';g.beginPath();g.arc(pointer.x,pointer.y,2.2,0,Math.PI*2);g.fill();
  g.strokeStyle='#ffffff9c';g.beginPath();
  g.moveTo(pointer.x-23,pointer.y);g.lineTo(pointer.x-16,pointer.y);
  g.moveTo(pointer.x+16,pointer.y);g.lineTo(pointer.x+23,pointer.y);
  g.moveTo(pointer.x,pointer.y-23);g.lineTo(pointer.x,pointer.y-16);
  g.moveTo(pointer.x,pointer.y+16);g.lineTo(pointer.x,pointer.y+23);g.stroke();g.restore();
 }
 if(flash>.001){g.fillStyle='rgba(255,255,255,'+flash.toFixed(3)+')';g.fillRect(0,0,W,H);flash*=reduced?.matches?0:.8;}
 g.fillStyle='#ffffff75';g.font='700 10px Inter, Arial';g.textAlign='left';
 g.fillText('RHYTHM.PLAY  /  PHONK CHASE',22,H-18);
 g.textAlign='right';g.fillText('MOVE TO COLLECT  •  150 BPM',W-22,H-18);
}
function loop(now){
 const dt=clamp((now-lastFrame)/1000,0,.04);lastFrame=now;
 if(mode==='playing'&&ac){
  t=Math.max(0,ac.currentTime-origin);
  while(nextDot<chart.length&&chart[nextDot].at<=t)dots.push(chart[nextDot++]);
  for(const d of dots)if(!d.caught&&!d.missed&&t-d.at>d.duration)missed(d);
  if(dots.length>60)dots=dots.filter(d=>!d.caught&&!d.missed);
  collisions(null);
  if(t>=DURATION)finish();
  hud(false);
 }
 draw(dt);requestAnimationFrame(loop);
}
canvas.addEventListener('pointermove',handlePointer,{passive:false});
canvas.addEventListener('pointerenter',handlePointer,{passive:false});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')try{canvas.setPointerCapture(e.pointerId);}catch(_){}handlePointer(e);},{passive:false});
canvas.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')pointer.active=false;});
canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch')pointer.active=false;});
canvas.addEventListener('pointercancel',()=>{pointer.active=false;});
$('startBtn').addEventListener('click',()=>void start());
$('playAgainBtn').addEventListener('click',()=>void start());
$('pauseBtn').addEventListener('click',()=>void pause());
$('resumeBtn').addEventListener('click',()=>void pause());
$('restartFromPause').addEventListener('click',()=>void start());
$('volume').addEventListener('input',e=>{vol=clamp(Number(e.target.value)/100,0,1);if(ac&&master)master.gain.setTargetAtTime(vol*.76,ac.currentTime,.02);});
const help=$('helpDialog');
$('helpBtn').addEventListener('click',()=>{if(mode==='playing')void pause();help.showModal();});
$('closeHelp').addEventListener('click',()=>help.close());$('gotIt').addEventListener('click',()=>help.close());
$('fullscreenBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await frame.requestFullscreen();}catch(_){notice('FULLSCREEN UNAVAILABLE');}});
document.addEventListener('keydown',e=>{
 if(e.code==='Space'&&!e.repeat&&!help.open&&!$('arcadeDialog').open&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){
  if(mode==='playing'||mode==='paused'){e.preventDefault();void pause();}
 }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')void pause();});
window.rhythmCore={setPalette(colors){if(Array.isArray(colors)&&colors.length===4&&colors.every(c=>typeof c==='string'&&/^#[a-f0-9]{6}$/i.test(c)))palette.splice(0,4,...colors);},getStatus(){return mode;}};
reset();overlay('start');requestAnimationFrame(loop);
})();
