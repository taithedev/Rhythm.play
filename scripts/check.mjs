import {existsSync, readFileSync} from 'node:fs';
import {Script, createContext} from 'node:vm';
const required = ['index.html','cursor-game.js','cursor-style.css','rhythmplus.js','rhythmplus.css','config.js','favicon.svg','vercel.json','supabase/schema.sql'];
for (const name of required) if (!existsSync(name)) throw new Error('Missing file: '+name);
const html=readFileSync('index.html','utf8');
const engine=readFileSync('cursor-game.js','utf8');
const platform=readFileSync('rhythmplus.js','utf8');
const css=readFileSync('cursor-style.css','utf8');
for(const id of ['gameCanvas','gameFrame','startBtn','pauseBtn','resultsOverlay','resultGrade','resultScore','resultAccuracy','resultCombo','arcadeDialog','arcadeTitle','arcadeClose','arcadeContent','walletBalance','profileShortcut','rhToast','volume']) {
 if(!html.includes('id="'+id+'"'))throw new Error('Missing game/platform element '+id);
}
for(const name of ['cursor-game.js','rhythmplus.js','cursor-style.css','rhythmplus.css','config.js']) {
 if(!html.includes('"'+name+'"'))throw new Error('Missing asset reference '+name);
}
for(const token of ['pointermove','pointerdown','pointercancel','touch','function collect','function collisions','getStatus','rhythm:completed','cowbell','noiseHit','createOscillator','AudioContext']) {
 if(!engine.includes(token))throw new Error('Phonk chase feature missing '+token);
}
if(!css.includes('touch-action:none'))throw new Error('Touch drag is not enabled');
for(const token of ['renderShop','renderLeaderboard','postGlobal','localStorage','Midnight Run'])if(!platform.includes(token))throw new Error('Platform feature missing '+token);
for(const name of ['cursor-game.js','rhythmplus.js','config.js'])new Script(readFileSync(name,'utf8'),{filename:name});
JSON.parse(readFileSync('vercel.json','utf8'));
const sql=readFileSync('supabase/schema.sql','utf8');
if(!sql.includes('rhythm_scores')||!sql.includes('rhythm_skins')||!sql.includes('Midnight Run'))throw new Error('Incorrect score schema');

/* Initialize the game in a fake browser to catch missing element wiring and startup exceptions. */
const els=new Map(), listeners=new Map(), callbacks=[];
const ctxMock=new Proxy({}, {get(_,key){
 if(key==='createRadialGradient')return()=>({addColorStop(){}});
 if(key==='setTransform'||key==='fillRect'||key==='strokeRect'||key==='beginPath'||key==='arc'||key==='stroke'||key==='fill'||key==='moveTo'||key==='lineTo'||key==='save'||key==='restore'||key==='fillText')return()=>{};
 return undefined;
},set(){return true}});
function node(id){
 if(els.has(id))return els.get(id);
 const n={id,disabled:false,innerHTML:'',textContent:'',value:'64',open:false,hidden:false,style:{width:''},
 classList:{toggle(){},add(){},remove(){}},events:new Map(),
 addEventListener(k,f){this.events.set(k,f);},getContext(){return ctxMock;},
 showModal(){this.open=true;},close(){this.open=false;},
 getBoundingClientRect(){return{left:0,top:0,width:920,height:560}},setPointerCapture(){},requestFullscreen(){return Promise.resolve()}};
 els.set(id,n);return n;
}
const document={getElementById:node,addEventListener(k,f){listeners.set(k,f);},fullscreenElement:null,activeElement:{tagName:'BODY'},exitFullscreen(){return Promise.resolve()}};
const window={matchMedia(){return{matches:false}},addEventListener(k,f){listeners.set(k,f)}};
const env={document,window,performance:{now:()=>0},requestAnimationFrame:f=>callbacks.push(f),
 setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},
 Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,config){this.type=type;this.detail=config.detail;}},
 console,Math,Number,String,Array,Map};
createContext(env);
new Script(engine,{filename:'cursor-game.js'}).runInContext(env);
if(!window.rhythmCore||window.rhythmCore.getStatus()!=='idle')throw new Error('Game did not initialize idle');
if(!node('startBtn').events.has('click'))throw new Error('Start button not wired');
if(!node('gameCanvas').events.has('pointermove'))throw new Error('Pointer gameplay not wired');
window.rhythmCore.setPalette(['#ff00aa','#00ddff','#ffee55','#99ff88']);
if(!callbacks.length)throw new Error('Animation loop not created');
callbacks.shift()(16);
console.log('Rhythm.play PASS: all assets, original phonk engine, pointer/touch inputs, score hooks, shop, SQL, and startup simulation.');
