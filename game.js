'use strict';
// Symbolic notation: these functions format progression rather than evaluate hyperoperations.
const MAX = Number.MAX_SAFE_INTEGER, PROGRESS_MAX = 1e21, RATE = 250, KEY = 'layermeta', SIMULATOR_ARROW_UNLOCK = 138169, LOG10_1_1 = Math.log10(1.1), LOG2_10 = Math.LOG2E*Math.LN10, LAYERS_SQUARED_COST = 1, POINT_SOFTCAP_LAYER = 1e9, LAYER_BOOST_SOFTCAP = 100, AUTOBUYER_COST_LOG = 1e11, BASE_LAYER_SPEED = 2.5;
let a = 0, layerPointsLog = null, speedLevel = 0, layersSquaredProgress = 0, layersSquaredArrowOrder = 0, layersSquaredUnlocked = false, moneyLog = null, multiplierLog = null, moneyBestLog = null, moneyMilestonesUnlocked = false, moneyMilestones = Array(10).fill(false), rebirthCount = 0, rebirthsUnlocked = false, ordinalFontScale = 100, hyperArrowOrder = 0, stageSevenReached = false, highestStageIndex = 0, speedAutobuyerUnlocked = false, autobuyerElapsed = 0, running = false, stage = '', last = performance.now();
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
function arrowStage(arrows){
 if(arrows>=1e15)return '7A - Transfinite Arrow Horizon ('+arrows.toLocaleString('en-US')+' up-arrows)';
 if(arrows>=1e6)return '6B - Arrow Lattice ('+arrows.toLocaleString('en-US')+' up-arrows)';
 return '6A - Higher Hyperoperations ('+arrows.toLocaleString('en-US')+' up-arrows)';
}
const SYMBOLIC_STAGES=[
 {id:'7A',name:'Transfinite Arrow Horizon',at:0},{id:'7B',name:'Arrow Constellation',at:10},{id:'7C',name:'Recursive Arrow Sea',at:25},{id:'7D',name:'Hyperordinal Singularity',at:50},
 {id:'8A',name:'Beyond Finite Arrow Towers',at:75},{id:'8B',name:'Apex Hyperoperations',at:100},{id:'8C',name:'Epsilon Spires',at:150},{id:'8D',name:'Ordinal Nebula',at:225},
 {id:'9A',name:'Tetration Expanse',at:350},{id:'9B',name:'Pentation Cascade',at:550},
 {id:'10A',name:'Hexation Crucible',at:900},{id:'10B',name:'Heptation Furnace',at:1500},{id:'10C',name:'Octation Vault',at:2500},{id:'10D',name:'Enneation Storm',at:4200},{id:'10E',name:'Decation Citadel',at:7100},{id:'10F',name:'Undecation Spiral',at:12000},{id:'10G',name:'Dodecation Crown',at:20000},
 {id:'11A',name:'Transfinite Forge',at:35000},{id:'11B',name:'Aleph Engine',at:62000},{id:'11C',name:'Omega Lattice',at:110000},{id:'11D',name:'Epsilon Collapse',at:200000},
 {id:'12A',name:'Veblen Sea',at:370000},{id:'12B',name:'Bachmann Horizon',at:700000},{id:'12C',name:'Large Countable Frontier',at:1350000},
 {id:'13A',name:'Cardinal Anvil',at:2700000},{id:'13B',name:'Inaccessible Ascent',at:5500000},{id:'13C',name:'Mahlo Tempest',at:11000000},{id:'13D',name:'Weakly Compact Expanse',at:23000000},{id:'13E',name:'Measurable Zenith',at:48000000},{id:'13F',name:'Ultimate Arrow Crown',at:100000000},
 {id:'14A',name:'Ordinal Event Horizon',at:210000000},{id:'14B',name:'Uncountable Furnace',at:440000000},{id:'14C',name:'Beyond the Aleph Sea',at:920000000},
 {id:'15A',name:'Mahlo Engine',at:1930000000},{id:'15B',name:'Reflection Cascade',at:4050000000},{id:'15C',name:'Stationary Set Storm',at:8500000000},{id:'15D',name:'Supercompact Ascension',at:17800000000},{id:'15E',name:'Huge Cardinal Expanse',at:37400000000},{id:'15F',name:'I0 Boundary',at:78500000000},{id:'15G',name:'Ultimate Reflection',at:164800000000},
 {id:'16A',name:'Rank-into-Rank Crucible',at:346000000000},{id:'16B',name:'Embedding Labyrinth',at:727000000000},{id:'16C',name:'Transcendent Hierarchy',at:1527000000000},
 {id:'17A',name:'Absolute Infinity Threshold',at:3206000000000},{id:'17B',name:'Omega Beyond Omega',at:6735000000000}
];
const BASE_STAGE_REQUIREMENTS=SYMBOLIC_STAGES.map(candidate=>candidate.at);
const REQUIREMENT_SHIFT_START=SYMBOLIC_STAGES.findIndex(candidate=>candidate.id==='11A');
for(let i=REQUIREMENT_SHIFT_START;i<SYMBOLIC_STAGES.length;i++)SYMBOLIC_STAGES[i].at=Math.max(SYMBOLIC_STAGES[i-1].at*1.1,BASE_STAGE_REQUIREMENTS[i-3]);
function symbolicStageInfo(order){let info=SYMBOLIC_STAGES[0];for(const candidate of SYMBOLIC_STAGES){if(order>=candidate.at)info=candidate;else break;}return info;}
function symbolicArrowStage(order){const info=symbolicStageInfo(order);return info.id+' - '+info.name;}
function currentStageIndex(){return a>=PROGRESS_MAX?symbolicStageInfo(hyperArrowOrder).at===0?1:SYMBOLIC_STAGES.indexOf(symbolicStageInfo(hyperArrowOrder))+1:0;}
function stageSpeedBoost(){return 1.2**Math.max(highestStageIndex,currentStageIndex());}
function multiTowerCount(order){
 if(order<100000000)return 10;
 return Math.min(50,10+Math.floor(Math.max(0,Math.log10(order/100000000))*10));
}
function multiTowerLevels(order){
 const count=multiTowerCount(order),firstIndex=50-count,progress=Math.max(0,Math.floor((order-10000)/5));
 return Array.from({length:count},(_,slot)=>{
  const index=firstIndex+slot,place=49-index,level=1+Math.floor(progress/(5**place))%5;
  return {level,index,slot};
 });
}
function multiTowerPower(level,index,order){
 let content=index===49?'α+'+(9+Math.floor(Math.log10(order))).toLocaleString('en-US'):'ω+'+(50-index);
 for(let rung=0;rung<level;rung++){
  const base='ω+'+([4,2,1,2,3,1,2,4,2,1][(index+rung)%10]);
  content=base+'<sup>'+content+'</sup>';
 }
 return content;
}
function deepOrdinalNotation(order,detailed){
 const levels=multiTowerLevels(order);
 const towers=levels.map(({level,index,slot})=>'<span class="ordinal-tower-block" data-level="'+level+'" style="--tower-rise:'+(slot*.30).toFixed(2)+'em">'+multiTowerPower(level,index,order)+'</span>').join('');
 const compact='H<sub>ψ[Ω<sup>'+order.toLocaleString('en-US')+'</sup>+Γ<sup>ω</sup>]</sub>';
 return detailed?'<span class="ordinal-expression deep-ordinal"><span class="ordinal-multitower">'+towers+'</span></span>':compact;
}
function symbolicLayersSquaredOrdinal(v){
 const order=Math.max(1,Math.floor(layersSquaredArrowOrder));
 if(order>=10000)return deepOrdinalNotation(order,v);
 const arrows='10↑↑'+order.toLocaleString('en-US');
 if(order>=10){
  const depth=Math.min(7,2+Math.floor(Math.log10(order))),tower='10<sup>'.repeat(depth)+'Ω<sup>θ</sup>·'+arrows+'</sup>'.repeat(depth);
  return v?'<span class="ordinal-expression tower-ordinal">⟨|{ε}δ[β<sup>ω</sup>(Ω<sup>θ</sup>)]|⟩ · '+tower+' · Γ<sup>Ω<sup>θ</sup></sup></span>':'10↑<sup>'+arrows+'</sup>10.0000';
 }
 return v?'<span class="ordinal-expression compact-ordinal">'+higherOrdinal(order,1,0)+'</span>':'10↑<sup>'+arrows+'</sup>10.0000';
}
function symbolicArrowOrdinal(v){
 const order=Math.max(1,Math.floor(hyperArrowOrder));
 const arrows='10↑↑'+order.toLocaleString('en-US');
 stage=symbolicArrowStage(order)+' ('+arrows+' up-arrows)';
 if(order>=10000)return deepOrdinalNotation(order,v);
 if(order>=10){
  const depth=Math.min(7,2+Math.floor(Math.log10(order))),tower='10<sup>'.repeat(depth)+'Ω<sup>θ</sup>·'+arrows+'</sup>'.repeat(depth);
  return v?'<span class="ordinal-expression tower-ordinal">⟨|{ε}δ[β<sup>ω</sup>(Ω<sup>θ</sup>)]|⟩ · '+tower+' · Γ<sup>Ω<sup>θ</sup></sup></span>':'10↑<sup>'+arrows+'</sup>10.0000';
 }
 return v?'<span class="ordinal-expression compact-ordinal">ψ<sub>Ω<sup>'+arrows+'</sup></sub>(ε<sub>'+arrows+'</sub> + ω<sup>α<sup>β</sup></sup> + Γ<sup>ω</sup>·10.0000)</span>':'10↑<sup>'+arrows+'</sup>10.0000';
}
function omega(n,v,isPrimary=false) {
 if(n>=PROGRESS_MAX){if(isPrimary&&hyperArrowOrder>0)return symbolicArrowOrdinal(v);if(!isPrimary&&layersSquaredArrowOrder>0)return symbolicLayersSquaredOrdinal(v);}
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
 stage=arrowStage(arrows);
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
const totalSpeed = layer => layerSpeed(layer)*BASE_LAYER_SPEED+speedLevel;
function formatLogValue(logValue){
 if(logValue===null)return '0';
 const exponent=Math.floor(logValue),mantissa=10**(logValue-exponent);
 return exponent<21?(10**logValue).toLocaleString('en-US',{maximumFractionDigits:3}):mantissa.toFixed(3)+'e'+exponent.toLocaleString('en-US');
}
function layersSquaredLayer(){return displayedLayerValue(layersSquaredProgress);}
function stagePointCapPower(){return 1.25**Math.max(0,Math.max(highestStageIndex,currentStageIndex())-1);}
function pointSoftcapLayer(){
 const doubles=Math.min(60,Math.max(0,layersSquaredLayer()-1));
 const baseCap=Math.min(PROGRESS_MAX,POINT_SOFTCAP_LAYER*2**doubles);
 return Math.min(Number.MAX_VALUE,baseCap**stagePointCapPower());
}
function formatLayerThreshold(value){return value>=1e15?value.toExponential(3):value.toLocaleString('en-US');}
function pointGainLog(layer){
 if(layer<10)return null;
 const softcap=pointSoftcapLayer();
 const effectiveLayer=layer<=softcap?layer:softcap+1000*Math.log10(layer/softcap);
 const numericGain=(effectiveLayer-10)*LOG10_1_1;
 // Symbolic arrow progression is beyond JavaScript's normal number range, so it
 // contributes directly to the Layer Point exponent instead of flattening at MAX.
 if(a>=PROGRESS_MAX){
  const symbolicGain=(Math.max(0,hyperArrowOrder)+1)**1.25*1e12*stageSpeedBoost();
  return numericGain+symbolicGain;
 }
 return numericGain;
}
function addLayerPoints(logGain){
 if(logGain===null)return;
 if(layerPointsLog===null||logGain-layerPointsLog>20){layerPointsLog=logGain;return;}
 if(layerPointsLog-logGain<=20)layerPointsLog+=Math.log10(1+10**(logGain-layerPointsLog));
}
function spendLayerPoints(cost){return spendLayerPointsLog(Math.log10(cost));}
function spendLayerPointsLog(costLog){
 if(layerPointsLog===null||layerPointsLog<costLog)return false;
 const difference=layerPointsLog-costLog;
 if(difference>15)return true;
 layerPointsLog=difference>0?costLog+Math.log10(10**difference-1):null;
 return true;
}
const pointSpeedBoost = () => layerPointsLog===null?1:Math.max(1,layerPointsLog*LOG2_10+1);
function layersSquaredRawBoost(){
 const layer=layersSquaredLayer(),numericBoost=Math.log2(layer)+1;
 if(layersSquaredArrowOrder>0)return Math.log2(MAX)+1+(PROGRESS_MAX-1200000)/100000+layersSquaredArrowOrder*1e12;
 if(layer<MAX)return numericBoost;
 // Once the notation becomes symbolic, progress itself keeps the effect growing.
 return Math.log2(MAX)+1+(layersSquaredProgress-1200000)/100000;
}
function softcapLayerBoost(boost){return boost<=LAYER_BOOST_SOFTCAP?boost:LAYER_BOOST_SOFTCAP+Math.sqrt(boost-LAYER_BOOST_SOFTCAP);}
function layersSquaredSpeedBoost(){return !layersSquaredUnlocked?1:softcapLayerBoost(layersSquaredRawBoost());}
// Self speed stays exactly half the normal effect, so its matching softcap begins at ×50.
const layersSquaredSelfSpeedBoost = () => Math.max(1,layersSquaredSpeedBoost()/2);
const layersSquaredSpeedUpgradeBoost = () => Math.sqrt(speedLevel+1);
function layersSquaredTenTenExponent(){const numericExponent=Math.max(0,Math.floor((layersSquaredProgress-200000)/500000));const symbolicExponent=Math.max(0,Math.floor(layersSquaredArrowOrder*1e12));return numericExponent+symbolicExponent;}
function speedAutobuyerRate(){return speedAutobuyerUnlocked?1+Math.max(0,layersSquaredTenTenExponent()-4):0;}
function addLogAmounts(left,right){if(left===null)return right;if(right===null)return left;const high=Math.max(left,right),low=Math.min(left,right);return high-low>20?high:high+Math.log10(1+10**(low-high));}
function simulatorUnlocked(){return hyperArrowOrder>=SIMULATOR_ARROW_UNLOCK;}
function layersSquaredMoneyBoost(){return moneyLog===null?1:10**Math.min(308,moneyLog*moneyBoostExponent());}
function layersSquaredTotalSpeedBoost(){const total=layersSquaredSelfSpeedBoost()*layersSquaredSpeedUpgradeBoost()*layersSquaredMoneyBoost()*layersSquaredMilestoneBoost();return Number.isFinite(total)?applyMoneyMilestoneSpeedPower(total):Number.MAX_VALUE;}
function setOrdinalFontScale(value){ordinalFontScale=Math.max(50,Math.min(150,Number(value)||100));document.documentElement.style.setProperty('--ordinal-font-scale',String(ordinalFontScale/100));document.getElementById('ordinal-font-value').textContent=ordinalFontScale+'%';document.getElementById('ordinal-font-size').value=ordinalFontScale;save();}
function formatBoost(value){return !Number.isFinite(value)?'∞':value>=1e21?value.toExponential(3):value.toLocaleString('en-US',{maximumFractionDigits:3});}
function formatAutobuyerValue(value){return !Number.isFinite(value)?'∞':value>=1e12?value.toExponential(3):value.toLocaleString('en-US',{maximumFractionDigits:3});}
function openButtonSimulator(){if(!simulatorUnlocked())return;document.body.classList.add('simulator-open');render();}
function closeButtonSimulator(){document.body.classList.remove('simulator-open');render();}
function tradeMoneyForMultiplier(){if(moneyLog===null||moneyLog<0)return;moneyBestLog=moneyBestLog===null?moneyLog:Math.max(moneyBestLog,moneyLog);checkMoneyMilestones();const gainLog=moneyLog*moneyToMultiplierExponent()+Math.log10(multiplierGainMilestoneBoost());multiplierLog=addLogAmounts(multiplierLog,gainLog);moneyLog=null;render();save();document.getElementById('notice').textContent='Money traded for '+formatLogValue(gainLog)+' multiplier.';}
const MONEY_MILESTONE_REQUIREMENTS=Array.from({length:10},(_,i)=>10**(i+3));
function moneyMilestoneCount(){return moneyMilestones.filter(Boolean).length;}
function moneyMilestoneDescription(index){
 if(index===0)return 'Money^0.5 also boosts normal Layers speed.';
 if(index===1)return 'Money based speed boosts use money^0.6.';
 if(index===2)return 'Money production gains a multiplier based on your current ordinal stage.';
 if(index===3)return 'Extreme symbolic Layer speed is multiplied by 2; each later milestone doubles it again.';
 if(index===4)return 'Layers² speed is multiplied by the number of reached Money Milestones squared.';
 if(index===5)return 'Normal Layer speed is multiplied by the number of reached Money Milestones cubed.';
 if(index===6)return 'Money boosts to Layers and Layers² use money^0.7.';
 if(index===7)return 'Multiplier boosts money by multiplier^0.6; money gains multiplier at money^0.8.';
 if(index===8)return 'Layer and Layers² speed are each raised to the power 1.025.';
 if(index===9)return 'Unlocks Rebirths and raises Layer and Layers² speed to the power 1.025 again.';
 return 'Money production and multiplier gains are each doubled again.';
}
function checkMoneyMilestones(){
 if(!moneyMilestonesUnlocked||moneyBestLog===null)return;
 MONEY_MILESTONE_REQUIREMENTS.forEach((required,index)=>{if(moneyBestLog>=Math.log10(required))moneyMilestones[index]=true;});
 if(moneyMilestones[9])rebirthsUnlocked=true;
}
function moneyBoostExponent(){return moneyMilestones[6]?0.7:moneyMilestones[1]?0.6:0.5;}
function multiplierToMoneyExponent(){return moneyMilestones[7]?0.6:0.5;}
function moneyToMultiplierExponent(){return moneyMilestones[7]?0.8:0.75;}
function moneyMilestoneSpeedExponent(){return (moneyMilestones[8]?1.025:1)*(moneyMilestones[9]?1.025:1);}
function applyMoneyMilestoneSpeedPower(speed){const powered=speed**moneyMilestoneSpeedExponent();return Number.isFinite(powered)?powered:Number.MAX_VALUE;}
function moneyMilestoneCompoundBoost(){return 2**Math.max(0,moneyMilestoneCount()-2);}
function moneyGenerationMilestoneBoost(){return moneyMilestoneCompoundBoost()*(moneyMilestones[2]?1+currentStageIndex():1);}
function multiplierGainMilestoneBoost(){return moneyMilestoneCompoundBoost()*(rebirthCount+1);}
function extremeSymbolicMilestoneBoost(){return moneyMilestoneCount()>=4?2**(moneyMilestoneCount()-3):1;}
function layersSquaredMilestoneBoost(){const count=moneyMilestoneCount();return count>=5?count**2:1;}
function normalMoneyBoost(){const moneyBoost=moneyMilestones[0]?layersSquaredMoneyBoost():1,count=moneyMilestoneCount();return moneyBoost*(count>=6?count**3:1);}
function spendMoneyLog(costLog){
 if(moneyLog===null||moneyLog<costLog)return false;
 const difference=moneyLog-costLog;
 if(difference>15)return true;
 moneyLog=difference>0?costLog+Math.log10(10**difference-1):null;
 return true;
}
function buyMoneyMilestones(){
 if(moneyMilestonesUnlocked||moneyLog===null||moneyLog<2)return;
 moneyMilestonesUnlocked=true;if(moneyLog!==null)moneyBestLog=moneyBestLog===null?moneyLog:Math.max(moneyBestLog,moneyLog);checkMoneyMilestones();
 if(!spendMoneyLog(2)){moneyMilestonesUnlocked=false;return;}
 render();save();document.getElementById('notice').textContent='Money Milestones unlocked. Reached milestones are permanent.';
}
function renderMoneyMilestones(){
 const list=document.getElementById('money-milestone-list'),scrollTop=list.scrollTop;
 list.innerHTML=MONEY_MILESTONE_REQUIREMENTS.map((required,index)=>{
  const reached=moneyMilestones[index];
  return '<div class="money-milestone'+(reached?' reached':'')+'"><span class="money-milestone-name">Milestone '+(index+1)+'</span><span class="money-milestone-status">'+(reached?'Reached':'Reach '+formatLogValue(Math.log10(required))+' money')+'</span><span class="money-milestone-effect">'+moneyMilestoneDescription(index)+'</span></div>';
 }).join('');
 list.scrollTop=scrollTop;
}
function stageAtProgress(progress){
 const previous=stage;omega(progress,0,true);const result=stage;stage=previous;return result;
}
function nextNumericStageTarget(){
 if(a<5000000){
  let low=a,high=5000000,currentStage=stageAtProgress(a);
  if(stageAtProgress(high)===currentStage)return null;
  for(let i=0;i<48&&high-low>.001;i++){const middle=(low+high)/2;if(stageAtProgress(middle)===currentStage)low=middle;else high=middle;}
  return high;
 }
 return Math.min(PROGRESS_MAX,5000000+(Math.floor((a-5000000)/1000000)+1)*1000000);
}
function timeRemainingSeconds(speed){
 if(!running)return null;
 if(a<PROGRESS_MAX){const target=nextNumericStageTarget();return target===null?null:Math.ceil((target-a)/(RATE*speed));}
 const next=SYMBOLIC_STAGES.find(candidate=>candidate.at>hyperArrowOrder);
 if(!next)return null;
 const arrowRate=Math.max(0.05,Math.log10(speed+1)/0.04);
 return Math.ceil((next.at-hyperArrowOrder)/arrowRate);
}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:12,a,layerPointsLog,speedLevel,layersSquaredProgress,layersSquaredArrowOrder,layersSquaredUnlocked,moneyLog,multiplierLog,moneyBestLog,moneyMilestonesUnlocked,moneyMilestones,rebirthCount,rebirthsUnlocked,ordinalFontScale,hyperArrowOrder,stageSevenReached,highestStageIndex,speedAutobuyerUnlocked,running}));}catch{document.getElementById('notice').textContent='Browser saving is unavailable. Export a backup.';}}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(typeof s==='number'&&Number.isFinite(s)&&s>=0)a=clamp(s);else if(s&&Number.isFinite(s.a)&&s.a>=0){a=clamp(s.a);layerPointsLog=Number.isFinite(s.layerPointsLog)?s.layerPointsLog:(Number.isFinite(s.layerPoints)&&s.layerPoints>0?Math.log10(s.layerPoints):null);speedLevel=Number.isInteger(s.speedLevel)&&s.speedLevel>=0?s.speedLevel:0;layersSquaredProgress=Number.isFinite(s.layersSquaredProgress)&&s.layersSquaredProgress>=0?clamp(s.layersSquaredProgress):0;layersSquaredArrowOrder=Number.isFinite(s.layersSquaredArrowOrder)&&s.layersSquaredArrowOrder>=0?s.layersSquaredArrowOrder:0;layersSquaredUnlocked=s.layersSquaredUnlocked===true;moneyLog=Number.isFinite(s.moneyLog)?s.moneyLog:null;multiplierLog=Number.isFinite(s.multiplierLog)?s.multiplierLog:null;moneyBestLog=Number.isFinite(s.moneyBestLog)?s.moneyBestLog:null;moneyMilestonesUnlocked=s.moneyMilestonesUnlocked===true;moneyMilestones=Array.from({length:10},(_,i)=>Array.isArray(s.moneyMilestones)&&s.moneyMilestones[i]===true);rebirthCount=Number.isSafeInteger(s.rebirthCount)&&s.rebirthCount>=0?s.rebirthCount:0;rebirthsUnlocked=s.rebirthsUnlocked===true||moneyMilestones[9];ordinalFontScale=Number.isFinite(s.ordinalFontScale)?Math.max(50,Math.min(150,s.ordinalFontScale)):100;hyperArrowOrder=Number.isFinite(s.hyperArrowOrder)&&s.hyperArrowOrder>=0?s.hyperArrowOrder:0;stageSevenReached=s.stageSevenReached===true||a>=PROGRESS_MAX;highestStageIndex=Number.isInteger(s.highestStageIndex)&&s.highestStageIndex>=0?s.highestStageIndex:(a>=PROGRESS_MAX?currentStageIndex():0);speedAutobuyerUnlocked=s.speedAutobuyerUnlocked===true;running=s.running===true;}}catch{}}
function buyLayerPrestige(){advance(performance.now());const layer=displayedLayerValue(a),gainLog=pointGainLog(layer);if(gainLog===null)return;addLayerPoints(gainLog);a=0;running=false;last=performance.now();render();save();document.getElementById('notice').textContent='Layer Prestige complete: +'+formatLogValue(gainLog)+' Layer Points.';}
function buyLayersSquared(){advance(performance.now());if(layersSquaredUnlocked||!spendLayerPoints(LAYERS_SQUARED_COST))return;layersSquaredUnlocked=true;last=performance.now();render();save();document.getElementById('notice').textContent='Layers² unlocked. It now progresses independently at base speed.';}
function buySpeedUpgrade(){advance(performance.now());const requirement=speedLevel+2;if(displayedLayerValue(a)<requirement)return;speedLevel++;a=0;running=false;stage='';last=performance.now();render();save();document.getElementById('notice').textContent='Speed Upgrade '+speedLevel+' purchased. Layers reset.';}
function buySpeedAutobuyer(){
 advance(performance.now());
 if(speedAutobuyerUnlocked||!(stageSevenReached||a>=PROGRESS_MAX)||!spendLayerPointsLog(AUTOBUYER_COST_LOG))return;
 speedAutobuyerUnlocked=true;autobuyerElapsed=0;render();save();document.getElementById('notice').textContent='Speed Autobuyer unlocked: +1 Speed Upgrade every second without a layer reset.';
}
function rebirth(){
 advance(performance.now());
 if(!rebirthsUnlocked||!moneyMilestones[9])return;
 if(!confirm('Rebirth resets Money, Multiplier, and all Money Milestones. Layers and Layers² are preserved. Continue?'))return;
 rebirthCount++;moneyLog=null;multiplierLog=null;moneyBestLog=null;moneyMilestonesUnlocked=false;moneyMilestones=Array(10).fill(false);last=performance.now();render();save();
 document.getElementById('notice').textContent='Rebirth complete: +1 Rebirth. Money, multiplier, and Money Milestones reset; Layers and Layers² were preserved.';
}
function resetData(){
 localStorage.removeItem(KEY);a=0;layerPointsLog=null;speedLevel=0;layersSquaredProgress=0;layersSquaredArrowOrder=0;layersSquaredUnlocked=false;moneyLog=null;multiplierLog=null;moneyBestLog=null;moneyMilestonesUnlocked=false;moneyMilestones=Array(10).fill(false);rebirthCount=0;rebirthsUnlocked=false;ordinalFontScale=100;hyperArrowOrder=0;stageSevenReached=false;highestStageIndex=0;speedAutobuyerUnlocked=false;autobuyerElapsed=0;running=false;stage='';last=performance.now();
 document.documentElement.style.setProperty('--ordinal-font-scale','1');render();save();document.getElementById('notice').textContent='All local game data has been reset.';
}
function advance(now){
 const dt=Math.min(Math.max((now-last)/1000,0),1);last=now;
 if(running){
  const layer=displayedLayerValue(a),speed=applyMoneyMilestoneSpeedPower(totalSpeed(layer)*pointSpeedBoost()*layersSquaredSpeedBoost()*stageSpeedBoost()*normalMoneyBoost());
  if(a<PROGRESS_MAX)a=clamp(a+dt*RATE*speed);else hyperArrowOrder+=dt*Math.max(0.05,Math.log10(speed+1)/0.04)*extremeSymbolicMilestoneBoost();
  if(a>=PROGRESS_MAX){stageSevenReached=true;highestStageIndex=Math.max(highestStageIndex,currentStageIndex());}
  if(layersSquaredUnlocked){
   if(layersSquaredProgress<PROGRESS_MAX)layersSquaredProgress=clamp(layersSquaredProgress+dt*RATE*layersSquaredTotalSpeedBoost());
   else{const logSpeed=(Math.log10(layersSquaredSelfSpeedBoost())+Math.log10(layersSquaredSpeedUpgradeBoost())+(moneyLog===null?0:moneyLog*moneyBoostExponent())+Math.log10(layersSquaredMilestoneBoost()))*moneyMilestoneSpeedExponent();const logSpeedPlusOne=logSpeed>300?logSpeed:Math.log10(10**logSpeed+1);layersSquaredArrowOrder+=dt*Math.max(0.05,logSpeedPlusOne/4);}
  }
 }
 if(simulatorUnlocked()){const moneyGainLog=Math.log10(Math.max(dt,1e-12))+(multiplierLog===null?0:multiplierLog*multiplierToMoneyExponent())+Math.log10(moneyGenerationMilestoneBoost());moneyLog=addLogAmounts(moneyLog,moneyGainLog);moneyBestLog=moneyBestLog===null?moneyLog:Math.max(moneyBestLog,moneyLog);checkMoneyMilestones();}
 if(speedAutobuyerUnlocked){autobuyerElapsed+=dt*speedAutobuyerRate();const levels=Math.floor(autobuyerElapsed);if(levels){speedLevel+=levels;autobuyerElapsed-=levels;}}
}
function Click(){advance(performance.now());running=!running;render();save();}
function setOrdinalDisplay(id,html){
 const container=document.getElementById(id);
 const previous=typeof container.querySelector==='function'?container.querySelector('.deep-ordinal'):null;
 const scrollLeft=previous?previous.scrollLeft:0;
 container.innerHTML=html;
 const next=typeof container.querySelector==='function'?container.querySelector('.deep-ordinal'):null;
 if(next)next.scrollLeft=scrollLeft;
}
function render(){const layer=displayedLayerValue(a),gainLog=pointGainLog(layer),pointBoost=pointSpeedBoost(),squaredLayer=layersSquaredLayer(),squaredBoost=layersSquaredSpeedBoost(),squaredSelfBoost=layersSquaredSelfSpeedBoost(),squaredUpgradeBoost=layersSquaredSpeedUpgradeBoost(),pointSoftcap=pointSoftcapLayer(),stageCapPower=stagePointCapPower(),stageBoost=stageSpeedBoost(),speed=applyMoneyMilestoneSpeedPower(totalSpeed(layer)*pointBoost*squaredBoost*stageBoost*normalMoneyBoost()),requirement=speedLevel+2,prestige=document.getElementById('prestige-button'),upgrade=document.getElementById('speed-upgrade-button'),squaredButton=document.getElementById('layers-squared-button'),autobuyer=document.getElementById('speed-autobuyer-button'),simulatorButton=document.getElementById('button-simulator-button'),squaredTotalSpeed=layersSquaredTotalSpeedBoost(),canBuyAutobuyer=stageSevenReached||a>=PROGRESS_MAX;document.documentElement.style.setProperty('--ordinal-font-scale',String(ordinalFontScale/100));document.getElementById('ordinal-font-size').value=ordinalFontScale;document.getElementById('ordinal-font-value').textContent=ordinalFontScale+'%';document.getElementById('But').textContent=running?'Pause':'Continue';document.getElementById('layer-points').textContent=formatLogValue(layerPointsLog);document.getElementById('point-speed').textContent=pointBoost.toLocaleString('en-US',{maximumFractionDigits:3});document.getElementById('layers-squared-notation').innerHTML=omega(layersSquaredArrowOrder>0?PROGRESS_MAX:layersSquaredProgress,1);document.getElementById('layers-squared-layer').innerHTML=omega(layersSquaredArrowOrder>0?PROGRESS_MAX:layersSquaredProgress,0);setOrdinalDisplay('$&···!',omega(a,1,true));setOrdinalDisplay('ЛэАgСу',omega(a,0,true));document.getElementById('layers-squared-speed').textContent=squaredBoost.toLocaleString('en-US',{maximumFractionDigits:3});document.getElementById('layers-squared-self-speed').textContent=squaredSelfBoost.toLocaleString('en-US',{maximumFractionDigits:3});document.getElementById('layers-squared-upgrade-speed').textContent=squaredUpgradeBoost.toLocaleString('en-US',{maximumFractionDigits:3});document.getElementById('layers-squared-total-speed').textContent=formatBoost(squaredTotalSpeed);document.getElementById('point-softcap-layer').textContent=formatLayerThreshold(pointSoftcap);document.getElementById('stage-point-cap-power').textContent=stageCapPower.toLocaleString('en-US',{maximumFractionDigits:3});squaredButton.disabled=layersSquaredUnlocked||layerPointsLog===null||layerPointsLog<Math.log10(LAYERS_SQUARED_COST);squaredButton.textContent=layersSquaredUnlocked?'Layers² unlocked (base-speed progression)':'Unlock Layers² (1 Layer Point)';document.getElementById('layer-speed').textContent=formatBoost(speed);document.getElementById('stage-speed').textContent=stageBoost.toLocaleString('en-US',{maximumFractionDigits:3});document.getElementById('speed-level').textContent=speedLevel.toLocaleString('en-US');document.getElementById('speed-bonus').textContent=speedLevel.toLocaleString('en-US');document.getElementById('next-layer').textContent=requirement.toLocaleString('en-US');upgrade.disabled=layer<requirement;upgrade.textContent=layer>=requirement?'Buy Speed Upgrade (+1 speed)':'Speed Upgrade unlocks at Layer '+requirement.toLocaleString('en-US');autobuyer.disabled=speedAutobuyerUnlocked||!canBuyAutobuyer||layerPointsLog===null||layerPointsLog<AUTOBUYER_COST_LOG;autobuyer.textContent=speedAutobuyerUnlocked?'Speed Autobuyer unlocked (+'+formatAutobuyerValue(speedAutobuyerRate())+' speed / second)':!canBuyAutobuyer?'Speed Autobuyer unlocks at Stage 7A':'Unlock Speed Autobuyer (1e100,000,000,000 Layer Points)';document.getElementById('speed-autobuyer-rate').textContent=speedAutobuyerRate().toLocaleString('en-US');document.getElementById('speed-autobuyer-exponent').textContent=formatAutobuyerValue(layersSquaredTenTenExponent());simulatorButton.disabled=!simulatorUnlocked();simulatorButton.textContent=simulatorUnlocked()?'Button Simulator Area':'Button Simulator Area unlocks at Hψ[Ω138,169+Γω]';document.getElementById('simulator-money').textContent=formatLogValue(moneyLog);document.getElementById('simulator-multiplier').textContent=formatLogValue(multiplierLog);document.getElementById('simulator-money-boost').textContent=formatBoost(layersSquaredMoneyBoost());document.getElementById('simulator-trade-gain').textContent=moneyLog===null?'0':formatLogValue(moneyLog*moneyToMultiplierExponent()+Math.log10(multiplierGainMilestoneBoost()));document.getElementById('simulator-trade-button').disabled=moneyLog===null||moneyLog<0;document.getElementById('rebirth-area').hidden=!rebirthsUnlocked;document.getElementById('rebirth-count').textContent=rebirthCount.toLocaleString('en-US');document.getElementById('rebirth-multiplier-boost').textContent=formatBoost(rebirthCount+1);document.getElementById('rebirth-button').disabled=!moneyMilestones[9];document.getElementById('rebirth-button').textContent=moneyMilestones[9]?'Rebirth (+1; resets Money, Multiplier & Money Milestones)':'Reach Money Milestone 10 to Rebirth';document.getElementById('rebirth-status').textContent=moneyMilestones[9]?'Ready to rebirth. Layers and Layers² are preserved.':'Re-earn Money Milestone 10 to rebirth.';document.getElementById('money-milestone-upgrade').disabled=moneyMilestonesUnlocked||moneyLog===null||moneyLog<2;document.getElementById('money-milestone-upgrade').textContent=moneyMilestonesUnlocked?'Money Milestones unlocked':'Unlock Money Milestones ($100)';document.getElementById('money-milestone-panel').hidden=!moneyMilestonesUnlocked;document.getElementById('money-milestone-summary').textContent=moneyMilestoneCount()+' / 10 reached · Money boost exponent: '+moneyBoostExponent().toFixed(1)+' · Cash and trade gain: ×'+formatBoost(moneyMilestoneCompoundBoost());renderMoneyMilestones();document.getElementById('prestige-info').textContent=gainLog!==null?'Prestige now for +'+formatLogValue(gainLog)+' Layer Points.':'Reach Layer 10 to prestige.';prestige.disabled=gainLog===null;prestige.textContent=gainLog!==null?'Layer Prestige (+ '+formatLogValue(gainLog)+' LP)':'Layer Prestige unlocks at Layer 10';document.getElementById('aaa~~').textContent=hyperArrowOrder>0?'Beyond numeric layers':(a/50000).toFixed(2)+'%';document.getElementById('ordinal-level').textContent=hyperArrowOrder>0?'10↑↑'+Math.floor(hyperArrowOrder).toLocaleString('en-US')+' arrows':Math.floor(a).toLocaleString('en-US');document.getElementById('breakr').textContent=stage;
 const sec=timeRemainingSeconds(speed);const parts=sec===null?['--','--','--']:[Math.floor(sec/3600),String(Math.floor(sec/60)%60).padStart(2,'0'),String(sec%60).padStart(2,'0')];['dbd','dbdbd','dbdbdbd'].forEach((id,i)=>document.getElementById(id).textContent=parts[i]);}
