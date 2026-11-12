import {reactionConditionError} from './reactionConditions';
import {reactionExtent} from './documentReactionRules';
import {chemicalProfiles} from './catalog';
import { reactionRate } from "./catalystLogic";
import { chemicals,type ChemicalId,type Contents } from "./chemicals";
import { gasDestination,placementError } from "./connectionLogic";
import { isContainer,type Vessel } from "./equipment";
import { heatStep,ignitionError } from "./heatingLogic";
import { reactionRules,type ReactionRule } from "./reactionRules";
const duration:Record<string,number>={hydrogen:10,precipitate:7,neutralization:6,oxygen:60};
export type ReactionLifecycle='IDLE'|'READY'|'RUNNING'|'COMPLETED'|'BLOCKED';
/** Chemistry state derives from material/conditions, independently of the animation clock. */
export function reactionLifecycle(v:Vessel,rules:ReactionRule[]=reactionRules):ReactionLifecycle{
 if(v.reaction?.status==='running')return 'RUNNING';
 if(v.reaction?.status==='complete')return 'COMPLETED';
 if(!Object.values(v.contents).some(n=>n!>1e-9))return 'IDLE';
 return startReaction(v,0,rules).error?'BLOCKED':'READY';
}
export function startReaction(v:Vessel,now=Date.now(),rules:ReactionRule[]=reactionRules,items:Vessel[]=[]){
 const placement=placementError(v);if(placement)return {v,error:placement};
 if(!isContainer(v)||v.type==='gasJar')return {v,error:'Chọn một dụng cụ phản ứng phù hợp.'};
 if(v.reaction?.status==='running')return {v,error:'Phản ứng đang diễn ra.'};
 if(v.reaction?.status==='paused'&&(v.temperature??25)<(v.reaction.rule?.minTemperature??20))return {v,error:'Cần đun đến nhiệt độ yêu cầu trước khi tiếp tục.'};
 if(v.reaction?.status==='paused'){
  const condition=v.reaction.rule&&reactionConditionError(v,v.reaction.rule,items);if(condition)return {v,error:condition};
  if(v.reaction.rule?.catalysts?.some(id=>(v.contents[id]||0)<=1e-9))return {v,error:'Bổ sung lại chất xúc tác theo điều kiện trước khi tiếp tục.'};
  return {v:{...v,reaction:{...v.reaction,status:'running' as const,rate:reactionRate(v,v.reaction.ruleId)}},error:undefined};
 }
 const rule=rules.find(r=>Object.keys(r.reactants).every(id=>r.ambientOxygen&&id==='O2'&&!v.sealed||(v.contents[id as ChemicalId]||0)>1e-9));
 if(!rule)return {v,error:'Chưa hỗ trợ mô phỏng phản ứng này'};
 const condition=reactionConditionError(v,rule,items);if(condition)return {v,error:condition};
 if(rule.catalysts?.some(id=>(v.contents[id]||0)<=1e-9))return {v,error:'Thêm chất xúc tác theo điều kiện của phản ứng trước khi bắt đầu.'};
 if((v.temperature??25)<(rule.minTemperature??20))return {v,error:`Cần đun đến ít nhất ${rule.minTemperature}°C để bắt đầu phản ứng.`};
 // Do not silently predict chemistry of reactive species outside this validated rule.
 const inert=['H2O','indicator','NaCl','Na2SO4','ZnCl2','H2','O2',...Object.keys(rule.reactants),...Object.keys(rule.products),...(rule.catalysts||[]),...(rule.id==='oxygen'?['MnO2']:[])];
 if(Object.entries(v.contents).some(([id,n])=>n!>1e-9&&!inert.includes(id)))return {v,error:'Chưa hỗ trợ mô phỏng phản ứng này'};
 const target=reactionExtent(rule,v.contents);
 if(!(target>1e-10))return {v,error:'Hệ đã đạt trạng thái cân bằng của mô hình.'};
 return {v:{...v,animation:undefined,effect:rule.effect,reaction:{rule:structuredClone(rule),ruleId:rule.id,target,extent:0,status:'running' as const,startedAt:now,before:{...v.contents},rate:reactionRate(v,rule.id)}},error:undefined};
}
export function stepSimulation(input:Vessel[],dt:number){
 if(!(dt>0)||!Number.isFinite(dt))return {items:input,messages:[] as string[]};
 if(!input.some(v=>v.burning||v.gasReceiving||v.reaction?.status==='running'||Math.abs((v.temperature??25)-25)>.02))return {items:input,messages:[] as string[]};
 const items=structuredClone(input);const messages:string[]=[];
 for(const v of items)v.gasReceiving=false;
 for(const b of items.filter(v=>['burner','alcoholBurner'].includes(v.type)&&v.burning)){const err=ignitionError(b,items);if(err){b.burning=false;messages.push('Tự tắt đèn: '+err)}}
 for(const v of items.filter(isContainer)){
  v.temperature=heatStep(v,items,dt);const running=v.reaction;if(!running||running.status!=='running')continue;
  const rule=running.rule||reactionRules.find(r=>r.id===running.ruleId);if(!rule){running.status='paused';continue}
  const condition=reactionConditionError(v,rule,items);if(condition){running.status='paused';messages.push(condition);continue}
  if(rule.catalysts?.some(id=>(v.contents[id]||0)<=1e-9)){running.status='paused';messages.push('Phản ứng tạm dừng: thiếu chất xúc tác đã khai báo.');continue}
  if((v.temperature??25)<(rule.minTemperature??20)){running.status='paused';messages.push('Phản ứng tạm dừng: cần bổ sung nhiệt theo điều kiện của bài.');continue}
  if(placementError(v)){running.status='paused';messages.push('Tạm dừng phản ứng: kiểm tra giá đỡ.');continue}
  const available=Math.min(...Object.entries(rule.reactants).filter(([id])=>!(rule.ambientOxygen&&id==='O2')).map(([id,n])=>(v.contents[id as ChemicalId]||0)/n!));
  const rate=reactionRate(v,rule.id);running.rate=rate;
  const extent=Math.max(0,Math.min(available,running.target-running.extent,running.target*dt*rate/(rule.durationSeconds??duration[rule.id]??10)));
  for(const [id,n] of Object.entries(rule.reactants)){if(rule.ambientOxygen&&id==='O2')continue;const key=id as ChemicalId;v.contents[key]=Math.max(0,(v.contents[key]||0)-n!*extent)}
  for(const [id,n] of Object.entries(rule.products)){
   const key=id as ChemicalId,amount=n!*extent;v.produced||={};v.produced[key]=(v.produced[key]||0)+amount;
   if(chemicals[key].phase==='khí'){
    const route=gasDestination(v,items,key);let captured=0;
    if(route.dest&&route.absorbing){captured=amount;route.dest.contents[key]=(route.dest.contents[key]||0)+amount;route.dest.gasReceiving=true;}else if(route.dest){captured=Math.min(amount,(route.dest.capacity-(route.dest.gasVolume||0))/24500);route.dest.gasReceiving=captured>0;route.dest.collected||={};route.dest.collected[key]=(route.dest.collected[key]||0)+captured;route.dest.contents[key]=(route.dest.contents[key]||0)+captured;route.dest.gasVolume=(route.dest.gasVolume||0)+captured*24500;route.dest.volume=Math.max(0,route.dest.capacity-route.dest.gasVolume)}
    v.escaped||={};v.escaped[key]=(v.escaped[key]||0)+amount-captured;
    if(v.lastObservation!==route.reason){messages.push(route.reason);v.lastObservation=route.reason}
   }else v.contents[key]=(v.contents[key]||0)+amount;
  }
  if(rule.id==='neutralization'&&v.volume>0)v.temperature=Math.min(98,(v.temperature??25)+57300*extent*(rule.reactants.HCl||1)/(v.volume*4.18));
  running.extent+=extent;
  if(running.extent>=running.target-1e-10||available<=extent+1e-10){running.status='complete';messages.push(rule.observation+` Tiến độ phản ứng: ${(running.extent*1000).toFixed(2)} mmol.`)}
 }
 // CO₂ entering a liquid is delivered to that vessel, then reacts there.
 for(const receiver of items.filter(v=>v.volume>0&&(v.contents.CO2||0)>1e-9&&v.reaction?.status!=='running')){
  const rules=reactionRules.filter(r=>['limewater','carbonate-redissolution'].includes(r.id));
  const result=startReaction(receiver,Date.now(),rules,items);if(!result.error)Object.assign(receiver,result.v);
 }
 for(const thermometer of items.filter(v=>v.type==='thermometer'))thermometer.temperature=items.find(v=>v.id===thermometer.mountedOn)?.temperature??25;
 return {items,messages:[...new Set(messages)]};
}
export function summarize(items:Vessel[]){const contents:Contents={},produced:Contents={},collected:Contents={},escaped:Contents={};for(const v of items){for(const [id,n] of Object.entries(v.contents)){const c=id as ChemicalId;if(chemicals[c]?.phase!=='khí')contents[c]=(contents[c]||0)+n!}for(const [dest,src] of [[produced,v.produced],[collected,v.collected],[escaped,v.escaped]] as [Contents,Contents|undefined][]){for(const [id,n] of Object.entries(src||{})){const c=id as ChemicalId;dest[c]=(dest[c]||0)+n!}}}for(const [id,n] of Object.entries(produced)){if(chemicals[id as ChemicalId].phase==='khí')contents[id as ChemicalId]=n}return {contents,produced,collected,escaped}}
export function addSubstance(v:Vessel,id:ChemicalId,quantity:number,concentration:number,unit:'mmol'|'mL'|'mg'){
 const error=placementError(v);if(error)return {v,error};if(!isContainer(v)||v.type==='gasJar')return {v,error:'Chọn dụng cụ phản ứng hoặc ống đong để thêm chất.'};if(v.sealed)return {v,error:'Tháo nút trước khi thêm hóa chất.'};
 if(v.reaction?.status==='running')return {v,error:'Đợi phản ứng hoặc tạm dừng trước khi thêm chất.'};
 if(!Number.isFinite(quantity)||quantity<=0||quantity>500||!Number.isFinite(concentration)||concentration<=0||concentration>2)return {v,error:'Lượng cần trong khoảng (0; 500], nồng độ trong khoảng (0; 2] M.'};
 const solid=chemicals[id].phase==='rắn';if(unit==='mg'&&!solid||unit==='mL'&&solid)return {v,error:'Đơn vị không phù hợp trạng thái chất.'};
 const masses=Object.fromEntries(Object.entries(chemicalProfiles).map(([id,c])=>[id,c.molarMass]));const mol=solid?(unit==='mg'?quantity/(masses[id]!*1000):quantity/1000):id==='indicator'?quantity*1e-6:id==='H2O'?0:unit==='mL'?quantity/1000*concentration:quantity/1000;
 const volume=solid||chemicals[id].phase==='khí'?0:id==='H2O'||id==='indicator'?quantity:unit==='mL'?quantity:quantity/concentration;
 if(v.volume+volume>v.capacity)return {v,error:'Vượt dung tích dụng cụ; giảm lượng thêm hoặc chọn bình lớn hơn.'};
 return {v:{...v,volume:v.volume+volume,animation:undefined,reaction:undefined,contents:{...v.contents,[id]:(v.contents[id]||0)+mol},lastAddition:{startedAt:Date.now(),chemical:id}},error:undefined};
}
