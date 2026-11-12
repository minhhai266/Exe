import {describe,it,expect} from 'vitest';
import {createEquipment} from './equipment';
import {heatStep,ignitionError} from './heatingLogic';
import {stepSimulation} from './timeSimulation';

describe('Alcohol burner uses the existing heat and safety model',()=>{
 it('heats an eligible nearby vessel; an unlit lamp has no heating contribution',()=>{
  const lamp=createEquipment('alcoholBurner','lamp',300,440),v=createEquipment('beaker','v',300,350);v.volume=50;v.contents={H2O:.05};
  expect(heatStep(v,[lamp,v],1)).toBe(25);lamp.burning=true;expect(ignitionError(lamp,[lamp,v])).toBeUndefined();expect(heatStep(v,[lamp,v],1)).toBeGreaterThan(25);
 });
 it('uses the same hydrogen and sealed-vessel interlocks as Bunsen burners',()=>{
  const lamp=createEquipment('alcoholBurner','lamp',300,440),v=createEquipment('flask','v',300,350);v.volume=30;v.sealed=true;
  expect(ignitionError(lamp,[lamp,v])).toContain('kín');v.sealed=false;v.contents={Zn:.01,HCl:.02};expect(ignitionError(lamp,[lamp,v])).toContain('hiđro');lamp.burning=true;
  expect(heatStep(v,[lamp,v],1)).toBe(25);
  expect(stepSimulation([lamp,v],1).items.find(item=>item.id==='lamp')?.burning).toBe(false);
 });
});
