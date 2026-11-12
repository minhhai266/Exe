import type {ReactionDefinition,ReactionSimulation} from './reactionDefinition';
import {chemicals,type ChemicalId} from './chemicals';
import {plainFormula} from '../features/admin/domain';
export function defaultReactionSimulation(d:ReactionDefinition):ReactionSimulation{
 const formulas=[...d.reactants.map(p=>p.formula),...d.conditions.catalysts];
 const ids=Object.keys(chemicals).filter(id=>formulas.includes(plainFormula(chemicals[id as ChemicalId].formula))) as ChemicalId[];
 if(d.products.some(p=>p.state==='gas')&&!ids.includes('H2O'))ids.push('H2O');
 return {stock:ids.map(id=>({id,quantity:id==='H2O'?300:chemicals[id].phase==='rắn'?1000:50,unit:chemicals[id].phase==='rắn'?'mg':'mL',concentration:1})),equipment:['beaker','flask','tube','rack','stand','clamp','tripod','stopper','tubing','gasJar','burner'],minutes:15,hintsAllowed:true,explanation:'after-submit',rubric:[{id:'product',label:'Tạo sản phẩm theo mục tiêu',points:4,kind:'product'},{id:'observation',label:'Quan sát và lập luận',points:3,kind:'teacher'},{id:'conclusion',label:'Phương trình và kết luận',points:3,kind:'teacher'}],hints:[],difficulty:'Cơ bản'};
}
