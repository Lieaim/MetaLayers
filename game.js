'use strict';
// Symbolic notation: these functions format progression rather than evaluate hyperoperations.
const MAX = Number.MAX_SAFE_INTEGER, PROGRESS_MAX = 1e21, RATE = 250, KEY = 'layermeta', LOG10_1_1 = Math.log10(1.1), LOG2_10 = Math.LOG2E*Math.LN10, LAYERS_SQUARED_COST = 1, POINT_SOFTCAP_LAYER = 1e9;
let a = 0, layerPointsLog = null, speedLevel = 0, layersSquaredProgress = 0, layersSquaredUnlocked = false, running = false, stage = '', last = performance.now();
const clamp = n => Number.isFinite(n) ? Math.min(PROGRESS_MAX, Math.max(0,n)) : PROGRESS_MAX;
const GREEK = 'αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
function Letter(n) { return n < 0 ? '' : (n < 26 ? '' : Letter(Math.floor(n/26)-1)) + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[n%26]; }
function CTL(n) { if (!Number.isFinite(n)) return '∞'; if(n<10000) return Math.floor(n); const e=Math.log10(n); return (10**(e%3)).toFixed(Math.max(3-Math.floor(e%3),0))+Letter(Math.floor(e/3)-1); }
function CTM(n) { if(!Number.isFinite(n)) return '∞'; return n<4 ? Math.floor(10**n) : (10**(n%3)).toFixed(Math.max(0,3-Math.floor(n%3)))+Letter(Math.floor(n/3)-1); }
function tint(n,t) { return `<span style="color:hsl(${((n-1)/11*360)%360},${Math.max(0,Math.min((n-1)*10,100))}%,65%)">${t}</span>`; }
function Layer(n) { if(!Number.isFinite(n)) return '∞'; n=Math.floor(n); if(n<1)return 'α'; if(n<49)return GREEK[n-1]; if(n<481)return 'Ω<sub>'+(n<97?'':GREEK[Math.floor((n-97)/48)])+'</sub><sup>'+Layer((n-1)%48+1)+'</sup>'; return Layer((n-1)%480+1)+Layer(Math.floor((n-1)/480)); }
function current(n) { const f=n%1; return CTL(f<.5?9000**(f*2)+f*2000:10**(97**((f-.5)*2))*1000)+tint(Math.floor(n),Layer(Math.floor(n))); }
function c2(n) { return n<12?Layer(Math.floor(10**n)):'{'+Layer(Math.floor((n-2)/10))+'}<sub>'+Layer(Math.floor(10**((n-2)%10+2)))+'</sub>'; }
function ptFunction(n) {const i=n%1;return 10**((i+i*i)/2);}
function tetrate10(n) { if(n<1)return ptFunction(n); if(n<2)return Math.floor(10**ptFunction(n)).toLocaleString('en-US'); if(n<10){const d=Math.floor(n)-2,e=10**ptFunction(n); return '10<sup>'.repeat(d)+(10**(e%1)).toFixed(7)+'×10<sup>'+Math.floor(e).toLocaleString('en-US')+'</sup>'.repeat(d+1);} return '10↑↑'+Math.floor(n); }
function pentate10(n) { if(n<1)return ptFunction(n); if(n<10){const d=Math.floor(n)-1;return '<sup>'.repeat(d)+tetrate10(ptFunction(n))+'</sup>10'.repeat(d);} return '10←'+Math.floor(n); }
function hexate10(n) { if(n<1)return ptFunction(n);if(n<10)return '10←'.repeat(Math.floor(n))+pentate10(ptFunction(n));return '10→'+Math.floor(n); }
function LayerTetr(n,f) { if(n<2){const v=n<1?ptFunction(n):10**ptFunction(n);return Layer(Math.floor(v))+(f===1&&v<1000?'.'+Layer(1+Math.floor((v%1)*100)):'');}const d=Math.floor(n-2);return '{<sub>'.repeat(d)+c2(10**ptFunction(n))+'</sub>{⊙}'.repeat(d); }
function LayerPent(n,f) {if(n<1)return LayerTetr(n,f);if(n<2)return LayerTetr(ptFunction(n),f);const d=Math.floor(n-2);return 'Σ<sub>'+(['|','(','{','[',':','+','-','='][d]||'Σ')+LayerTetr(ptFunction(n),1)+(['|',')','}',']',':','+','-','='][d]||'Σ')+'</sub>(0)';}
function LayerHex(n) {if(n>=16384)return 'Ʊ<sup>2</sup>'; // Compact long repeated expressions before creating them.
 const count=Math.floor(n);return (count>80?'(Ʊ+)×'+count.toLocaleString('en-US')+' + ':'Ʊ+'.repeat(count))+LayerPent(ptFunction(n),2);}
