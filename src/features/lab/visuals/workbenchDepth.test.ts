import {describe,it,expect} from 'vitest';
import {createEquipment} from '../../../engine/equipment';
import {apparatusContact} from './workbenchDepth';

describe('Workbench contact shadows follow drawing coordinates without moving apparatus',()=>{
 it('moves the contact ellipse by the exact object translation',()=>{
  const v=createEquipment('flask','v',300,420),before=structuredClone(v),a=apparatusContact(v)!,b=apparatusContact({...v,x:v.x+83,y:v.y-17})!;
  expect(b.x-a.x).toBeCloseTo(83);expect(b.y-a.y).toBeCloseTo(-17);expect(v).toEqual(before);
 });
 it('places an upside-down jar shadow at its lowest world point',()=>{
  const v=createEquipment('gasJar','jar',700,250);v.rotation=180;
  expect(apparatusContact(v)!.y).toBeGreaterThan(420);
 });
 it('does not draw floating contact shadows under mounted glass or a jar in its water bath',()=>{
  const v=createEquipment('flask','v',300,365);v.mountedOn='stand';expect(apparatusContact(v)).toBeNull();
  const jar=createEquipment('gasJar','jar',700,250);jar.prepared=true;jar.rotation=180;expect(apparatusContact(jar)).toBeNull();
 });
});
