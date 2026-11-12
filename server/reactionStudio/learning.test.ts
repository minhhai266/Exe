import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createServer,type Server} from 'node:http';
import {AdminDatabase} from '../admin/database';
import {Security} from '../admin/security';
import {adminMiddleware} from '../admin/plugin';
import {GeminiReactionProvider} from './provider';
import {createEquipment} from '../../src/engine/equipment';
import {addSubstance,startReaction,stepSimulation} from '../../src/engine/timeSimulation';
import {composeVesselEffects} from '../../src/engine/effectComposer';
import {quickSetup} from '../../src/engine/quickSetup';
import {connectObjects} from '../../src/engine/connectionLogic';
import {experiments} from '../../src/features/experiments/data';
let store:AdminDatabase,server:Server,base:string,cookies:Record<string,string>;
const request={method:'equation',input:'CuSO4 + 2NaOH -> Cu(OH)2 + Na2SO4',grade:9,purpose:'Quan sát kết tủa',simulationMode:'guided',explanationLevel:'detailed'};
async function api(path:string,method='GET',data?:any,who='teacher'){
 const response=await fetch(base+path,{method,headers:{'x-virtual-lab':'1',cookie:cookies[who]||'',...(data?{'content-type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});return {status:response.status,data:await response.json()};
}
async function draft(){const result=await api('/api/reaction-studio/analyze','POST',request);expect(result.status).toBe(200);return result.data}
async function reviewed(){const d=await draft();const result=await api('/api/reaction-studio/drafts/'+d.id+'/review','POST',{version:d.version,confirmed:true,source:d.definition.source,note:'Đã đối chiếu độc lập phương trình, pha và hiện tượng.'});expect(result.status).toBe(200);return result.data}
beforeEach(async()=>{
 store=new AdminDatabase(':memory:');const security=new Security(store);cookies={};
 for(const [id,role] of [['teacher','TEACHER'],['other','TEACHER'],['student','STUDENT'],['outsider','STUDENT']]){
  store.run("INSERT INTO users VALUES(?,?,?, ?,NULL,'active',NULL,1,?,?)",id,id+'@example.test',id,role,'2026-01-01','2026-01-01');cookies[id]='vl_admin_session='+security.issue(id);
 }
 const middleware=adminMiddleware(store,'',false,{GEMINI_API_KEY:'test-secret',GEMINI_MODEL:'test-model'});
 server=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end()}));await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+(server.address() as any).port;
});
afterEach(async()=>{vi.restoreAllMocks();await new Promise<void>(resolve=>server.close(()=>resolve()));store.close()});

it('runs the Gemini-to-database-to-real-engine precipitation slice',async()=>{
 const canonical=await draft();const generated={...canonical.definition,name:'Kết tủa do giáo viên tạo'};
 const provider=vi.spyOn(GeminiReactionProvider.prototype,'analyze').mockResolvedValue(generated);
 const analyzed=await api('/api/teacher/reactions/analyze','POST',{input:request.input,inputType:'equation',grade:9});
 expect(analyzed.status).toBe(200);expect(provider).toHaveBeenCalledOnce();
 const d=analyzed.data;expect(d.validation).toMatchObject({support:'SUPPORTED',science:'library-verified',previewAllowed:true});
 const preview=await api('/api/reaction-studio/drafts/'+d.id+'/preview');expect(preview.status).toBe(200);
 expect(preview.data.config.stock.map((s:any)=>s.id)).toEqual(['CuSO4','NaOH']);
 expect(preview.data.validation.effects).toContain('PRECIPITATE_FORMATION');
 const rule=preview.data.rule;
 let vessel=createEquipment('beaker','actual-vessel',200,420);
 expect(startReaction(vessel,0,[rule]).error).toBeTruthy();
 vessel=addSubstance(vessel,'CuSO4',5,1,'mL').v;
 expect(startReaction(vessel,0,[rule]).error).toBeTruthy();
 vessel=addSubstance(vessel,'NaOH',10,1,'mL').v;
 vessel=startReaction(vessel,0,[rule]).v;
 for(let i=0;i<100;i++)vessel=stepSimulation([vessel],.1).items[0];
 expect(vessel.produced?.['Cu(OH)2']).toBeCloseTo(.005);
 const before=composeVesselEffects(vessel,10000),moved={...vessel,x:500,y:300};
 expect(before.precipitateAmount).toBeGreaterThan(0);
 expect(before.liquid.tags.find(tag=>tag.id==='Cu(OH)2')).toMatchObject({color:'#56b8eb',kind:'solid'});
 expect(composeVesselEffects(moved,10000).precipitateAmount).toBe(before.precipitateAmount);
 expect(vessel.reaction?.status).toBe('complete');
 expect((await api('/api/reaction-studio/drafts/'+d.id+'/trial','POST',{version:d.version,vessels:[moved],events:[],notes:'Quan sát kết tủa xanh lam.'})).status).toBe(200);
 expect(store.get('SELECT COUNT(*) n FROM studio_trials').n).toBe(1);
});
it('persists classes, pinned assignments and student submissions across accounts',async()=>{
 const d=await reviewed();const c=(await api('/api/learning/classes','POST',{name:'Hóa học 9A'})).data;
 const state=(await api('/api/learning/state')).data;const code=state.classes[0].code;
 expect((await api('/api/learning/classes/join','POST',{code},'student')).status).toBe(200);
 const assignment=(await api('/api/learning/assignments','POST',{classId:c.id,draftId:d.id,version:d.version,title:'Quan sát kết tủa'})).data;
 expect(assignment.config.experiment.reactionDefinition).toEqual({id:d.id,version:d.version});
 const studentState=(await api('/api/learning/state','GET',undefined,'student')).data;expect(studentState.assignments[0].id).toBe(assignment.id);
 const update=await api('/api/reaction-studio/drafts/'+d.id,'PUT',{version:d.version,definition:{...d.definition,name:'Tên sau khi giao'}});expect(update.status).toBe(200);
 expect((await api('/api/learning/state','GET',undefined,'student')).data.assignments[0].config.experiment.title).toBe(d.definition.name);
 const attempt={id:'attempt-1',experimentId:assignment.experimentId,vesselSnapshot:[],session:{events:[]},stockUsed:{},answers:{'Quan sát':'Kết tủa xanh'},notes:'Ghi nhận hiện tượng',logs:[],score:100};
 expect((await api('/api/learning/submissions','POST',{assignmentId:assignment.id,attempt},'outsider')).status).toBe(404);
 expect((await api('/api/learning/submissions','POST',{assignmentId:assignment.id,attempt},'student')).status).toBe(200);
 expect((await api('/api/learning/submissions','POST',{assignmentId:assignment.id,attempt},'student')).status).toBe(200);
 const result=(await api('/api/learning/state')).data;expect(result.submissions).toHaveLength(1);expect(result.submissions[0].grade).toBeNull();expect(result.submissions[0].attempt.assessment[1].earned).toBeNull();
 expect((await api('/api/learning/submissions/'+result.submissions[0].id+'/review','POST',{feedback:'Đã xem bài',grade:7,criterionGrades:{}},'other')).status).toBe(404);
 expect((await api('/api/learning/submissions/'+result.submissions[0].id+'/review','POST',{feedback:'Đã xem bài',grade:7,criterionGrades:{}})).status).toBe(200);
 expect((await api('/api/learning/state','GET',undefined,'student')).data.submissions[0].grade).toBe(7);
});
it('blocks student creation, foreign ownership, tampered rules and unreviewed assignment',async()=>{
 const d=await draft(),path='/api/reaction-studio/drafts/'+d.id;
 expect((await api('/api/teacher/reactions/analyze','POST',{input:'CuSO4 + NaOH',grade:9},'student')).status).toBe(403);
 expect((await api(path,'PUT',{version:d.version,definition:d.definition},'other')).status).toBe(404);
 const c=(await api('/api/learning/classes','POST',{name:'Test class'})).data;
 expect((await api('/api/learning/assignments','POST',{classId:c.id,draftId:d.id,version:d.version})).status).toBe(409);
 const r=await reviewed(),e=(await api('/api/reaction-studio/drafts/'+r.id+'/experiment')).data;
 expect((await api('/api/learning/templates','POST',{experiment:{...e,customReaction:{...e.customReaction,products:{NaCl:100}}}})).status).toBe(400);
 expect((await api('/api/learning/templates','POST',{experiment:e})).status).toBe(200);
 expect((await api('/api/learning/state')).data.templates[0].reactionDefinition).toEqual(e.reactionDefinition);
 expect((await api('/api/learning/state','GET',undefined,'other')).data.templates).toEqual([]);
});
it('preserves a saved draft on provider failure and does not execute injected model output',async()=>{
 const d=await draft(),count=store.get('SELECT COUNT(*) n FROM ai_reaction_drafts').n;
 vi.spyOn(GeminiReactionProvider.prototype,'analyze').mockRejectedValue(new Error('Provider failed'));
 expect((await api('/api/teacher/reactions/analyze','POST',{input:'Trộn hai dung dịch',grade:9})).status).toBe(500);
 expect(store.get('SELECT COUNT(*) n FROM ai_reaction_drafts').n).toBe(count);expect((await api('/api/reaction-studio/drafts/'+d.id)).data.id).toBe(d.id);
 vi.mocked(GeminiReactionProvider.prototype.analyze).mockResolvedValue({...d.definition,execute:'globalThis.compromised=true'} as any);
 expect((await api('/api/teacher/reactions/analyze','POST',{input:'Trộn hai dung dịch',grade:9})).status).toBe(400);
 expect((globalThis as any).compromised).toBeUndefined();
});
it('compiles gas generation, dissolution and valid gas routing through the existing engine',async()=>{
 const d=(await api('/api/reaction-studio/analyze','POST',{...request,input:'Zn + 2HCl -> ZnCl2 + H2'})).data;
 const preview=(await api('/api/reaction-studio/drafts/'+d.id+'/preview')).data;
 expect(preview.validation.effects).toEqual(expect.arrayContaining(['GAS_BUBBLES','SOLID_DISSOLUTION','GAS_FLOW']));
 let n=0;const setup=quickSetup({...preview.experiment,demo:true},()=>String(++n));
 const receiver=setup.items.find(v=>v.type==='gasJar')!;
 const connected=connectObjects(setup.items,setup.sourceId,receiver.id);expect(connected.error).toBeUndefined();
 let items=connected.items;const source=items.find(v=>v.id===setup.sourceId)!;
 const started=startReaction(source,0,[preview.rule]);expect(started.error).toBeUndefined();
 items=items.map(v=>v.id===source.id?started.v:v);
 items=stepSimulation(items,.5).items;
 expect(composeVesselEffects(items.find(v=>v.id===source.id)!,500).gasActive).toBe(true);
 for(let i=0;i<200;i++)items=stepSimulation(items,.1).items;
 const result=items.find(v=>v.id===source.id)!;
 expect(result.produced?.H2).toBeGreaterThan(0);expect(result.contents.Zn||0).toBeLessThan(source.contents.Zn!);
 expect(items.some(v=>(v.collected?.H2||0)>0)).toBe(true);
});
it('stores an unsupported reaction even when none of its chemicals exists in the inventory',async()=>{
 const result=await api('/api/reaction-studio/analyze','POST',{...request,input:'2Fe + 3Cl2 -> 2FeCl3'});
 expect(result.status).toBe(200);expect(result.data.validation.support).toBe('UNSUPPORTED');
 expect((await api('/api/reaction-studio/drafts/'+result.data.id+'/preview')).status).toBe(409);
});
it('keeps the existing manual/library builder usable with server classrooms',async()=>{
 const experiment={...structuredClone(experiments[1]),id:'existing-builder-lesson',title:'Bài từ trình tạo cũ',ownerId:'teacher',status:'published'};
 const saved=await api('/api/learning/templates','POST',{experiment});expect(saved.status).toBe(200);expect(saved.data.reactionDefinition.id).toBeTruthy();
 const c=(await api('/api/learning/classes','POST',{name:'Lớp dùng bài cũ'})).data;
 expect((await api('/api/learning/assignments','POST',{classId:c.id,experimentId:experiment.id,title:'Bài cũ được giữ lại'})).status).toBe(200);
});
it('does not let an account from outside a school join its class',async()=>{
 store.run("INSERT INTO schools VALUES('scope-school','SCOPE','Scoped school','active','{}',1,'2026-01-01','2026-01-01')");
 store.run("UPDATE users SET school_id='scope-school' WHERE id='teacher'");
 await api('/api/learning/classes','POST',{name:'Scoped class'});const code=(await api('/api/learning/state')).data.classes[0].code;
 expect((await api('/api/learning/classes/join','POST',{code},'outsider')).status).toBe(404);
 store.run("UPDATE users SET school_id='scope-school' WHERE id='student'");
 expect((await api('/api/learning/classes/join','POST',{code},'student')).status).toBe(200);
 expect((await api('/api/learning/state','GET',undefined,'outsider')).data.classes).toEqual([]);
});
it('does not execute catalog chemistry that differs from the actual physical model',async()=>{
 store.run("UPDATE chemicals SET data=json_set(data,'$.molarMass',999) WHERE id='CuSO4'");
 const result=await draft();expect(result.validation.support).toBe('PARTIALLY_SUPPORTED');expect(result.validation.previewAllowed).toBe(false);
 expect(result.validation.issues.join(' ')).toContain('mô hình vật chất');
});
