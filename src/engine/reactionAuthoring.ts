import { chemicals,reagents,type ChemicalId,type Contents } from "./chemicals";
import { reactionRules,type ReactionRule } from "./reactionRules";

export interface ReactionSpecies {chemical:string;coefficient:number}
export interface ReactionDraft {
 title:string;objectives:string;instructions:string;hints:string[];
 reactants:ReactionSpecies[];products:ReactionSpecies[];
 observation:string;explanation:string;source:string;minTemperature:number;durationSeconds:number;
}
const atoms:Partial<Record<ChemicalId,Record<string,number>>>= {
 Zn:{Zn:1},HCl:{H:1,Cl:1},CuSO4:{Cu:1,S:1,O:4},NaOH:{Na:1,O:1,H:1},ZnCl2:{Zn:1,Cl:2},
 H2:{H:2},'Cu(OH)2':{Cu:1,O:2,H:2},Na2SO4:{Na:2,S:1,O:4},NaCl:{Na:1,Cl:1},H2O:{H:2,O:1},
 H2O2:{H:2,O:2},O2:{O:2},MnO2:{Mn:1,O:2},CaCO3:{Ca:1,C:1,O:3}
};
export function draftFromRule(rule:ReactionRule):ReactionDraft {
 return {title:'',objectives:'',instructions:'',hints:['','',''],reactants:Object.entries(rule.reactants).map(([chemical,coefficient])=>({chemical,coefficient:coefficient!})),products:Object.entries(rule.products).map(([chemical,coefficient])=>({chemical,coefficient:coefficient!})),observation:rule.observation,explanation:rule.explanation,source:rule.source||'',minTemperature:rule.minTemperature??20,durationSeconds:rule.durationSeconds??10};
}
export function equationFor(draft:Pick<ReactionDraft,'reactants'|'products'>){
 const side=(rows:ReactionSpecies[],product=false)=>rows.map(r=>`${r.coefficient===1?'':r.coefficient}${chemicals[r.chemical as ChemicalId]?.formula||r.chemical}${product&&chemicals[r.chemical as ChemicalId]?.phase==='khí'?'↑':product&&chemicals[r.chemical as ChemicalId]?.phase==='kết tủa'?'↓':''}`).join(' + ');
 return side(draft.reactants)+' → '+side(draft.products,true);
}
export function validateReactionDraft(value:unknown):string|undefined{
 if(!value||typeof value!=='object')return 'Bản nháp phản ứng không hợp lệ.';
 const d=value as ReactionDraft;
 for(const side of ['reactants','products'] as const){
  const rows=d[side];if(!Array.isArray(rows)||!rows.length||rows.length>8)return 'Mỗi vế cần từ 1 đến 8 chất.';
  const ids=new Set<string>();
  for(const r of rows){
   if(!r||typeof r.chemical!=='string'||!Object.hasOwn(atoms,r.chemical))return 'Có chất chưa nằm trong thư viện mô phỏng. Hãy chọn chất có sẵn.';
   if(ids.has(r.chemical))return 'Một chất chỉ xuất hiện một lần trong mỗi vế.';ids.add(r.chemical);
   if(!Number.isInteger(r.coefficient)||r.coefficient<1||r.coefficient>20)return 'Hệ số phải là số nguyên từ 1 đến 20.';
   if(side==='reactants'&&!reagents.includes(r.chemical as ChemicalId))return 'Chất tham gia cần có trong kho hóa chất có thể thêm vào bình.';
  }
 }
 if(d.reactants.some(r=>d.products.some(p=>p.chemical===r.chemical)))return 'Không đặt cùng một chất ở hai vế; chất xúc tác không nằm trong hệ số tiêu thụ.';
 const sum=(rows:ReactionSpecies[])=>{const total:Record<string,number>={};for(const r of rows)for(const [a,n] of Object.entries(atoms[r.chemical as ChemicalId]!))total[a]=(total[a]||0)+n*r.coefficient;return total};
 const left=sum(d.reactants),right=sum(d.products);
 if([...new Set([...Object.keys(left),...Object.keys(right)])].some(k=>(left[k]||0)!==(right[k]||0)))return 'Phương trình chưa cân bằng nguyên tử. Hãy sửa các hệ số trước khi lưu.';
 if(!Number.isFinite(d.minTemperature)||d.minTemperature<20||d.minTemperature>98)return 'Nhiệt độ tối thiểu phải từ 20 đến 98°C.';
 if(!Number.isFinite(d.durationSeconds)||d.durationSeconds<1||d.durationSeconds>120)return 'Thời gian mô phỏng phải từ 1 đến 120 giây.';
 for(const k of ['observation','explanation'] as const)if(typeof d[k]!=='string'||!d[k].trim()||d[k].length>3000)return 'Điền hiện tượng và giải thích, tối đa 3.000 ký tự mỗi mục.';
 if(typeof d.source!=='string')return 'Điền đường dẫn nguồn giáo viên đã kiểm tra.';
 try{const url=new URL(d.source);if(!['https:','http:'].includes(url.protocol))throw new Error()}catch{return 'Điền đường dẫn http/https đến nguồn phản ứng để đối chiếu.'}
 return undefined;
}
export function compileReaction(draft:ReactionDraft,id:string):ReactionRule{
 const error=validateReactionDraft(draft);if(error)throw new Error(error);
 const reactants=Object.fromEntries(draft.reactants.map(r=>[r.chemical,r.coefficient])) as Contents;
 const products=Object.fromEntries(draft.products.map(r=>[r.chemical,r.coefficient])) as Contents;
 const canonical=reactionRules.find(r=>{
  const pairs=[...Object.entries(r.reactants).map(([k,n])=>[n!,reactants[k as ChemicalId]||0]),...Object.entries(r.products).map(([k,n])=>[n!,products[k as ChemicalId]||0])];
  return Object.keys(r.reactants).length===draft.reactants.length&&Object.keys(r.products).length===draft.products.length&&pairs.every(([n,m])=>m>0&&Math.abs(m/n-pairs[0][1]/pairs[0][0])<1e-9);
 });
 const effect=draft.products.some(p=>chemicals[p.chemical as ChemicalId].phase==='khí')?'bubbles':draft.products.some(p=>chemicals[p.chemical as ChemicalId].phase==='kết tủa')?'precipitate':canonical?.effect||'none';
 return {id:canonical?.id||'teacher:'+id,reactants,products,equation:equationFor(draft),effect,observation:draft.observation,explanation:draft.explanation,source:draft.source,minTemperature:draft.minTemperature,durationSeconds:draft.durationSeconds,teacherReviewed:true};
}
