import {describe,expect,it} from 'vitest';
import {parseReactionEquation,checkDefinitionBalance} from './reactionDefinition';
const catalog=[{id:'CuSO4',formula:'CuSO4',phase:'dung dịch'},{id:'NaOH',formula:'NaOH',phase:'dung dịch'},{id:'Cu(OH)2',formula:'Cu(OH)2',phase:'kết tủa'},{id:'Na2SO4',formula:'Na2SO4',phase:'dung dịch'}];
describe('versioned reaction equation parser',()=>{
 it('parses precipitation notation and states without modifying coefficients',()=>{
  const definition=parseReactionEquation('CuSO₄(aq) + 2NaOH(aq) -> Cu(OH)₂(s)↓ + Na₂SO₄(aq)',catalog);
  expect(definition.products[0]).toEqual({formula:'Cu(OH)2',coefficient:1,state:'solid'});expect(checkDefinitionBalance(definition)).toBe(true);
  expect(()=>checkDefinitionBalance(parseReactionEquation('CuSO4 + NaOH -> Cu(OH)2 + Na2SO4',catalog))).toThrow('cân bằng');
 });
 it('retains ionic charges and detects charge imbalance',()=>{
  const equation=parseReactionEquation('Fe^2+ + Cl^- -> FeCl^+',[]);expect(checkDefinitionBalance(equation)).toBe(true);
  expect(()=>checkDefinitionBalance(parseReactionEquation('Fe^2+ -> Fe^3+',[]))).toThrow('điện tích');
 });
 it('rejects executable or malformed equation input',()=>{
  for(const value of ['<script>alert(1)</script>','CuSO4 -> NaOH -> H2O','CuSO4 + -> NaOH','Zn + 0HCl -> H2'])expect(()=>parseReactionEquation(value,catalog)).toThrow();
 });
});