function higherOrdinal(arrows,value,tier){
 if(arrows>=1e12){
  const order=Math.floor(Math.log10(arrows));
  return '<span class="ordinal-expression compact-ordinal">ω<sup>α<sup>β<sub>Ω<sup>'+order.toLocaleString('en-US')+'</sup></sub></sup></sup><sub>ψ<sup>'+arrows.toLocaleString('en-US')+'</sup>·'+value.toFixed(4)+'</sub></span>';
 }
 const depth=arrows<1e6?Math.min(8,3+tier):Math.min(14,9+Math.floor(Math.log10(arrows/1e6)));
 const chain=Array.from({length:depth},(_,i)=>`ω<sup>${i===depth-1?value.toFixed(4):'Ω<sub>'+(arrows-i).toLocaleString('en-US')+'</sub>'}</sup>`).join(' + ');
 const index=Layer(Math.min(480,arrows+tier+2));
 const orderNote=arrows>=1e6?'χ<sub>10<sup>'+Math.floor(Math.log10(arrows)).toLocaleString('en-US')+'</sup></sub> + ':'';
 return '<span class="ordinal-expression">ψ<sub>Ω<sup>'+arrows.toLocaleString('en-US')+'</sup>·'+index+'</sub>(ε<sub>'+(arrows+tier).toLocaleString('en-US')+'</sub> + '+orderNote+chain+' + φ<sub>'+(tier+1).toLocaleString('en-US')+'</sub>(Γ<sup>ω</sup>·'+value.toFixed(4)+'))</span>';
}
function omega(n,v) {
 let i,value;
 if(n<100000){stage='1A - Alphas (1–2)';return v?current(n/100000+1):'1';}
 if(n<200000){i=(n-100000)/100000;stage='1B - The Alphabet';value=1+9**i;return v?current(value):CTL(Math.floor(value));}
 if(n<700000){i=(n-200000)/500000;value=10**(10**i);stage=value<481?'1B - The Alphabet':'1C - X^X';return v?current(value):CTL(Math.floor(value));}
 if(n<1200000){i=(n-700000)/500000;value=10**(10**i);stage='2A - Single-Leveled';return v?tint(i*3000+100,c2(value)):CTM(value);}
 if(n<2200000){i=(n-1200000)/1000000;value=2+8**((i+i*i)/2);stage='2B - Multi-Leveled';return v?tint(i*6000+100,LayerTetr(value)):tetrate10(value);}
 if(n<3200000){i=(n-2200000)/1000000;value=1+9**((i+i*i)/2);stage=value<3?'3A - 1st-Hyper-Bracket':'3B - Beyond-Hyper-Brackets';return v?tint(i*12000+100,LayerPent(value)):pentate10(value);}
 if(n<4500000){i=(n-3200000)/1300000;value=10**((i+i*i)/2);stage=value<2?'4A - Single-Mega-Bracket':value<5?'4B - Multi-Mega-Bracket':'4C - Layer-Mega-Bracket I';return v?tint(i*24000+100,LayerHex(value)):hexate10(value);}
 if(n<5000000){const final=n>=4950000;i=final?(n-4950000)/50000:(n-4500000)/450000;value=final?10**(100+208**((i+i*i)/2)):10**(100**((i+i*i)/2));stage=final?'5B - Final Hexation Layers':value<49?'4D - Layer-Mega-Bracket II':'5A - Explosion-Mega-Bracket';return v?tint(i*48000+100,LayerHex(value)):hexate10(value);}
 const tier=Math.floor((n-5000000)/1000000), arrows=5+tier;
 i=((n-5000000)%1000000)/1000000;value=1+9**((i+i*i)/2);
 stage=(tier+6)+' - '+({5:'Heptation',6:'Octation',7:'Enneation',8:'Decation',9:'Undecation',10:'Dodecation'}[arrows]||'Higher Hyperoperations')+' ('+arrows.toLocaleString('en-US')+' up-arrows)';
 return v?tint(100+tier*100,higherOrdinal(arrows,value,tier)):'10'+(arrows<=8?'↑'.repeat(arrows):'↑<sup>'+arrows.toLocaleString('en-US')+'</sup>')+value.toFixed(4);
}
// This mirrors the numerical value shown by omega(a, 0). Once notation becomes
// symbolic, it is already beyond the largest safely representable layer number.
function displayedLayerValue(n){
 if(n<100000)return 1;
 if(n<200000)return Math.floor(1+9**((n-100000)/100000));
 if(n<700000)return clamp(Math.floor(10**(10**((n-200000)/500000))));
 if(n<1200000){
  const value=10**(10**((n-700000)/500000));
  return value>Math.log10(MAX)?MAX:Math.floor(10**value);
 }
 return MAX;
}
// Layers 2–10 grant full +1 speed each. Afterwards the logarithmic bonus stays small even at extremely high layer values.
function layerSpeed(layer){return layer<=1?1:layer<=10?layer:10+.1*Math.log10(layer-9);}
const totalSpeed = layer => layerSpeed(layer)+speedLevel;
function formatLogValue(logValue){
 if(logValue===null)return '0';
 const exponent=Math.floor(logValue),mantissa=10**(logValue-exponent);
 return exponent<21?(10**logValue).toLocaleString('en-US',{maximumFractionDigits:3}):mantissa.toFixed(3)+'e'+exponent.toLocaleString('en-US');
}
function pointGainLog(layer){
 if(layer<10)return null;
 const effectiveLayer=layer<=POINT_SOFTCAP_LAYER?layer:POINT_SOFTCAP_LAYER+1000*Math.log10(layer/POINT_SOFTCAP_LAYER);
 return (effectiveLayer-10)*LOG10_1_1;
}
function addLayerPoints(logGain){
 if(logGain===null)return;
 if(layerPointsLog===null||logGain-layerPointsLog>20){layerPointsLog=logGain;return;}
 if(layerPointsLog-logGain<=20)layerPointsLog+=Math.log10(1+10**(logGain-layerPointsLog));
}
function spendLayerPoints(cost){
 const costLog=Math.log10(cost);
 if(layerPointsLog===null||layerPointsLog<costLog)return false;
 if(layerPointsLog-costLog>15)return true;
 const remaining=10**layerPointsLog-cost;
 layerPointsLog=remaining>0?Math.log10(remaining):null;
 return true;
}
const pointSpeedBoost = () => layerPointsLog===null?1:Math.max(1,layerPointsLog*LOG2_10+1);
const layersSquaredSpeedBoost = () => !layersSquaredUnlocked?1:Math.log2(displayedLayerValue(layersSquaredProgress))+1;
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:5,a,layerPointsLog,speedLevel,layersSquaredProgress,layersSquaredUnlocked,running}));}catch{document.getElementById('notice').textContent='Browser saving is unavailable. Export a backup.';}}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(typeof s==='number'&&Number.isFinite(s)&&s>=0)a=clamp(s);else if(s&&Number.isFinite(s.a)&&s.a>=0){a=clamp(s.a);layerPointsLog=Number.isFinite(s.layerPointsLog)?s.layerPointsLog:(Number.isFinite(s.layerPoints)&&s.layerPoints>0?Math.log10(s.layerPoints):null);speedLevel=Number.isInteger(s.speedLevel)&&s.speedLevel>=0?s.speedLevel:0;layersSquaredProgress=Number.isFinite(s.layersSquaredProgress)&&s.layersSquaredProgress>=0?clamp(s.layersSquaredProgress):0;layersSquaredUnlocked=s.layersSquaredUnlocked===true;running=s.running===true;}}catch{}}
function buyLayerPrestige(){advance(performance.now());const layer=displayedLayerValue(a),gainLog=pointGainLog(layer);if(gainLog===null)return;addLayerPoints(gainLog);a=0;running=false;last=performance.now();render();save();document.getElementById('notice').textContent='Layer Prestige complete: +'+formatLogValue(gainLog)+' Layer Points.';}
function buyLayersSquared(){advance(performance.now());if(layersSquaredUnlocked||!spendLayerPoints(LAYERS_SQUARED_COST))return;layersSquaredUnlocked=true;last=performance.now();render();save();document.getElementById('notice').textContent='Layers² unlocked. It now progresses independently at base speed.';}
function buySpeedUpgrade(){advance(performance.now());const requirement=speedLevel+2;if(displayedLayerValue(a)<requirement)return;speedLevel++;a=0;running=false;stage='';last=performance.now();render();save();document.getElementById('notice').textContent='Speed Upgrade '+speedLevel+' purchased. Layers reset.';}
function resetData(){localStorage.removeItem(KEY);a=0;layerPointsLog=null;speedLevel=0;layersSquaredProgress=0;layersSquaredUnlocked=false;running=false;stage='';last=performance.now();render();document.getElementById('notice').textContent='All local game data has been reset.';}
function advance(now){const dt=Math.min(Math.max((now-last)/1000,0),1);last=now;if(running){const layer=displayedLayerValue(a);a=clamp(a+dt*RATE*totalSpeed(layer)*pointSpeedBoost()*layersSquaredSpeedBoost());if(layersSquaredUnlocked)layersSquaredProgress=clamp(layersSquaredProgress+dt*RATE);}}
function Click(){advance(performance.now());running=!running;render();save();}
function render(){const layer=displayedLayerValue(a),gainLog=pointGainLog(layer),pointBoost=pointSpeedBoost(),squaredLayer=displayedLayerValue(layersSquaredProgress),squaredBoost=layersSquaredSpeedBoost(),speed=totalSpeed(layer)*pointBoost*squaredBoost,requirement=speedLevel+2,prestige=document.getElementById('prestige-button'),upgrade=document.getElementById('speed-upgrade-button'),squaredButton=document.getElementById('layers-squared-button');document.getElementById('But').textContent=running?'Pause':'Continue';document.getElementById('layer-points').textContent=formatLogValue(layerPointsLog);document.getElementById('point-speed').textContent=pointBoost.toLocaleString('en-US',{maximumFractionDigits:3});document.getElementById('layers-squared-notation').innerHTML=omega(layersSquaredProgress,1);document.getElementById('layers-squared-layer').innerHTML=omega(layersSquaredProgress,0);document.getElementById('$&···!').innerHTML=omega(a,1);document.getElementById('ЛэАgСу').innerHTML=omega(a,0);document.getElementById('layers-squared-speed').textContent=squaredBoost.toLocaleString('en-US',{maximumFractionDigits:3});squaredButton.disabled=layersSquaredUnlocked||layerPointsLog===null||layerPointsLog<Math.log10(LAYERS_SQUARED_COST);squaredButton.textContent=layersSquaredUnlocked?'Layers² unlocked (base-speed progression)':'Unlock Layers² (1 Layer Point)';document.getElementById('layer-speed').textContent=speed.toLocaleString('en-US',{maximumFractionDigits:3});document.getElementById('speed-level').textContent=speedLevel.toLocaleString('en-US');document.getElementById('speed-bonus').textContent=speedLevel.toLocaleString('en-US');document.getElementById('next-layer').textContent=requirement.toLocaleString('en-US');upgrade.disabled=layer<requirement;upgrade.textContent=layer>=requirement?'Buy Speed Upgrade (+1 speed)':'Speed Upgrade unlocks at Layer '+requirement.toLocaleString('en-US');document.getElementById('prestige-info').textContent=gainLog!==null?'Prestige now for +'+formatLogValue(gainLog)+' Layer Points.':'Reach Layer 10 to prestige.';prestige.disabled=gainLog===null;prestige.textContent=gainLog!==null?'Layer Prestige (+ '+formatLogValue(gainLog)+' LP)':'Layer Prestige unlocks at Layer 10';document.getElementById('aaa~~').textContent=(a/50000).toFixed(2);document.getElementById('ordinal-level').textContent=Math.floor(a).toLocaleString('en-US');document.getElementById('breakr').textContent=stage;
 const target=a<5000000?5000000:(Math.floor(a/1000000)+1)*1000000;const sec=running&&a<PROGRESS_MAX?Math.ceil((target-a)/(RATE*speed)):null;const parts=sec===null?['--','--','--']:[Math.floor(sec/3600),String(Math.floor(sec/60)%60).padStart(2,'0'),String(sec%60).padStart(2,'0')];['dbd','dbdbd','dbdbdbd'].forEach((id,i)=>document.getElementById(id).textContent=parts[i]);}
function exportSave(){save();const url=URL.createObjectURL(new Blob([JSON.stringify({version:5,a,layerPointsLog,speedLevel,layersSquaredProgress,layersSquaredUnlocked,running})],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='layer-meta-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importSave(file){if(!file)return;try{const s=JSON.parse(await file.text());if(!s||!Number.isFinite(s.a)||s.a<0)throw Error();a=clamp(s.a);layerPointsLog=Number.isFinite(s.layerPointsLog)?s.layerPointsLog:(Number.isFinite(s.layerPoints)&&s.layerPoints>0?Math.log10(s.layerPoints):null);speedLevel=Number.isInteger(s.speedLevel)&&s.speedLevel>=0?s.speedLevel:0;layersSquaredProgress=Number.isFinite(s.layersSquaredProgress)&&s.layersSquaredProgress>=0?clamp(s.layersSquaredProgress):0;layersSquaredUnlocked=s.layersSquaredUnlocked===true;running=false;last=performance.now();save();render();document.getElementById('notice').textContent='Save imported (paused).';}catch{document.getElementById('notice').textContent='Invalid save file.';}}
load();render();setInterval(()=>{advance(performance.now());render();},50);setInterval(save,1000);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{last=performance.now();save();});
