import { describe,it,expect } from 'vitest';
import { consumeStock,defaultAssignmentConfig,gradeRubric,validateConfig } from './assignmentLab';
import { createEquipment } from './equipment';
import { createSession,expireLabSession,modelEvents,recordEvent } from './labSession';
import { canExplain,observedReaction } from './learningPolicy';
import { anchoredTube,moveTubeBend,simplifyTube } from './tubeGeometry';
import { portPosition,placeObject } from './connectionLogic';
import { startReaction,stepSimulation } from './timeSimulation';
import { experiments } from '../features/experiments/data';

describe('assignment stock, explanation and evidence',()=>{
 it('converts mmol into the supplied volume or mass and never supplies extra stock',()=>{
  const config=defaultAssignmentConfig(experiments[0]);config.stock=[{id:'HCl',quantity:10,unit:'mL',concentration:.5},{id:'Zn',quantity:65.38,unit:'mg',concentration:1}];
  const first=consumeStock(config,{},'HCl',4,'mmol',.5);expect(first.error).toBeUndefined();expect(first.used.HCl).toBe(8);
  expect(consumeStock(config,first.used,'HCl',2,'mmol',.5).error).toContain('Không đủ');
  expect(consumeStock(config,{},'HCl',1,'mL',1).error).toContain('0.5 M');
  expect(consumeStock(config,{},'Zn',1,'mmol',1).used.Zn).toBeCloseTo(65.38);
  expect(consumeStock(config,{},'NaOH',1,'mL',1).error).toBeTruthy();
  expect(consumeStock(config,{},'Zn',1,'mL',1).error).toBeTruthy();
  expect(consumeStock(config,{},'HCl',NaN,'mL',.5).error).toBeTruthy();
 });
 it('validates a complete rubric and an independent historical copy',()=>{
  const original=structuredClone(experiments[0]),config=defaultAssignmentConfig(original);validateConfig(config);original.reagents=[];expect(config.experiment.reagents).toContain('Zn');
  config.rubric[0].points=5;expect(()=>validateConfig(config)).toThrow('10');
 });
 it('reveals only a reaction that has progressed and obeys the policy',()=>{
  const v=createEquipment('beaker','v',200,440);v.volume=30;v.contents={CuSO4:.01,NaOH:.02};const started=startReaction(v).v;
  expect(observedReaction(started)).toBeUndefined();const stepped=stepSimulation([started],1).items[0];expect(observedReaction(stepped)?.id).toBe('precipitate');
  expect(canExplain('after-submit',false)).toBe(false);expect(canExplain('after-submit',true)).toBe(true);expect(canExplain('never',true)).toBe(false);
 });
 it('deduplicates retries and does not emit a stream of simulation ticks',()=>{
  let session=createSession('a','student');session=recordEvent(session,'HINT_OPENED',{level:1},[],'unique');expect(recordEvent(session,'HINT_OPENED',{level:1},[],'unique')).toBe(session);
  const v=createEquipment('beaker','v',200,440);v.volume=30;v.contents={CuSO4:.01,NaOH:.02};const started=startReaction(v).v;
  session=modelEvents(session,[v],[started]);const count=session.events.length;session=modelEvents(session,[started],stepSimulation([started],.2).items);expect(session.events).toHaveLength(count);
  const completed=stepSimulation([started],100).items;session=modelEvents(session,[started],completed);expect(session.events.filter(e=>e.type==='REACTION_COMPLETED')).toHaveLength(1);
  const second=modelEvents(session,completed,completed);expect(second.events).toHaveLength(session.events.length);
 });
 it('does not award points for checking a box or opening a hint',()=>{
  const config=defaultAssignmentConfig(experiments[1]);const v=createEquipment('beaker','v',100,400);v.contents={'Cu(OH)2':.01};
  const events=recordEvent(createSession(),'HINT_OPENED').events;
  expect(gradeRubric(config,[v],events,'A sentence')[0].earned).toBe(0);
  v.produced={'Cu(OH)2':.01};const score=gradeRubric(config,[v],events,'');expect(score[0].earned).toBe(4);expect(score[1].earned).toBeNull();
 });
 it('scores declared dosage tolerances from inventory accounting',()=>{
  const config=defaultAssignmentConfig(experiments[1]);config.rubric=[{id:'dose',label:'Dùng 10 mL CuSO₄',points:10,kind:'dosage',chemical:'CuSO4',targetQuantity:10,tolerance:.2}];validateConfig(config);
  expect(gradeRubric(config,[],[],'',{CuSO4:10.1})[0].earned).toBe(10);
  expect(gradeRubric(config,[],[],'',{CuSO4:9})[0].earned).toBe(0);
  config.rubric[0].chemical='HCl';expect(()=>validateConfig(config)).toThrow('Tiêu chí');
 });
 it('pauses actual work at the deadline and records it only once',()=>{
  const v=createEquipment('beaker','v',200,440);v.volume=30;v.contents={CuSO4:.01,NaOH:.02};const burner=createEquipment('burner','fire',200,440);burner.burning=true;
  const started=startReaction(v).v;const result=expireLabSession(createSession('assignment'),[started,burner],1);
  expect(result.items[0].reaction?.status).toBe('paused');expect(result.items[0].reaction?.extent).toBe(0);expect(result.items[1].burning).toBe(false);
  expect(expireLabSession(result.session,result.items,1).session).toBe(result.session);expect(result.session.events.filter(e=>e.type==='TIME_LIMIT_REACHED')).toHaveLength(1);
 });
});
describe('tube geometry and mounts',()=>{
 it('smooths jitter, preserves anchors, and distributes endpoint movement',()=>{
  const source=createEquipment('flask','a',250,440),target=createEquipment('gasJar','b',700,400);const a=portPosition(source,'out'),b=portPosition(target,'in');
  const shape={from:'a',to:'b',points:[a,{x:450,y:100},b]};const moved={...source,x:source.x+100};const points=anchoredTube(shape,[moved,target]);
  expect(points[0]).toEqual(portPosition(moved,'out'));expect(points.at(-1)).toEqual(b);expect(points[1].x).toBeGreaterThan(450);expect(points[1].x).toBeLessThan(550);
  expect(simplifyTube([{x:0,y:0},{x:1,y:.1},{x:2,y:0}])).toHaveLength(2);
  const tube={...createEquipment('tubing','t',0,0),tubeShape:shape};expect(moveTubeBend([source,target,tube],'t',1,{x:430,y:80})[2].tubeShape?.points[1]).toEqual({x:430,y:80});
 });
 it('does not form a parent-child cycle or auto attach to a distant support',()=>{
  const stand=createEquipment('stand','s',250,440),clamp=createEquipment('clamp','c',260,250);clamp.mountedOn='s';const flask=createEquipment('flask','f',280,350);flask.mountedOn='c';
  const result=placeObject([stand,clamp,flask],'c',280,350);expect(result.items.find(v=>v.id==='c')?.mountedOn).not.toBe('f');
  const far=placeObject([stand,createEquipment('tube','t',800,440)],'t',800,400);expect(far.items[1].mountedOn).toBeUndefined();
 });
});
