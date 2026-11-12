import {randomUUID} from 'node:crypto';
import {ApiError} from '../admin/security';
import {numeric,source,text,validateContent} from '../admin/validation';
import type {AdminDatabase} from '../admin/database';
import {chemicals,reagents,type ChemicalId} from '../../src/engine/chemicals';
import {reactionRules,type ReactionRule} from '../../src/engine/reactionRules';
import {availablePhenomena,suggestedEffect} from '../../src/engine/phenomena';
import {checkDefinitionBalance,definitionEquation,phaseToState,type ReactionDefinition,type DefinitionChemical,type AssessmentQuestion} from '../../src/engine/reactionDefinition';
import {plainFormula} from '../../src/features/admin/domain';
import {defaultReactionSimulation} from '../../src/engine/reactionConfiguration';
import {validateConfig} from '../../src/engine/assignmentLab';
import {visualEffectRegistry} from '../../src/engine/effectComposer';
import {chemicalProfiles} from '../../src/engine/catalog';

function object(value:any,allowed:string[],label:string){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!allowed.includes(key)))throw new ApiError(400,`${label} không đúng schema phiên bản 1.`);
 return value;
}
export function normalizeDefinition(value:unknown,ai=false):ReactionDefinition{
 const d=object(value,['schemaVersion','name','reactants','products','conditions','observation','explanation','source','durationSeconds','learning','questions','simulation'],'Định nghĩa phản ứng');
 if(d.schemaVersion!==1)throw new ApiError(400,'Phiên bản định nghĩa phản ứng chưa được hỗ trợ.');
 const species=(input:any)=>{
  if(!Array.isArray(input)||input.length<1||input.length>12)throw new ApiError(400,'Mỗi vế cần 1–12 chất.');
  return input.map(p=>{object(p,['formula','coefficient','state'],'Chất');const formula=plainFormula(text(p.formula,'Công thức',100));if(!['solid','liquid','aqueous','gas'].includes(p.state))throw new ApiError(400,'Trạng thái vật chất không hợp lệ.');if(!Number.isInteger(p.coefficient))throw new ApiError(400,'Hệ số cần là số nguyên.');return {formula,coefficient:numeric(p.coefficient,'Hệ số',1,100),state:p.state}});
 };
 const c=object(d.conditions,['contactRequired','heatingRequired','minTemperature','catalysts'],'Điều kiện'),l=object(d.learning,['grade','purpose','mode','explanationLevel','objectives','instructions'],'Mục tiêu học tập');
 if(typeof c.contactRequired!=='boolean'||typeof c.heatingRequired!=='boolean'||!Array.isArray(c.catalysts)||c.catalysts.length>4)throw new ApiError(400,'Điều kiện chưa đúng định dạng.');
 if(!Number.isInteger(l.grade)||!['guided','exploration'].includes(l.mode)||!['brief','detailed'].includes(l.explanationLevel))throw new ApiError(400,'Cấu hình bài học không hợp lệ.');
 const result:ReactionDefinition={schemaVersion:1,name:text(d.name,'Tên phản ứng',180),reactants:species(d.reactants),products:species(d.products),conditions:{contactRequired:c.contactRequired,heatingRequired:c.heatingRequired,minTemperature:numeric(c.minTemperature,'Nhiệt độ',20,98),catalysts:c.catalysts.map((id:any)=>text(id,'Chất xúc tác',100))},observation:text(d.observation,'Hiện tượng',3000,false),explanation:text(d.explanation,'Giải thích',3000,false),source:source(d.source,false),durationSeconds:numeric(d.durationSeconds,'Thời gian minh họa',1,120),learning:{grade:numeric(l.grade,'Lớp',8,12),purpose:text(l.purpose,'Mục đích',1000,false),mode:l.mode,explanationLevel:l.explanationLevel,objectives:text(l.objectives,'Mục tiêu',3000,false),instructions:text(l.instructions,'Hướng dẫn',3000,false)},questions:normalizeQuestions(d.questions,ai)};
 if(d.simulation){
  const s=object(d.simulation,['stock','equipment','minutes','hintsAllowed','explanation','rubric','hints','difficulty'],'Cấu hình mô phỏng');
  if(!Array.isArray(s.stock)||s.stock.length>20||!Array.isArray(s.equipment)||s.equipment.length>30||!Array.isArray(s.rubric)||s.rubric.length>20||!Array.isArray(s.hints)||s.hints.length>10||typeof s.hintsAllowed!=='boolean'||!['always','after-submit','never'].includes(s.explanation))throw new ApiError(400,'Cấu hình kho và rubric không hợp lệ.');
  result.simulation={stock:s.stock.map((r:any)=>{object(r,['id','quantity','unit','concentration'],'Kho hóa chất');return {...r}}),equipment:[...s.equipment],minutes:numeric(s.minutes,'Thời gian',0,240),hintsAllowed:s.hintsAllowed,explanation:s.explanation,rubric:s.rubric.map((r:any)=>{object(r,['id','label','points','kind','chemical','targetQuantity','tolerance'],'Rubric');if(!['product','collectGas','dosage','observation','equation','teacher'].includes(r.kind))throw new ApiError(400,'Loại rubric không hợp lệ.');return {...r,id:text(r.id,'ID rubric',100),label:text(r.label,'Nhãn rubric',300)}}),hints:s.hints.map((h:any)=>text(h,'Gợi ý',1000,false)).filter(Boolean),difficulty:text(s.difficulty,'Độ khó',100)};
  try{validateConfig({...result.simulation,version:1,experiment:{} as any,questions:[]},true)}catch(error){throw new ApiError(400,(error as Error).message)}
 }
 return result;
}
export function normalizeQuestions(value:unknown,ai=false):AssessmentQuestion[]{
 if(!Array.isArray(value)||value.length>8)throw new ApiError(400,'Tối đa 8 câu hỏi mỗi lần.');
 const seen=new Set<string>();
 return value.map(q=>{
  object(q,['id','type','prompt','choices','answer','reviewed','difficulty','objective','points'],'Câu hỏi');
  const id=q.id?text(q.id,'Mã câu hỏi',100):randomUUID();if(seen.has(id))throw new ApiError(400,'Mã câu hỏi bị trùng.');seen.add(id);
  if(!['multiple-choice','true-false','equation','observation','explanation','calculation','application'].includes(q.type)||!Array.isArray(q.choices)||q.choices.length>6||typeof q.reviewed!=='boolean')throw new ApiError(400,'Định dạng câu hỏi không hợp lệ.');
  if(q.type==='multiple-choice'&&q.choices.length<2)throw new ApiError(400,'Câu trắc nghiệm cần ít nhất hai lựa chọn.');
  if(q.difficulty&&!['easy','medium','hard'].includes(q.difficulty))throw new ApiError(400,'Độ khó câu hỏi không hợp lệ.');
  return {id,type:q.type,prompt:text(q.prompt,'Câu hỏi',3000),choices:q.choices.map((choice:any)=>text(choice,'Lựa chọn',1000)),answer:text(q.answer,'Đáp án / hướng dẫn chấm',3000,false),reviewed:ai?false:q.reviewed,...(q.difficulty?{difficulty:q.difficulty}:{}),...(q.objective?{objective:text(q.objective,'Mục tiêu câu hỏi',1000)}:{}),...(q.points!==undefined?{points:numeric(q.points,'Điểm câu hỏi',0,10)}:{}),...(ai?{difficulty:q.difficulty||'medium',objective:typeof q.objective==='string'?q.objective:'',points:q.points??1}:{})};
 });
}
export function chemicalCatalog(store:AdminDatabase):DefinitionChemical[]{return store.all("SELECT id,formula,status,json_extract(data,'$.phase') phase,json_extract(data,'$.molarMass') molarMass FROM chemicals")}
export function reactionData(definition:ReactionDefinition,catalog:DefinitionChemical[]){
 const map=(rows:ReactionDefinition['reactants'])=>rows.map(p=>({chemical:catalog.find(c=>c.formula===p.formula)?.id||p.formula,coefficient:p.coefficient}));
 const reactants=map(definition.reactants),products=map(definition.products);
 const composition={reactants:Object.fromEntries(reactants.map(p=>[p.chemical,p.coefficient])),products:Object.fromEntries(products.map(p=>[p.chemical,p.coefficient]))};
 return {requiredCatalysts:definition.conditions.catalysts.map(formula=>catalog.find(c=>c.formula===formula)?.id||formula),reactants,products,effect:suggestedEffect(composition),phenomena:availablePhenomena(composition),minTemperature:definition.conditions.minTemperature,durationSeconds:definition.durationSeconds,conditions:definition.conditions.catalysts.length?'Xúc tác: '+definition.conditions.catalysts.join(', '):definition.conditions.heatingRequired?'Cần gia nhiệt':'Trộn các chất trong cùng dụng cụ.',observation:definition.observation,explanation:definition.explanation,source:definition.source,reviewed:false,type:''};
}
export interface StudioValidation{balanceValid:boolean;support:'SUPPORTED'|'PARTIALLY_SUPPORTED'|'UNSUPPORTED';science:'library-verified'|'human-reviewed'|'pending-review';issues:string[];reference?:{id:string;version:number;source:string};previewAllowed:boolean;effect:string;phenomena:string[];effects:string[];apparatus:string[]}
export function assessDefinition(store:AdminDatabase,definition:ReactionDefinition,humanReviewed=false):StudioValidation{
 const catalog=chemicalCatalog(store),data=reactionData(definition,catalog),issues:string[]=[];let balanceValid=true,support:StudioValidation['support']='SUPPORTED';
 try{checkDefinitionBalance(definition)}catch(error){balanceValid=false;issues.push((error as Error).message);support='UNSUPPORTED'}
 for(const p of [...definition.reactants,...definition.products]){
  const chemical=catalog.find(c=>c.formula===p.formula);
  if(!chemical||chemical.status!=='published'){issues.push(`Chất ${p.formula} chưa có trong thư viện đã xuất bản.`);support='UNSUPPORTED'}
  else if(!Object.hasOwn(chemicals,chemical.id)){issues.push(`Chưa có mô hình vật chất cho ${p.formula}.`);if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
  else if(phaseToState(chemical.phase)!==p.state){issues.push(`Trạng thái ${p.formula} khác dữ liệu thư viện.`);support='UNSUPPORTED'}
  else if(plainFormula(chemicals[chemical.id as ChemicalId].formula)!==p.formula||phaseToState(chemicals[chemical.id as ChemicalId].phase)!==p.state||chemical.molarMass!==undefined&&Math.abs(chemical.molarMass-chemicalProfiles[chemical.id as ChemicalId].molarMass)>1e-4){issues.push(`Dữ liệu ${p.formula} khác mô hình vật chất/định lượng hiện có trong engine.`);if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
 }
 for(const p of data.reactants)if(!reagents.includes(p.chemical as ChemicalId)||['H2O','indicator'].includes(p.chemical)){issues.push(`Engine chưa định lượng ${p.chemical} như chất tham gia trong cấu hình này.`);if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
 if(!definition.conditions.contactRequired){issues.push('Mô hình hiện yêu cầu các chất tiếp xúc trong cùng dụng cụ.');if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
 if(definition.conditions.heatingRequired!==(definition.conditions.minTemperature>25)){issues.push('Điều kiện gia nhiệt và nhiệt độ tối thiểu chưa nhất quán.');if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
 const same=(left:any[],right:any[])=>left.length===right.length&&left.every(p=>right.some(q=>q.chemical===p.chemical&&q.coefficient===p.coefficient));
 const reference=store.all("SELECT id,version,data FROM reactions WHERE status='published'").find(row=>{const r=JSON.parse(row.data);return r.reviewed&&r.source&&same(r.reactants,data.reactants)&&same(r.products,data.products)&&definition.conditions.minTemperature>=(r.minTemperature||20)});
 const canonical=reactionRules.find(rule=>same(Object.entries(rule.reactants).map(([chemical,coefficient])=>({chemical,coefficient})),data.reactants)&&same(Object.entries(rule.products).map(([chemical,coefficient])=>({chemical,coefficient})),data.products));
 if(definition.conditions.catalysts.some(formula=>formula!=='MnO2'||canonical?.id!=='oxygen')){issues.push('Chưa có mô hình động học cho chất xúc tác đã chọn.');if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
 try{validateContent('reactions',{name:definition.name,code:'studio-validation',status:'draft',data},store)}catch(error){issues.push((error as Error).message);support='UNSUPPORTED'}
 const science=humanReviewed?'human-reviewed':reference?'library-verified':'pending-review';
 if(science==='pending-review')issues.push('Chưa có đối chiếu khoa học độc lập với đề xuất AI. Cần người có chuyên môn kiểm tra nguồn.');
 const simulation=definition.simulation||defaultReactionSimulation(definition);
 if(!simulation.equipment.some(type=>['beaker','flask','tube','roundFlask'].includes(type))){issues.push('Cần cấp ít nhất một dụng cụ phản ứng.');if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
 if(definition.conditions.heatingRequired&&(!simulation.equipment.includes('burner')||!simulation.equipment.some(type=>['stand','tripod'].includes(type)))){issues.push('Cấu hình gia nhiệt cần đèn và giá đỡ phù hợp.');if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
 for(const p of data.reactants)if(!simulation.stock.some(s=>s.id===p.chemical)){issues.push(`Kho chưa cấp ${p.chemical}.`);if(support!=='UNSUPPORTED')support='PARTIALLY_SUPPORTED'}
 const effectMap:Record<string,string>={'gas':'GAS_BUBBLES','gas-collection':'GAS_FLOW','precipitate':'PRECIPITATE_FORMATION','solid-consumption':'SOLID_DISSOLUTION','color-transition':'COLOR_TRANSITION'};
 const effects=[...new Set([...data.phenomena.map(code=>effectMap[code]).filter(Boolean),'LIQUID_MIXING',...(definition.conditions.heatingRequired?['HEATING']:[])])].filter(code=>visualEffectRegistry.some(effect=>effect.code===code&&effect.supported));
 return {balanceValid,support,science,issues:[...new Set(issues)],reference:reference?{id:reference.id,version:reference.version,source:JSON.parse(reference.data).source}:undefined,previewAllowed:balanceValid&&support==='SUPPORTED'&&science!=='pending-review',effect:data.effect,phenomena:data.phenomena,effects,apparatus:simulation.equipment};
}
export function compileDefinition(store:AdminDatabase,definition:ReactionDefinition,id:string):ReactionRule{
 const data=reactionData(definition,chemicalCatalog(store));
 const matches=(a:any,b:any)=>Object.keys(a).length===Object.keys(b).length&&Object.entries(a).every(([key,n])=>b[key]===n);
 const reactants=Object.fromEntries(data.reactants.map(p=>[p.chemical,p.coefficient])),products=Object.fromEntries(data.products.map(p=>[p.chemical,p.coefficient]));
 const canonical=reactionRules.find(rule=>matches(rule.reactants,reactants)&&matches(rule.products,products));
 return {id:canonical?.id||'studio:'+id,reactants,products,equation:definitionEquation(definition),effect:data.effect,phenomena:data.phenomena,catalysts:definition.conditions.catalysts.map(formula=>chemicalCatalog(store).find(c=>c.formula===formula)!.id as ChemicalId),observation:definition.observation,explanation:definition.explanation,source:definition.source,minTemperature:data.minTemperature,durationSeconds:data.durationSeconds,teacherReviewed:true};
}
