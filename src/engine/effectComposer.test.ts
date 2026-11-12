import {describe,expect,it} from 'vitest';
import {composeVesselEffects} from './effectComposer';
import {createEquipment} from './equipment';
import {startReaction,stepSimulation} from './timeSimulation';
describe('state driven effect composer',()=>{
 it('requires actual gas production and does not mutate chemistry while rendering',()=>{
  const vessel=createEquipment('beaker','test',200,300);vessel.contents={Zn:.01,HCl:.02};vessel.volume=30;
  const started=startReaction(vessel).v;expect(composeVesselEffects(started,1).gasActive).toBe(false);
  const next=stepSimulation([started],.2).items[0],snapshot=JSON.stringify(next);
  expect(composeVesselEffects(next,2).gasRate).toBeGreaterThan(0);expect(composeVesselEffects(next,2).zincScale).toBeLessThan(1);expect(JSON.stringify(next)).toBe(snapshot);
  next.reaction!.status='paused';expect(composeVesselEffects(next,3).gasActive).toBe(false);
 });
 it('keeps precipitation and color on the moving vessel and never fabricates gas',()=>{
  const vessel=createEquipment('beaker','test',200,300);vessel.contents={CuSO4:.01,NaOH:.02};vessel.volume=30;
  const mid=stepSimulation([startReaction(vessel).v],2).items[0];const before=composeVesselEffects(mid,2);mid.x=500;mid.y=350;
  expect(composeVesselEffects(mid,2)).toEqual(before);expect(before.precipitateAmount).toBeGreaterThan(0);expect(before.bubbleCount).toBe(0);
 });
 it('does not add gas or precipitate to neutralization',()=>{
  const vessel=createEquipment('beaker','test',200,300);vessel.contents={HCl:.01,NaOH:.01};vessel.volume=30;
  const mid=stepSimulation([startReaction(vessel).v],2).items[0],view=composeVesselEffects(mid,2);
  expect(view.gasActive).toBe(false);expect(view.precipitateAmount).toBe(0);expect(view.temperature).toBeGreaterThan(25);
 });
});
