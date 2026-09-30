'use strict';
// Pause both clocks while the native modal keeps the board inaccessible.
let helpPausedAt=null;
const gameTick=tick;
tick=function(){return helpPausedAt!==null?true:gameTick()};
$('help').onclick=()=>{
 if(active&&tick())return;
 helpPausedAt=active?performance.now():null;
 stopMusic();
 $('instructions').showModal();
};
function closeHelp(){
 if(helpPausedAt!==null&&active){const elapsed=performance.now()-helpPausedAt;deadline+=elapsed;if(lastSuccess)lastSuccess+=elapsed}
 helpPausedAt=null;
 $('instructions').close();
 if(active){tick();startMusic()}
 $('help').focus();
}
$('close-help').onclick=closeHelp;
$('instructions').addEventListener('cancel',e=>{e.preventDefault();closeHelp()});
$('instructions').addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation()});

// Original 8-bar shop waltz: soft triangle melody, bass and light chords.
let musicEnabled=true,musicContext,musicBus,musicTimer=null,nextNote=0,step=0;
const musicVoices=new Set();
try{musicEnabled=localStorage.getItem('exact-mart-music')!=='off'}catch{}
const melody=[72,76,79,76,74,76, 69,72,76,72,71,72, 65,69,72,69,67,69, 67,71,74,71,69,71, 72,76,79,81,79,76, 69,72,76,79,76,72, 65,69,72,74,72,69, 67,71,74,71,72,0];
const chords=[[48,60,64,67],[45,57,60,64],[41,53,57,60],[43,55,59,62]];
function musicTone(midi,when,length,volume){
 if(!midi)return;
 const oscillator=musicContext.createOscillator(),gain=musicContext.createGain();
 oscillator.type='triangle';oscillator.frequency.value=440*2**((midi-69)/12);
 gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+.025);gain.gain.exponentialRampToValueAtTime(.0001,when+length);
 oscillator.connect(gain);gain.connect(musicBus);musicVoices.add(oscillator);
 oscillator.onended=()=>{musicVoices.delete(oscillator);oscillator.disconnect();gain.disconnect()};
 oscillator.start(when);oscillator.stop(when+length+.03);
}
function scheduleMusic(){
 if(!active||helpPausedAt!==null||document.hidden||!musicEnabled){stopMusic();return}
 while(nextNote<musicContext.currentTime+.15){
  const index=step%melody.length,chord=chords[Math.floor(index/6)%4];
  musicTone(melody[index],nextNote,.25,.08);
  if(index%6===0)musicTone(chord[0],nextNote,.55,.085);
  if(index%6===2||index%6===4)chord.slice(1).forEach(n=>musicTone(n,nextNote,.19,.022));
  nextNote+=.25;step++;
 }
}
function startMusic(){
 if(!musicEnabled||!active||helpPausedAt!==null||document.hidden||musicTimer!==null)return;
 try{
  musicContext??=new(window.AudioContext||window.webkitAudioContext)();
  if(!musicBus){musicBus=musicContext.createGain();musicBus.gain.value=.5;musicBus.connect(musicContext.destination)}
  musicContext.resume().catch(()=>{});nextNote=musicContext.currentTime+.04;
  musicTimer=setInterval(scheduleMusic,50);scheduleMusic();
 }catch{stopMusic()}
}
function stopMusic(){
 clearInterval(musicTimer);musicTimer=null;
 for(const voice of musicVoices){try{voice.stop()}catch{}}
 musicVoices.clear();
}
function musicLabel(){const b=$('music');b.textContent=musicEnabled?'♫ BGM':'♫ BGM 꺼짐';b.setAttribute('aria-pressed',String(musicEnabled));b.setAttribute('aria-label',musicEnabled?'배경음악 끄기':'배경음악 켜기')}
$('music').onclick=()=>{musicEnabled=!musicEnabled;musicLabel();try{localStorage.setItem('exact-mart-music',musicEnabled?'on':'off')}catch{}if(musicEnabled)startMusic();else stopMusic()};
for(const id of ['start','restart'])$(id).addEventListener('click',()=>{stopMusic();step=0;startMusic()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMusic();else startMusic()});
window.addEventListener('pagehide',stopMusic);
musicLabel();
