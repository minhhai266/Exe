import { chemicals,type ChemicalId } from './chemicals';
import { chemicalProfiles } from './catalog';
import { equipmentLibrary,type EquipmentType,type Vessel } from './equipment';
import type { ExplanationPolicy } from './learningPolicy';
import type { Experiment } from '../features/experiments/data';
import type { LabEvent } from './labSession';

export type StockUnit='mg'|'mL';
export interface ChemicalStock{id:ChemicalId;quantity:number;unit:StockUnit;concentration:number}
export interface RubricCriterion{id:string;label:string;points:number;kind:'product'|'collectGas'|'dosage'|'observation'|'equation'|'teacher';chemical?:ChemicalId;targetQuantity?:number;tolerance?:number}
export interface AssignmentConfig{catalogApparatusIds?:string[];version:1;experiment:Experiment;stock:ChemicalStock[];equipment:EquipmentType[];minutes:number;hintsAllowed:boolean;explanation:ExplanationPolicy;questions:string[];rubric:RubricCriterion[]}
export function defaultAssignmentConfig(experiment:Experiment):AssignmentConfig{const ids=[...experiment.reagents];if(['H2','O2'].includes(experiment.product)&&!ids.includes('H2O'))ids.push('H2O');if(experiment.simulation)return {...structuredClone(experiment.simulation),version:1,experiment:structuredClone(experiment),questions:experiment.questions||[]};return {version:1,experiment:structuredClone(experiment),stock:ids.map(id=>({id,quantity:id==='H2O'?300:chemicals[id].phase==='rắn'?1000:50,unit:chemicals[id].phase==='rắn'?'mg':'mL',concentration:1})),equipment:equipmentLibrary.map(e=>e.type),minutes:0,hintsAllowed:true,explanation:'after-submit',questions:experiment.questions?.length?[...experiment.questions]:['Mô tả hiện tượng quan sát được.','Viết phương trình và giải thích kết quả.'],rubric:[{id:'product',label:'Tạo sản phẩm theo mục tiêu',points:4,kind:'product'},{id:'observation',label:'Quan sát và lập luận (giáo viên chấm)',points:3,kind:'teacher'},{id:'conclusion',label:'Phương trình và kết luận (giáo viên chấm)',points:3,kind:'teacher'}]}}
export function validateConfig(config:AssignmentConfig,allowIncomplete=false){
 if(!config||config.version!==1||!Array.isArray(config.stock)||config.stock.length>20||!Array.isArray(config.equipment)||config.equipment.length>30||!Array.isArray(config.rubric)||config.rubric.length>20||!Array.isArray(config.questions)||config.questions.length>30||!config.questions.every(q=>typeof q==='string'&&q.length<=4000)||typeof config.hintsAllowed!=='boolean'||!['always','after-submit','never'].includes(config.explanation))throw new Error('Cấu hình thực hành không đúng định dạng.');
 if(!Number.isFinite(config.minutes)||config.minutes<0||config.minutes>240)throw new Error('Thời gian cần nằm trong khoảng 0–240 phút.');
 if(!allowIncomplete&&!config.stock.length||new Set(config.stock.map(s=>s.id)).size!==config.stock.length)throw new Error('Chọn hóa chất không trùng lặp.');
 for(const s of config.stock)if(!s||!Object.hasOwn(chemicals,s.id)||!Number.isFinite(s.quantity)||s.quantity<=0||s.quantity>100000||s.unit!==(chemicals[s.id].phase==='rắn'?'mg':'mL')||!Number.isFinite(s.concentration)||s.concentration<=0||s.concentration>2)throw new Error('Kiểm tra lượng chất, đơn vị và nồng độ (0–2 M).');
 if(!allowIncomplete&&!config.equipment.length||config.equipment.some(t=>!equipmentLibrary.some(e=>e.type===t)))throw new Error('Chọn dụng cụ hợp lệ.');
 if(!config.rubric.length||config.rubric.some(r=>!Number.isFinite(r.points)||r.points<0)||Math.abs(config.rubric.reduce((n,r)=>n+r.points,0)-10)>.001)throw new Error('Tổng trọng số rubric phải bằng 10 điểm.');
 if(new Set(config.rubric.map(r=>r.id)).size!==config.rubric.length||config.rubric.some(r=>typeof r.id!=='string'||!r.id||typeof r.label!=='string'||r.label.length>300||!['product','collectGas','dosage','observation','equation','teacher'].includes(r.kind)))throw new Error('Rubric có mã hoặc loại tiêu chí không hợp lệ.');
 for(const r of config.rubric)if(r.kind==='dosage'&&(!config.stock.some(s=>s.id===r.chemical)||!Number.isFinite(r.targetQuantity)||!(r.targetQuantity!>0)||!Number.isFinite(r.tolerance??0)||(r.tolerance??0)<0))throw new Error('Tiêu chí lượng chất cần chọn chất, lượng mục tiêu và sai số hợp lệ.');
}
export function stockCost(id:ChemicalId,quantity:number,unit:'mmol'|'mL'|'mg',concentration:number){
 if(!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(concentration)||concentration<=0)return NaN;
 if(chemicals[id].phase==='rắn')return unit==='mg'?quantity:unit==='mmol'?quantity*chemicalProfiles[id].molarMass:NaN;
 return unit==='mg'?NaN:unit==='mL'||id==='H2O'||id==='indicator'?quantity:quantity/concentration;
}
export function consumeStock(config:AssignmentConfig|undefined,used:Partial<Record<ChemicalId,number>>,id:ChemicalId,quantity:number,unit:'mmol'|'mL'|'mg',concentration:number){
 if(!config)return {used,error:undefined};const stock=config.stock.find(s=>s.id===id);if(!stock)return {used,error:'Hóa chất không được cấp cho bài này.'};
 if(chemicals[id].phase==='dung dịch'&&Math.abs(concentration-stock.concentration)>1e-9)return {used,error:`Dung dịch được cấp có nồng độ ${stock.concentration} M.`};
 const cost=stockCost(id,quantity,unit,concentration);if(!Number.isFinite(cost))return {used,error:'Lượng hoặc đơn vị không hợp lệ.'};
 if((used[id]||0)+cost>stock.quantity+1e-8)return {used,error:'Không đủ hóa chất còn lại trong kho bài giao.'};
 return {used:{...used,[id]:(used[id]||0)+cost},error:undefined};
}
export function gradeRubric(config:AssignmentConfig,vessels:Vessel[],events:LabEvent[],notes:string,used:Partial<Record<ChemicalId,number>>={}){return config.rubric.map(r=>{
 const produced=vessels.reduce((n,v)=>n+(v.produced?.[config.experiment.product]||0),0),collected=vessels.reduce((n,v)=>n+(v.collected?.[config.experiment.product]||0),0);
 const amount=r.chemical?used[r.chemical]||0:0;
 const met=r.kind==='product'?produced>1e-9:r.kind==='collectGas'?collected>1e-9:r.kind==='dosage'?r.targetQuantity!==undefined&&Math.abs(amount-r.targetQuantity)<=(r.tolerance??0)+1e-8:false;
 return {...r,earned:r.kind==='teacher'||r.kind==='observation'||r.kind==='equation'?null:met?r.points:0,evidence:r.kind==='product'?{produced}:r.kind==='collectGas'?{collected}:r.kind==='dosage'?{chemical:r.chemical,used:amount,target:r.targetQuantity,tolerance:r.tolerance??0}:{answerProvided:!!notes.trim(),events:events.length}};
})}
