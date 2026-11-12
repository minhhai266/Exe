import { afterAll,beforeAll,describe,it,expect } from 'vitest';
import { createServer,type Server } from 'node:http';
import { AdminDatabase } from './database';
import {migrations} from './migrations';
import { adminMiddleware } from './plugin';
import { checkEquation,parseFormula } from '../../src/features/admin/domain';
import {mkdtempSync,rmSync,rmdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
let store:AdminDatabase,server:Server,base:string,rootCookie='';
async function api(path:string,method='GET',data?:any,cookie=rootCookie){const response=await fetch(base+path,{method,headers:{'x-virtual-lab':'1',...(data!==undefined?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]||''}}
beforeAll(async()=>{store=new AdminDatabase(':memory:');const middleware=adminMiddleware(store);server=createServer((req,res)=>{middleware(req,res,()=>{res.statusCode=404;res.end()})});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+((server.address() as any).port);const setup=await api('/api/admin/auth/setup','POST',{name:'System Admin QA',email:'admin@example.test',password:'Testing-password-123!'},'');expect(setup.status).toBe(201);rootCookie=setup.cookie});
afterAll(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));store.close()});
describe('real admin API',()=>{
 it('requires server sessions, hashes passwords and closes bootstrap',async()=>{
  expect((await api('/api/admin/dashboard','GET',undefined,'')).status).toBe(401);
  expect((await api('/api/admin/auth/setup','POST',{name:'Again',email:'again@example.test',password:'Another-password-123!'})).status).toBe(409);
  const raw=store.get('SELECT password_hash FROM users WHERE email=?','admin@example.test').password_hash;expect(raw).toMatch(/^scrypt:/);expect(raw).not.toContain('Testing-password');
  expect((await api('/api/admin/auth/login','POST',{email:'admin@example.test',password:'wrong-password'})).status).toBe(401);
  const list=await api('/api/admin/users');expect(list.status).toBe(200);expect(JSON.stringify(list.data)).not.toContain('password_hash');
 });
 it('returns backend metrics without invented organizations or practice sessions',async()=>{
  const result=await api('/api/admin/dashboard');expect(result.status).toBe(200);expect(result.data.metrics.schools).toBe(0);expect(result.data.metrics.sessions).toBe(0);expect(result.data.metrics.chemicals).toBe(store.get("SELECT COUNT(*) n FROM chemicals WHERE status='published'").n);expect(result.data.series).toEqual([]);
  expect((await api('/api/admin/dashboard?from=2026-12-20&to=2026-01-01')).status).toBe(400);
 });
 it('creates, edits, filters and prevents duplicate chemicals and unsafe archive',async()=>{
  const payload={name:'Hydrogen bromide QA',code:'HBr-QA',status:'published',data:{formula:'HBr',molarMass:80.91,englishName:'Hydrogen bromide',category:'Acid',phase:'dung dịch',appearance:'Không màu',color:'#edf4f8',safety:'Chỉ dùng mô phỏng; chất ăn mòn.',description:'Test catalog metadata',source:'https://pubchem.ncbi.nlm.nih.gov/compound/Hydrogen-bromide',reviewed:true}};
  const created=await api('/api/admin/chemicals','POST',payload);expect(created.status).toBe(201);
  expect((await api('/api/admin/chemicals','POST',payload)).status).toBe(409);
  const edited=await api('/api/admin/chemicals/'+created.data.id,'PUT',{...created.data,name:'Hydrogen bromide edited'});expect(edited.status).toBe(200);expect(edited.data.version).toBe(2);
  expect((await api('/api/admin/chemicals/'+created.data.id,'PUT',created.data)).status).toBe(409);
  expect((await api('/api/admin/chemicals?q=bromide&pageSize=1&sort=name&direction=asc')).data.items).toHaveLength(1);
  expect((await api('/api/admin/chemicals?category=Acid')).data.items.every((c:any)=>c.data.category==='Acid')).toBe(true);
  const hcl=(await api('/api/admin/chemicals/HCl')).data;expect((await api('/api/admin/chemicals/HCl','PUT',{...hcl,status:'archived'})).status).toBe(409);
 });
 it('validates apparatus behaviors and stores typed ports',async()=>{
  const base=(await api('/api/admin/apparatus/beaker')).data;const payload={...base,code:'beaker-500-QA',name:'Cốc 500 mL QA',data:{...base.data,capacity:500}};delete payload.id;const created=await api('/api/admin/apparatus','POST',payload);expect(created.status).toBe(201);expect(created.data.data.capacity).toBe(500);expect(store.get('SELECT COUNT(*) n FROM apparatus_ports WHERE apparatus_id=?',created.data.id).n).toBe(1);
  expect((await api('/api/admin/apparatus','POST',{...payload,code:'invalid-apparatus',data:{...payload.data,behaviors:['EXECUTE_SCRIPT']}})).status).toBe(400);
  expect((await api('/api/admin/apparatus','POST',{...payload,code:'duplicate-ports',data:{...payload.data,ports:[...payload.data.ports,{...payload.data.ports[0],id:'in-2'}]}})).status).toBe(400);
 });
 it('publishes a separate experiment template and withdraws it when the reaction is archived',async()=>{
  const base=(await api('/api/admin/reactions/hydrogen')).data;
  const created=await api('/api/admin/reactions','POST',{...base,code:'experiment-qa',name:'Reaction with experiment QA',data:{...base.data,experimentConfig:{enabled:true,title:'Published experiment QA',grade:8,minutes:20,objectives:'Observe hydrogen gas in the simulation.',instructions:'Prepare zinc and acid, then observe the reaction.'}}});
  expect(created.status).toBe(201);const catalog=(await api('/api/catalog')).data;
  const published=catalog.experiments.find((e:any)=>e.id==='catalog-'+created.data.id);expect(published.title).toBe('Published experiment QA');expect(published.customReaction.reactants).toEqual({Zn:1,HCl:2});
  expect((await api('/api/admin/reactions/'+created.data.id,'PUT',{...created.data,status:'archived'})).status).toBe(200);
  expect((await api('/api/catalog')).data.experiments.some((e:any)=>e.id===published.id)).toBe(false);
 });
 it('checks equations and rejects incompatible effects or unsupported publication',async()=>{
  const base=(await api('/api/admin/reactions/hydrogen')).data;const created=await api('/api/admin/reactions','POST',{...base,code:'hydrogen-QA',name:'Hydrogen QA'});expect(created.status).toBe(201);
  expect((await api('/api/admin/reactions','POST',{...base,code:'bad-effect',data:{...base.data,effect:'precipitate'}})).status).toBe(400);
  expect((await api('/api/admin/reactions','POST',{...base,code:'bad-balance',data:{...base.data,reactants:[{chemical:'Zn',coefficient:1},{chemical:'HCl',coefficient:1}]}})).status).toBe(400);
  const validation=await api('/api/admin/reactions/hydrogen/validate','POST',{...base,data:{...base.data,reactants:[{chemical:'Zn',coefficient:1},{chemical:'HCl',coefficient:1}]}});expect(validation.status).toBe(200);expect(validation.data.data.checkError).toContain('cân bằng');
 });
 it('saves structured ebooks and never accepts executable block types or invalid links',async()=>{
  const payload={name:'Book QA',code:'book-qa',status:'published',data:{grade:9,subject:'Hóa học',author:'QA',rights:'Nội dung do tác giả tạo cho kiểm thử.',chapters:[{id:'qa-chapter',title:'Chapter',lessons:[{id:'qa-lesson',title:'Lesson',experimentId:'precipitate',blocks:[{id:'qa-block',type:'paragraph',text:'<script>alert(1)</script>'}]}]}]}};
  const created=await api('/api/admin/ebooks','POST',payload);expect(created.status).toBe(201);expect(store.get('SELECT experiment_id FROM lesson_experiment_links WHERE lesson_id=?','qa-lesson').experiment_id).toBe('precipitate');
  const malicious=structuredClone(payload);malicious.code='bad-book';malicious.data.chapters[0].lessons[0].blocks[0].type='script';expect((await api('/api/admin/ebooks','POST',malicious)).status).toBe(400);
 });
 it('rejects executable uploads, stores a PDF persistently and protects unpublished files',async()=>{
  const upload=async(bytes:string,type:string)=>{const response=await fetch(base+'/api/admin/assets',{method:'POST',headers:{'x-virtual-lab':'1',cookie:rootCookie,'content-type':type,'x-file-name':'qa.pdf'},body:bytes});return {status:response.status,data:await response.json()}};
  expect((await upload('<svg onload="alert(1)"></svg>','image/svg+xml')).status).toBe(400);
  expect((await upload('%PDF-1.4 /JavaScript bad %%EOF','application/pdf')).status).toBe(400);
  const pdf=await upload('%PDF-1.4\n1 0 obj <</Type /Catalog>> endobj\n%%EOF','application/pdf');expect(pdf.status).toBe(201);expect(store.get('SELECT size FROM assets WHERE id=?',pdf.data.id).size).toBeGreaterThan(0);
  expect((await fetch(base+pdf.data.url)).status).toBe(401);expect((await fetch(base+pdf.data.url,{headers:{cookie:rootCookie}})).headers.get('content-type')).toBe('application/pdf');
 });
 it('isolates schools, prevents privilege escalation and revokes locked-user sessions',async()=>{
  const a=(await api('/api/admin/schools','POST',{name:'School A QA',code:'QA-A',status:'active',data:{}})).data,b=(await api('/api/admin/schools','POST',{name:'School B QA',code:'QA-B',status:'active',data:{}})).data;
  const invited=(await api('/api/admin/users','POST',{name:'School Admin QA',status:'invited',data:{email:'school-admin@example.test',role:'SCHOOL_ADMIN',schoolId:a.id}})).data;
  const token=new URL(invited.activationPath,'http://test').searchParams.get('token');expect((await api('/api/admin/auth/activate','POST',{token,password:'School-password-123!'},'')).status).toBe(200);expect((await api('/api/admin/auth/activate','POST',{token,password:'School-password-123!'},'')).status).toBe(400);
  const schoolCookie=(await api('/api/admin/auth/login','POST',{email:'school-admin@example.test',password:'School-password-123!'},'')).cookie;
  expect((await api('/api/admin/schools','GET',undefined,schoolCookie)).data.items).toHaveLength(1);expect((await api('/api/admin/schools/'+b.id,'GET',undefined,schoolCookie)).status).toBe(404);
  expect((await api('/api/admin/users','POST',{name:'Escalate',status:'invited',data:{email:'escalate@example.test',role:'SYSTEM_ADMIN',schoolId:null}},schoolCookie)).status).toBe(403);
  expect((await api('/api/admin/chemicals','POST',{name:'No access'},schoolCookie)).status).toBe(403);
  const teacher=(await api('/api/admin/users','POST',{name:'Teacher QA',status:'invited',data:{email:'teacher@example.test',role:'TEACHER',schoolId:a.id}},schoolCookie)).data;expect(teacher.id).toBeTruthy();
  const teacherToken=new URL(teacher.activationPath,'http://test').searchParams.get('token');await api('/api/admin/auth/activate','POST',{token:teacherToken,password:'Teacher-password-123!'},'');const teacherCookie=(await api('/api/admin/auth/login','POST',{email:'teacher@example.test',password:'Teacher-password-123!'},'')).cookie;
  expect((await api('/api/admin/dashboard','GET',undefined,teacherCookie)).status).toBe(403);
  expect((await api('/api/learning/sessions','POST',{id:'actual-session-qa',experimentId:'hydrogen'},teacherCookie)).status).toBe(200);expect((await api('/api/learning/sessions/actual-session-qa/complete','POST',{},teacherCookie)).status).toBe(200);
  const active=(await api('/api/admin/users/'+teacher.id,'GET',undefined,schoolCookie)).data;expect((await api('/api/admin/users/'+teacher.id,'PUT',{...active,status:'locked'},schoolCookie)).status).toBe(200);
  expect((await api('/api/learning/sessions','POST',{id:'blocked-session',experimentId:'hydrogen'},teacherCookie)).status).toBe(401);
  expect((await api('/api/admin/dashboard','GET',undefined,schoolCookie)).data.metrics.sessions).toBe(1);
 });
});
describe('durable SQLite storage',()=>{
 it('preserves edited records and applies migrations only once after reopening',()=>{
  const folder=mkdtempSync(join(tmpdir(),'virtual-lab-db-test-')),path=join(folder,'test.sqlite');let db:AdminDatabase|undefined;
  try{db=new AdminDatabase(path);db.run('UPDATE chemicals SET name=? WHERE id=?','Persisted QA zinc','Zn');db.close();db=undefined;db=new AdminDatabase(path);expect(db.get('SELECT name FROM chemicals WHERE id=?','Zn').name).toBe('Persisted QA zinc');expect(db.get('SELECT COUNT(*) n FROM schema_migrations').n).toBe(migrations.length)}finally{db?.close();for(const suffix of ['','-wal','-shm'])if(existsSync(path+suffix))rmSync(path+suffix);rmdirSync(folder)}
 });
});
describe('formula grammar',()=>{
 it('checks grouped atoms and electrical charge without evaluating input',()=>{
  expect(parseFormula('Ca(OH)₂').atoms).toEqual({Ca:1,O:2,H:2});expect(parseFormula('CuSO4·5H2O').atoms).toEqual({Cu:1,S:1,O:9,H:10});
  expect(()=>parseFormula('<script>')).toThrow();expect(()=>checkEquation([{chemical:'a',coefficient:1}],[{chemical:'b',coefficient:1}],{a:{formula:'Fe^2+'},b:{formula:'Fe^3+'}})).toThrow('điện tích');
 });
});
