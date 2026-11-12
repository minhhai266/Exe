import type { Experiment } from "../features/experiments/data";
import { chemicals,type ChemicalId } from "./chemicals";
import { heightOf } from "./connectionLogic";
import { createEquipment,type EquipmentType,type Vessel } from "./equipment";
import { reactionRules } from "./reactionRules";
import { addSubstance } from "./timeSimulation";
export function prepareCollector(v:Vessel){const r=(v.rotation||0)*Math.PI/180,h=heightOf(v.type)/2;return {...v,x:v.x+h*Math.sin(r),y:v.y-h*Math.cos(r)-h,rotation:180,prepared:true,volume:v.capacity,contents:{}}}
export function quickSetup(experiment:Experiment,uuid:()=>string=()=>crypto.randomUUID()){
 if(experiment.id==='acid-base-identification'){
  const acid=createEquipment('beaker',uuid(),300,425),base=createEquipment('beaker',uuid(),630,425);
  const items=[addSubstance(acid,'HCl',20,1,'mL').v,addSubstance(base,'NaOH',20,1,'mL').v,createEquipment('litmusPaper',uuid(),170,440),createEquipment('litmusPaper',uuid(),760,440)];
  return {items,sourceId:items[0].id,message:'Đã chuẩn bị hai cốc HCl, NaOH và hai mẩu quỳ tím. Kéo từng mẩu vào từng cốc hoặc chọn cốc rồi Thử quỳ tím.'};
 }
 const rule=experiment.customReaction||reactionRules.find(r=>Object.keys(r.reactants).every(c=>experiment.reagents.includes(c as ChemicalId)));
 if(!rule)return {items:[] as Vessel[],sourceId:'',message:'Bài này chưa có bộ chuẩn bị nhanh phù hợp.'};
 const gas=Object.keys(rule.products).some(c=>chemicals[c as ChemicalId].phase==='khí');
 const type:EquipmentType=rule.heating==='water-bath'||rule.id==='oxygen-permanganate'?'tube':gas?'flask':'beaker';
 if(!experiment.demo&&!experiment.equipment.includes(type))return {items:[] as Vessel[],sourceId:'',message:'Hãy tự lắp dụng cụ theo cấu hình giáo viên đã chọn.'};
 let source=createEquipment(type,uuid(),gas?300:440,gas?365:425);const items:Vessel[]=[];
 if(gas){const stand=createEquipment('stand',uuid(),255,440);source.mountedOn=stand.id;items.push(stand)}
 if(rule.heating==='water-bath'){
  const bath=createEquipment('waterBath',uuid(),430,350);bath.volume=150;
  const tripod=createEquipment('tripod',uuid(),430,455);bath.mountedOn=tripod.id;
  source={...source,x:430,y:338,mountedOn:bath.id};items.push(tripod,bath);
 }
 const extent=experiment.id==='carbon-dioxide-test'?.001:rule.id==='oxygen-permanganate'?.001:rule.heating==='water-bath'?.005:experiment.customReaction ? .01 : (rule.id==='precipitate'||rule.id==='neutralization' ? .04 : .01);
 // For the indicator lesson, begin with base so learners can see pink before adding acid.
 for(const [id,coefficient] of Object.entries(rule.reactants)){
  if(rule.ambientOxygen&&id==='O2')continue;
  if(rule.id==='neutralization'&&id==='HCl')continue;
  const c=id as ChemicalId;const added=addSubstance(source,c,coefficient!*extent*1000,c==='H2O2'?.5:experiment.id==='carbon-dioxide-test'&&c==='HCl'?.1:1,'mmol');
  if(added.error)return {items:[] as Vessel[],sourceId:'',message:added.error};source=added.v;
 }
 if(rule.id==='oxygen'&&experiment.reagents.includes('MnO2'))source=addSubstance(source,'MnO2',.5,1,'mmol').v;
 if(rule.id==='neutralization'&&experiment.reagents.includes('indicator'))source=addSubstance(source,'indicator',.1,1,'mL').v;
 for(const catalyst of rule.catalysts||[])source=addSubstance(source,catalyst,.05,1,'mmol').v;
 if(rule.minTemperature){
  if(type==='beaker'){const tripod=createEquipment('tripod',uuid(),source.x,455);source.y=350;source.mountedOn=tripod.id;items.push(tripod)}
  items.push(createEquipment('alcoholBurner',uuid(),source.x,440));
 }
 if(rule.requiresStirring)items.push(createEquipment('rod',uuid(),650,440));
 items.push(source);
 if(gas){const stopper=createEquipment('stopper',uuid(),source.x,source.y-heightOf(type));stopper.mountedOn=source.id;source.sealed=true;
  if(experiment.id==='carbon-dioxide-test'){
   const receiver=createEquipment('beaker',uuid(),750,425);const prepared=addSubstance(receiver,'Ca(OH)2',100,.02,'mL').v;source.connections=[];items.push(stopper,prepared);
  }else{const receiver=createEquipment('gasJar',uuid(),760,260);receiver.rotation=180;receiver.volume=receiver.capacity;receiver.prepared=true;source.connections=[];items.push(stopper,receiver)}
 }
 return {items,sourceId:source.id,message:rule.id==='neutralization'?'Đã chuẩn bị NaOH'+(experiment.reagents.includes('indicator')?' và chỉ thị hồng':'')+'. Bấm “Thêm HCl & chạy” để quan sát trung hòa.':'Đã chuẩn bị dụng cụ và lượng chất mẫu. Nối hai cổng nếu cần thu khí, rồi bấm “Bắt đầu phản ứng”. Bạn có thể chỉnh lượng chất theo ý mình.'};
}
