const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let now=100,delayed=[];const nodes=new Map(),storage=new Map();
function element(){return {dataset:{},style:{},children:[],classList:{toggle(){},add(){}},setAttribute(){},addEventListener(){},replaceChildren(...children){this.children=children},showModal(){this.open=true},close(){this.open=false},focus(){}}}
const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
const context=vm.createContext({document:{getElementById:get,querySelector:get,createElement:element,addEventListener(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>now},window:{},setInterval:()=>1,clearInterval(){},setTimeout:f=>delayed.push(f),console});
vm.runInContext(fs.readFileSync('dist/game.js','utf8'),context);const run=s=>vm.runInContext(s,context);const flush=()=>{delayed.splice(0).forEach(f=>f())};
run('start();toggle(0);toggle(1);toggle(4);checkout()');assert.equal(run('score'),30);assert.equal(run('busy'),true);run('checkout()');assert.equal(run('score'),30);flush();assert.equal(run('selected.size'),0);assert.equal(run('items.length'),16);
run('selected.add(0);target=items[0][2]+500;checkout()');assert.equal(run('deadline'),87100);assert.equal(run('combo'),0);
for(let i=0;i<7;i++){now+=400;run('selected.clear();selected.add(0);target=items[0][2];checkout()');flush()};assert.equal(run('combo'),5);assert.equal(run('maxCombo'),5);
now+=5001;run('tick()');assert.equal(run('combo'),0);
for(let i=0;i<300;i++){run('items=Array.from({length:16},randomProduct);target=chooseTarget(items)');assert.equal(run('(()=>{let sums=new Set([0]);for(const p of items){for(const s of [...sums])sums.add(s+p[2])}return sums.has(target)})()'),true)}
now=100000;run('tick()');assert.equal(run('active'),false);assert.equal(get('result').open,true);assert.equal(Number(storage.get('exact-mart-best')),run('score'));run('start()');assert.equal(run('score'),0);assert.equal(run('active'),true);assert.equal(run('selected.size'),0);
console.log('PASS: exact checkout, duplicate-submit protection, refill, penalty, combo cap/expiry, 300 solvable boards, time expiry, best-score storage, restart');
context.window.addEventListener=()=>{};
vm.runInContext(fs.readFileSync('dist/extras.js','utf8'),context);
run('lastSuccess=performance.now();combo=2');
const beforeDeadline=run('deadline'),beforeSuccess=run('lastSuccess');
get('help').onclick();assert.equal(get('instructions').open,true);
now+=15000;assert.equal(run('tick()'),true);assert.equal(run('active'),true);
get('close-help').onclick();assert.equal(run('deadline'),beforeDeadline+15000);assert.equal(run('lastSuccess'),beforeSuccess+15000);assert.equal(run('combo'),2);assert.equal(get('instructions').open,false);
get('music').onclick();assert.equal(storage.get('exact-mart-music'),'off');
console.log('PASS: help modal open/close, 15-second pause preserves game and combo clocks, music preference saved');
