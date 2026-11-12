import { describe,expect,it } from 'vitest';
import { createEquipment } from "./equipment";
import { compileReaction,draftFromRule,validateReactionDraft } from "./reactionAuthoring";
import { reactionRules } from "./reactionRules";
import { startReaction,stepSimulation } from "./timeSimulation";
const draft=()=>({...draftFromRule(reactionRules.find(r=>r.id==='precipitate')!),source:'https://chem.example.edu/copper'});
describe('teacher-authored reactions',()=>{
 it('accepts balanced chemistry and derives appearance from products',()=>{
  const d=draft();expect(validateReactionDraft(d)).toBeUndefined();const rule=compileReaction(d,'lesson');
  expect(rule.id).toBe('precipitate');expect(rule.effect).toBe('precipitate');expect(rule.equation).toContain('Cu(OH)₂↓');
 });
 it('rejects unbalanced, unknown, duplicate, zero and missing-source drafts',()=>{
  let d=draft();d.reactants[1].coefficient=1;expect(validateReactionDraft(d)).toContain('cân bằng');
  d=draft();d.products[0].chemical='UNKNOWN';expect(validateReactionDraft(d)).toContain('thư viện');
  d=draft();d.reactants.push(d.reactants[0]);expect(validateReactionDraft(d)).toContain('một lần');
  d=draft();d.reactants[0].coefficient=0;expect(validateReactionDraft(d)).toContain('Hệ số');
  d=draft();d.source='javascript:alert(1)';expect(validateReactionDraft(d)).toContain('http/https');
 });
 it('uses an isolated rule snapshot through save/reload and observes temperature conditions',()=>{
  const d=draft();d.minTemperature=40;d.durationSeconds=2;
  const rule=compileReaction(d,'lesson');const v=createEquipment('beaker','b',200,400);v.volume=30;v.contents={CuSO4:.01,NaOH:.02};
  expect(startReaction(v,0,[rule]).error).toContain('40');v.temperature=45;
  let items=JSON.parse(JSON.stringify([startReaction(v,0,[rule]).v]));
  for(let i=0;i<30;i++)items=stepSimulation(items,.1).items;
  expect(items[0].contents['Cu(OH)2']).toBeCloseTo(.01);expect(items[0].reaction.status).toBe('complete');
  expect(reactionRules.find(r=>r.id==='precipitate')?.minTemperature).toBeUndefined();
 });
 it('does not progress when temperature falls below the authored condition',()=>{
  const d=draft();d.minTemperature=40;const rule=compileReaction(d,'lesson');
  const v=createEquipment('beaker','b',200,400);v.volume=30;v.contents={CuSO4:.01,NaOH:.02};v.temperature=45;
  const started=startReaction(v,0,[rule]).v;started.temperature=25;
  const result=stepSimulation([started],.1).items[0];expect(result.reaction?.status).toBe('paused');expect(result.contents.CuSO4).toBe(.01);
 });
});
