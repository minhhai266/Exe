import { describe,expect,it } from 'vitest';
import { createEquipment } from "./equipment";
import { transferLiquid } from "./transfer";

function setup(){const a=createEquipment('beaker','a',100,440),b=createEquipment('beaker','b',220,440);a.volume=20;a.contents={CuSO4:.01,'Cu(OH)2':.002,H2:.001};a.temperature=45;b.volume=10;b.contents={NaOH:.01};return [a,b]}
describe('liquid transfer',()=>{
 it('conserves each species and volume, leaves sediment and gas, mixes temperature',()=>{
  const items=setup(),result=transferLiquid(items,'a','b',5,100);
  expect(result.error).toBeUndefined();const [a,b]=result.items;
  expect(a.volume).toBe(15);expect(b.volume).toBe(15);
  expect(a.contents.CuSO4).toBeCloseTo(.0075);expect(b.contents.CuSO4).toBeCloseTo(.0025);
  expect(a.contents['Cu(OH)2']).toBe(.002);expect(b.contents['Cu(OH)2']).toBeUndefined();
  expect(a.contents.H2).toBe(.001);expect(b.contents.H2).toBeUndefined();
  expect(b.temperature).toBeCloseTo(31.6666667);expect(b.reaction).toBeUndefined();
  expect(items[0].volume).toBe(20);expect(items[0].contents.CuSO4).toBe(.01);
 });
 it.each([0,-1,NaN,Infinity,21])('rejects invalid aliquot %s without changing input',volume=>{
  const items=setup();expect(transferLiquid(items,'a','b',volume).items).toBe(items);expect(transferLiquid(items,'a','b',volume).error).toBeTruthy();
 });
 it('rejects overflow, sealed vessels and active reactions',()=>{
  const items=setup();items[1].volume=249;expect(transferLiquid(items,'a','b',5).error).toBeTruthy();
  items[1].volume=0;items[0].sealed=true;expect(transferLiquid(items,'a','b',5).error).toBeTruthy();
  items[0].sealed=false;items[0].reaction={ruleId:'precipitate',target:.01,extent:0,status:'running',startedAt:0,before:{},rate:1};expect(transferLiquid(items,'a','b',5).error).toBeTruthy();
 });
 it('clears paused reaction plans so stale extents cannot resume after decanting',()=>{
  const items=setup();items[0].reaction={ruleId:'precipitate',target:.01,extent:.001,status:'paused',startedAt:0,before:{},rate:1};
  expect(transferLiquid(items,'a','b',20).items[0].reaction).toBeUndefined();
  expect(transferLiquid(items,'a','a',1).error).toBeTruthy();
 });
});
