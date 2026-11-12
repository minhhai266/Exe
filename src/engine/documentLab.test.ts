import {describe,it,expect} from 'vitest';
import {documentLabExperiments,rulesForExperiment} from '../features/experiments/labActivities';
import {quickSetup} from './quickSetup';
import {startReaction,stepSimulation,addSubstance} from './timeSimulation';
import {createEquipment,type Vessel} from './equipment';
import {ignitionError} from './heatingLogic';
import {testLitmus} from './litmus';
import {documentReactionRules} from './documentReactionRules';
import {placeObject} from './connectionLogic';

function ticks(items:Vessel[],seconds:number){for(let t=0;t<seconds;t+=.1)items=stepSimulation(items,.1).items;return items}
describe('document lessons on the shared workbench',()=>{
 for(const experiment of documentLabExperiments.filter(e=>e.id!=='acid-base-identification')){
  it(`${experiment.id}: prepares real vessels and produces its target with the shared engine`,()=>{
   let serial=0;const setup=quickSetup(experiment,()=>String(++serial));expect(setup.items.length,setup.message).toBeGreaterThan(0);
   let items=setup.items;const source=items.find(v=>v.id===setup.sourceId)!;
   const receiver=items.find(v=>v.type==='gasJar'||experiment.id==='carbon-dioxide-test'&&v.type==='beaker');if(receiver)source.connections=[receiver.id];
   const burner=items.find(v=>v.type==='alcoholBurner');
   if(burner){expect(ignitionError(burner,items)).toBeUndefined();burner.burning=true;items=ticks(items,50)}
   let prepared=items.find(v=>v.id===source.id)!;if(experiment.customReaction?.requiresStirring)prepared.stirred=true;
   if(experiment.id==='neutralization')prepared=addSubstance(prepared,'HCl',(prepared.contents.NaOH||0)*1000,1,'mmol').v;
   const started=startReaction(prepared,1,rulesForExperiment(experiment),items);expect(started.error).toBeUndefined();
   items=items.map(v=>v.id===source.id?started.v:v);items=ticks(items,40);
   expect(items.reduce((sum,v)=>sum+(v.produced?.[experiment.product]||0),0)).toBeGreaterThan(1e-9);
   expect(items.find(v=>v.id===source.id)?.reaction?.status).toBe('complete');
   if(experiment.id==='esterification'){expect(items.find(v=>v.id===source.id)!.contents.CH3COOH).toBeGreaterThan(0);expect(items.find(v=>v.id===source.id)!.contents.H2SO4).toBeCloseTo(.00005)}
  });
 }
 it('uses different physical paper pieces without consuming acid or base',()=>{
  const experiment=documentLabExperiments.find(e=>e.id==='acid-base-identification')!;let serial=0;
  const setup=quickSetup(experiment,()=>String(++serial)),acid=setup.items.find(v=>v.contents.HCl)!,base=setup.items.find(v=>v.contents.NaOH)!;
  const first=testLitmus(setup.items,acid.id);expect(first.error).toBeUndefined();expect(first.items.find(v=>v.id===acid.id)?.litmusResult).toBe('red');
  const second=testLitmus(first.items,base.id);expect(second.items.find(v=>v.id===base.id)?.litmusResult).toBe('blue');expect(second.items.find(v=>v.id===acid.id)?.contents.HCl).toBe(.02);
 });
 it('enforces bath, catalyst, temperature and stirring instead of merely showing an animation',()=>{
  const ester=documentReactionRules.find(r=>r.id==='esterification')!,v=createEquipment('tube','v',300,350);v.mountedOn='stand';v.volume=10;v.contents={CH3COOH:.01,C2H5OH:.01};v.temperature=60;
  expect(startReaction(v,1,[ester]).error).toContain('xúc tác');v.contents.H2SO4=.0001;
  expect(startReaction(v,1,[ester]).error).toContain('cách thủy');
  const bath=createEquipment('waterBath','bath',300,350);bath.volume=100;v.mountedOn=bath.id;
  const started=startReaction(v,1,[ester],[v,bath]);expect(started.error).toBeUndefined();
  const removed=stepSimulation([started.v],.1).items[0];expect(removed.reaction?.status).toBe('paused');
 });
 it('converts every supported new solid mass into finite moles',()=>{
  for(const id of ['Fe','Cu','KMnO4','Ag','CuO'] as const){const result=addSubstance(createEquipment('beaker','b',0,0),id,100,1,'mg');expect(result.error).toBeUndefined();expect(result.v.contents[id]).toBeGreaterThan(0);expect(Number.isFinite(result.v.contents[id])).toBe(true)}
 });
 it('snaps tubes into water baths and paper into liquid using the existing drag placement path',()=>{
  const bath=createEquipment('waterBath','bath',400,350);bath.volume=150;
  const tube=createEquipment('tube','tube',200,400);
  const attached=placeObject([bath,tube],tube.id,410,330);
  expect(attached.items.find(v=>v.id===tube.id)?.mountedOn).toBe(bath.id);
  const acid=createEquipment('beaker','acid',600,425);acid.contents.HCl=.01;acid.volume=10;
  const paper=createEquipment('litmusPaper','paper',200,440);
  const tested=placeObject([acid,paper],paper.id,acid.x,acid.y-50);
  expect(tested.items.find(v=>v.id===acid.id)?.litmusResult).toBe('red');
  const reused=testLitmus(tested.items.map(v=>v.id==='paper'?{...v,mountedOn:undefined}:v),acid.id);
  expect(reused.error).toContain('mới');
 });
});
