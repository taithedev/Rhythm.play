import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';

const required = ['index.html', 'rhythmplus.js', 'rhythmplus.css', 'config.js', 'favicon.svg', 'vercel.json', 'supabase/schema.sql'];
for (const file of required) {
  if (!existsSync(file)) throw new Error('Required file missing: ' + file);
}
const html = readFileSync('index.html', 'utf8');
const js = readFileSync('rhythmplus.js', 'utf8');
for (const marker of ['id="gameCanvas"', 'id="startBtn"', 'id="resultsOverlay"', 'id="arcadeDialog"', 'id="walletBalance"', 'rhythmplus.js', 'config.js', 'rhythmplus.css', 'rhythm:completed', 'window.rhythmCore']) {
  if (!html.includes(marker)) throw new Error('App hook missing: ' + marker);
}
for (const marker of ['renderShop(', 'renderLeaderboard(', 'postGlobal(', 'applySkin(', 'rhythm:completed', 'localStorage']) {
  if (!js.includes(marker)) throw new Error('Arcade feature missing: ' + marker);
}
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(v => v.trim());
if (!inlineScripts.length) throw new Error('The original rhythm game engine was not found.');
inlineScripts.forEach((source,index) => { new Script(source,{filename:'inline-'+index+'.js'}); });
new Script(js,{filename:'rhythmplus.js'});
new Script(readFileSync('config.js','utf8'),{filename:'config.js'});
JSON.parse(readFileSync('vercel.json','utf8'));
console.log('Rhythm.play checks passed: file references, game hooks, shop, scoreboard, script syntax, and hosting config.');
