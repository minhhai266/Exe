import type { ChemicalId } from "./chemicals";
export type Goal = 'product'|'observe'|'equation'|'collectGas';
export const goalLabels:Record<Goal,string> = {product:'Tạo được sản phẩm mục tiêu',observe:'Ghi lại quan sát của em',equation:'Xác nhận phương trình phản ứng',collectGas:'Thu được ít nhất 50% khí đã tạo (tối thiểu 1 mmol)'};
export function evaluateGoals(goals:Goal[], product:ChemicalId, contents:Partial<Record<ChemicalId,number>>, notes:string, equation:boolean,collected:Partial<Record<ChemicalId,number>>={}) {
 const checks = {product:(contents[product]||0)>1e-9,observe:notes.trim().length>=10,equation,collectGas:(collected[product]||0)>=.001-1e-9&&(collected[product]||0)>=.5*(contents[product]||0)};
 return {checks,score:Math.round(goals.filter(g=>checks[g]).length/Math.max(1,goals.length)*100),success:goals.every(g=>checks[g])};
}
