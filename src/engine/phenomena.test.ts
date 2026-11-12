import {describe,expect,it} from 'vitest';
import {availablePhenomena,suggestedEffect} from './phenomena';
import {reactionRules} from './reactionRules';

describe('observable phenomena from the simulation model',()=>{
 it('recognizes concurrent gas production and consumption of zinc',()=>{
  const rule=reactionRules.find(rule=>rule.id==='hydrogen')!;
  expect(availablePhenomena(rule)).toEqual(expect.arrayContaining(['gas','solid-consumption','gas-collection']));
  expect(availablePhenomena(rule)).not.toContain('heat-release');
  expect(suggestedEffect(rule)).toBe('bubbles');
 });
 it('recognizes precipitation and loss of the copper solution color together',()=>{
  const rule=reactionRules.find(rule=>rule.id==='precipitate')!;
  expect(availablePhenomena(rule)).toEqual(expect.arrayContaining(['precipitate','color-transition']));
  expect(availablePhenomena(rule)).not.toContain('gas');
  expect(suggestedEffect(rule)).toBe('precipitate');
 });
 it('only offers the existing heat model for canonical neutralization',()=>{
  const rule=reactionRules.find(rule=>rule.id==='neutralization')!;
  expect(availablePhenomena(rule)).toContain('heat-release');expect(suggestedEffect(rule)).toBe('neutral');
  expect(availablePhenomena({reactants:{HCl:2,NaOH:2},products:{NaCl:2,H2O:2}})).not.toContain('heat-release');
  expect(availablePhenomena({reactants:{HCl:1},products:{}})).toEqual([]);
 });
});