function exportSave(){save();const url=URL.createObjectURL(new Blob([JSON.stringify({version:12,a,layerPointsLog,speedLevel,layersSquaredProgress,layersSquaredArrowOrder,layersSquaredUnlocked,moneyLog,multiplierLog,moneyBestLog,moneyMilestonesUnlocked,moneyMilestones,ordinalFontScale,hyperArrowOrder,stageSevenReached,highestStageIndex,speedAutobuyerUnlocked,running})],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='layer-meta-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importSave(file){if(!file)return;try{const s=JSON.parse(await file.text()),earnedMilestones=moneyMilestones.slice(),hadMilestonesUnlocked=moneyMilestonesUnlocked,previousMoneyBestLog=moneyBestLog,previousRebirthCount=rebirthCount,hadRebirthsUnlocked=rebirthsUnlocked,previousOrdinalFontScale=ordinalFontScale;if(!s||!Number.isFinite(s.a)||s.a<0)throw Error();a=clamp(s.a);layerPointsLog=Number.isFinite(s.layerPointsLog)?s.layerPointsLog:(Number.isFinite(s.layerPoints)&&s.layerPoints>0?Math.log10(s.layerPoints):null);speedLevel=Number.isInteger(s.speedLevel)&&s.speedLevel>=0?s.speedLevel:0;layersSquaredProgress=Number.isFinite(s.layersSquaredProgress)&&s.layersSquaredProgress>=0?clamp(s.layersSquaredProgress):0;layersSquaredArrowOrder=Number.isFinite(s.layersSquaredArrowOrder)&&s.layersSquaredArrowOrder>=0?s.layersSquaredArrowOrder:0;layersSquaredUnlocked=s.layersSquaredUnlocked===true;moneyLog=Number.isFinite(s.moneyLog)?s.moneyLog:null;multiplierLog=Number.isFinite(s.multiplierLog)?s.multiplierLog:null;moneyBestLog=Number.isFinite(s.moneyBestLog)?s.moneyBestLog:null;moneyMilestonesUnlocked=s.moneyMilestonesUnlocked===true||hadMilestonesUnlocked;moneyMilestones=Array.from({length:10},(_,i)=>(Array.isArray(s.moneyMilestones)&&s.moneyMilestones[i]===true)||earnedMilestones[i]);rebirthCount=Math.max(previousRebirthCount,Number.isSafeInteger(s.rebirthCount)&&s.rebirthCount>=0?s.rebirthCount:0);rebirthsUnlocked=hadRebirthsUnlocked||s.rebirthsUnlocked===true||moneyMilestones[9];ordinalFontScale=Number.isFinite(s.ordinalFontScale)?Math.max(50,Math.min(150,s.ordinalFontScale)):previousOrdinalFontScale;hyperArrowOrder=Number.isFinite(s.hyperArrowOrder)&&s.hyperArrowOrder>=0?s.hyperArrowOrder:0;stageSevenReached=s.stageSevenReached===true||a>=PROGRESS_MAX;highestStageIndex=Number.isInteger(s.highestStageIndex)&&s.highestStageIndex>=0?s.highestStageIndex:(a>=PROGRESS_MAX?currentStageIndex():0);speedAutobuyerUnlocked=s.speedAutobuyerUnlocked===true;autobuyerElapsed=0;running=false;last=performance.now();save();render();document.getElementById('notice').textContent='Save imported (paused).';}catch{document.getElementById('notice').textContent='Invalid save file.';}}
load();render();setInterval(()=>{advance(performance.now());render();},50);setInterval(save,1000);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{last=performance.now();save();});
