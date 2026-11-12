import { type ChemicalId,type Contents } from "./chemicals";
import { reactionRules } from "./reactionRules";
export { addSubstance,startReaction,stepSimulation,summarize } from './timeSimulation';
/** Pure stoichiometric endpoint helper. Live lab updates use stepSimulation. */
export function react(contents:Contents) {
 const rule = reactionRules.find(r => Object.entries(r.reactants).every(([id]) => (contents[id as ChemicalId]||0)>1e-9));
 if(!rule) return {contents:{...contents},error:'Chưa hỗ trợ mô phỏng phản ứng này',rule:undefined,extent:0};
 const extent = Math.min(...Object.entries(rule.reactants).map(([id,n])=>(contents[id as ChemicalId]||0)/n!));
 const next = {...contents};
 for(const [id,n] of Object.entries(rule.reactants)) next[id as ChemicalId]=Math.max(0,(next[id as ChemicalId]||0)-n!*extent);
 for(const [id,n] of Object.entries(rule.products)) next[id as ChemicalId]=(next[id as ChemicalId]||0)+n!*extent;
 return {contents:next,rule,extent,error:undefined};
}
