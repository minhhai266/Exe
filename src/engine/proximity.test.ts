import { describe,expect,it } from 'vitest';
import { portPosition } from "./connectionLogic";
import { createEquipment } from "./equipment";
import { HEAT_RADIUS,heatStep,ignitionError } from "./heatingLogic";
import { drawTube } from "./tubeInteraction";

describe('simple proximity interactions',()=>{
 it('heats every compatible vessel within two cells without requiring a stand',()=>{
  const burner=createEquipment('burner','fire',300,440);burner.burning=true;
  const a=createEquipment('beaker','a',300,350),b=createEquipment('flask','b',400,360),outside=createEquipment('beaker','far',300+HEAT_RADIUS+1,440);
  for(const v of [a,b,outside])v.volume=30;
  const items=[burner,a,b,outside];expect(ignitionError(burner,items)).toBeUndefined();
  expect(heatStep(a,items,1)).toBeGreaterThan(25);expect(heatStep(b,items,1)).toBeGreaterThan(25);expect(heatStep(outside,items,1)).toBe(25);
 });
 it('keeps hydrogen and sealed-vessel checks despite simplifying placement',()=>{
  const burner=createEquipment('burner','fire',300,440),v=createEquipment('flask','v',300,350);v.volume=30;v.sealed=true;
  expect(ignitionError(burner,[burner,v])).toContain('kín');v.sealed=false;v.contents={Zn:.01,HCl:.02};expect(ignitionError(burner,[burner,v])).toContain('hiđro');
 });
 it('snaps both ends of the drawn tube and removes its previous link on redraw',()=>{
  const a=createEquipment('flask','a',300,365),b=createEquipment('gasJar','b',760,260),tube=createEquipment('tubing','tube',500,350);
  const points=[portPosition(a,'out'),{x:480,y:110},portPosition(b,'in')];
  const result=drawTube([a,b,tube],'tube',points);expect(result.items[0].connections).toEqual(['b']);expect(result.items[2].tubeShape?.points).toEqual(points);
  const redrawn=drawTube(result.items,'tube',[{x:10,y:530},{x:40,y:530}]);expect(redrawn.items[0].connections).toEqual([]);expect(redrawn.items[2].tubeShape?.from).toBeUndefined();
 });
 it('accepts a reversed stroke without connecting a vessel to itself',()=>{
  const a=createEquipment('flask','a',300,365),b=createEquipment('gasJar','b',760,260),tube=createEquipment('tubing','tube',500,350);
  expect(drawTube([a,b,tube],'tube',[portPosition(b,'in'),portPosition(a,'out')]).items[0].connections).toEqual(['b']);
  expect(drawTube([a,b,tube],'tube',[portPosition(a,'out'),portPosition(a,'in')]).items[0].connections).toEqual([]);
 });
});
