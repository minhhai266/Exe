import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {createServer,type Server} from 'node:http';
import {AdminDatabase} from './database';
import {adminMiddleware} from './plugin';

let store:AdminDatabase,server:Server,base:string,cookie='';
async function api(path:string,method='GET',data?:unknown,session=cookie){
 const response=await fetch(base+path,{method,headers:{'x-virtual-lab':'1',...(session?{cookie:session}:{}),...(data!==undefined?{'content-type':'application/json'}:{})},body:data===undefined?undefined:JSON.stringify(data)});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]||''};
}
async function school(code:string){return (await api('/api/admin/schools','POST',{name:code,code,status:'active',data:{}})).data}
async function account(schoolId:string,email:string,role='TEACHER'){
 const invited=await api('/api/admin/users','POST',{name:email,status:'invited',data:{email,role,schoolId}});
 expect(invited.status).toBe(201);return invited.data;
}
beforeAll(async()=>{
 store=new AdminDatabase(':memory:');const middleware=adminMiddleware(store);
 server=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end()}));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+(server.address() as any).port;
 const setup=await api('/api/admin/auth/setup','POST',{name:'Integrity Admin',email:'integrity@example.test',password:'Integrity-password-123!'});cookie=setup.cookie;
});
afterAll(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));store.close()});

describe('admin data integrity',()=>{
 it('persists compatible phenomenon combinations and rejects unsupported choices at the API',async()=>{
  const options=(await api('/api/admin/options')).data;expect(options.phenomena).toHaveLength(7);
  const base=(await api('/api/admin/reactions/hydrogen')).data;
  const created=await api('/api/admin/reactions','POST',{...base,code:'phenomena-qa',name:'Concurrent phenomena QA',data:{...base.data,phenomena:['gas','solid-consumption']}});
  expect(created.status).toBe(201);expect(created.data.data.phenomena).toEqual(['gas','solid-consumption']);
  const published=(await api('/api/catalog')).data.reactions.find((r:any)=>r.id===created.data.id);
  expect(published.data.phenomena).toEqual(['gas','solid-consumption']);
  for(const phenomena of [['precipitate'],['heat-release'],['execute-script']]){
   expect((await api('/api/admin/reactions/'+created.data.id,'PUT',{...created.data,data:{...created.data.data,phenomena}})).status).toBe(400);
  }
 });
 it('stores chemical reference images and only exposes the image after publication',async()=>{
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0u8AAAAASUVORK5CYII=','base64');
  const upload=await fetch(base+'/api/admin/assets',{method:'POST',headers:{cookie,'x-virtual-lab':'1','x-file-name':'chemical.png'},body:bytes});
  expect(upload.status).toBe(201);const asset=await upload.json();
  const template=(await api('/api/admin/chemicals/HCl')).data;
  const payload={...template,preparations:[],code:'image-chemical',name:'Chemical image QA',status:'draft',data:{...template.data,formula:'HBr',molarMass:80.91,imageUrl:asset.url,imageCaption:'Reference sample for image display QA',imageCredit:'QA fixture'}};
  const draft=await api('/api/admin/chemicals','POST',payload);expect(draft.status).toBe(201);
  expect((await fetch(base+asset.url)).status).toBe(401);
  expect((await api('/api/admin/chemicals','POST',{...payload,code:'bad-image',data:{...payload.data,formula:'HI',imageUrl:'https://example.test/photo.png'}})).status).toBe(400);
  const published=await api('/api/admin/chemicals/'+draft.data.id,'PUT',{...draft.data,status:'published'});expect(published.status).toBe(200);
  expect((await fetch(base+asset.url)).headers.get('content-type')).toBe('image/png');
  const catalog=(await api('/api/catalog')).data;
  expect(catalog.chemicals.find((c:any)=>c.id===draft.data.id).data).toMatchObject({imageUrl:asset.url,imageCaption:payload.data.imageCaption,imageCredit:'QA fixture'});
  const cleared=await api('/api/admin/chemicals/'+draft.data.id,'PUT',{...published.data,data:{...published.data.data,imageUrl:'',imageCaption:'',imageCredit:''}});expect(cleared.status).toBe(200);
  expect((await fetch(base+asset.url)).status).toBe(401);
 });
 it('reports completion on its own Vietnam calendar day and includes zero-activity days',async()=>{
  const s=await school('REPORTING-SCHOOL'),teacher=await account(s.id,'reporting@example.test');
  store.run("INSERT INTO learning_sessions(id,user_id,school_id,experiment_id,status,created_at,updated_at,completed_at) VALUES(?,?,?,'hydrogen','completed',?,?,?)",'dated-session',teacher.id,s.id,'2026-01-31T17:30:00.000Z','2026-02-02T17:30:00.000Z','2026-02-02T17:30:00.000Z');
  const completion=(await api('/api/admin/dashboard?from=2026-02-03&to=2026-02-03')).data;
  expect(completion.timeZone).toBe('Asia/Ho_Chi_Minh');expect(completion.metrics.sessions).toBe(0);
  expect(completion.series).toEqual([{day:'2026-02-03',sessions:0,completed:1}]);
  const interval=(await api('/api/admin/dashboard?from=2026-02-01&to=2026-02-03')).data;
  expect(interval.series).toEqual([{day:'2026-02-01',sessions:1,completed:0},{day:'2026-02-02',sessions:0,completed:0},{day:'2026-02-03',sessions:0,completed:1}]);
  expect((await api('/api/admin/dashboard?from=2026-02-30&to=2026-03-03')).status).toBe(400);
 });
 it('keeps the original completion timestamp when the learner retries submission',async()=>{
  const s=await school('RETRY-SCHOOL'),student=await account(s.id,'retry@example.test','STUDENT');
  expect((await api('/api/admin/auth/activate','POST',{token:new URL(student.activationPath,base).searchParams.get('token'),password:'Student-password-123!'})).status).toBe(200);
  const session=(await api('/api/admin/auth/login','POST',{email:'retry@example.test',password:'Student-password-123!'})).cookie;
  expect((await api('/api/learning/sessions','POST',{id:'retry-session',experimentId:'hydrogen'},session)).status).toBe(200);
  expect((await api('/api/learning/sessions/retry-session/complete','POST',{},session)).status).toBe(200);
  const first=store.get('SELECT completed_at FROM learning_sessions WHERE id=?','retry-session');expect(first.completed_at).toBeTruthy();
  expect((await api('/api/learning/sessions/retry-session/complete','POST',{},session)).status).toBe(200);
  expect(store.get('SELECT completed_at FROM learning_sessions WHERE id=?','retry-session').completed_at).toBe(first.completed_at);
 });
 it('requires published ebook references and protects them until the book is withdrawn',async()=>{
  const template=(await api('/api/admin/apparatus/beaker')).data;
  const apparatus=(await api('/api/admin/apparatus','POST',{...template,code:'book-apparatus',name:'Book apparatus',status:'draft'})).data;
  const bookPayload={name:'Linked book',code:'linked-book',status:'published',data:{grade:8,author:'QA',rights:'QA original content',chapters:[{id:'linked-chapter',title:'Chapter',lessons:[{id:'linked-lesson',title:'Lesson',apparatusIds:[apparatus.id],blocks:[{id:'linked-block',type:'paragraph',text:'Apparatus lesson'}]}]}]}};
  expect((await api('/api/admin/ebooks','POST',bookPayload)).status).toBe(400);
  const published=await api('/api/admin/apparatus/'+apparatus.id,'PUT',{...apparatus,status:'published'});
  expect(published.status).toBe(200);
  const book=await api('/api/admin/ebooks','POST',bookPayload);expect(book.status).toBe(201);
  expect((await api('/api/admin/apparatus/'+apparatus.id,'PUT',{...published.data,status:'archived'})).status).toBe(409);
  expect((await api('/api/admin/ebooks/'+book.data.id,'PUT',{...book.data,status:'draft'})).status).toBe(200);
  expect((await api('/api/admin/apparatus/'+apparatus.id,'PUT',{...published.data,status:'archived'})).status).toBe(200);
 });
 it('protects linked experiment templates and does not publish links to withdrawn experiments',async()=>{
  const template=(await api('/api/admin/reactions/hydrogen')).data;
  const reaction=await api('/api/admin/reactions','POST',{...template,code:'linked-experiment-reaction',name:'Linked reaction',data:{...template.data,experimentConfig:{enabled:true,title:'Linked experiment',grade:8,minutes:10,objectives:'Observe the gas.',instructions:'Prepare zinc and hydrochloric acid.'}}});
  expect(reaction.status).toBe(201);
  const payload={name:'Experiment book',code:'experiment-book',status:'published',data:{grade:8,author:'QA',rights:'QA original content',chapters:[{id:'experiment-chapter',title:'Chapter',lessons:[{id:'experiment-lesson',title:'Lesson',experimentId:'catalog-'+reaction.data.id,blocks:[]}]}]}};
  const book=await api('/api/admin/ebooks','POST',payload);expect(book.status).toBe(201);
  expect((await api('/api/admin/reactions/'+reaction.data.id,'PUT',{...reaction.data,data:{...reaction.data.data,experimentConfig:{enabled:false}}})).status).toBe(409);
  expect((await api('/api/admin/ebooks/'+book.data.id,'PUT',{...book.data,status:'draft'})).status).toBe(200);
  expect((await api('/api/admin/reactions/'+reaction.data.id,'PUT',{...reaction.data,status:'archived'})).status).toBe(200);
  const draft=(await api('/api/admin/ebooks/'+book.data.id)).data;
  expect((await api('/api/admin/ebooks/'+book.data.id,'PUT',{...draft,status:'published'})).status).toBe(400);
 });
 it('searches chemical formulas and international names and filters apparatus by engine type',async()=>{
  expect((await api('/api/admin/chemicals?q=Hydrochloric')).data.items.map((c:any)=>c.id)).toContain('HCl');
  expect((await api('/api/admin/chemicals?q=CuSO4')).data.items.map((c:any)=>c.id)).toContain('CuSO4');
  const result=await api('/api/admin/apparatus?engineType=beaker');
  expect(result.status).toBe(200);expect(result.data.items.length).toBeGreaterThan(0);
  expect(result.data.items.every((a:any)=>a.data.engineType==='beaker')).toBe(true);
 });
 it('rejects non-object JSON and normalizes fractional pagination without a server error',async()=>{
  for(const value of [null,[],42,'text'])expect((await api('/api/admin/chemicals','POST',value)).status).toBe(400);
  const result=await api('/api/admin/chemicals?page=1.5&pageSize=2.7');
  expect(result.status).toBe(200);expect(result.data.page).toBe(1);expect(result.data.pageSize).toBe(2);expect(result.data.items).toHaveLength(2);
 });
 it('revokes outstanding invitations when email or school status changes',async()=>{
  const s=await school('INVITATION-SCHOOL'),user=await account(s.id,'before@example.test');
  const oldToken=new URL(user.activationPath,base).searchParams.get('token');
  expect((await api('/api/admin/users/'+user.id,'PUT',{...user,data:{...user.data,email:'after@example.test'}})).status).toBe(200);
  expect((await api('/api/admin/auth/activate','POST',{token:oldToken,password:'Account-password-123!'})).status).toBe(400);
  const invite=await api('/api/admin/users/'+user.id+'/invite','POST',{});
  expect(invite.status).toBe(200);
  expect((await api('/api/admin/schools/'+s.id,'PUT',{...s,status:'suspended'})).status).toBe(200);
  const suspended=(await api('/api/admin/schools/'+s.id)).data;
  expect((await api('/api/admin/schools/'+s.id,'PUT',{...suspended,status:'active'})).status).toBe(200);
  expect((await api('/api/admin/auth/activate','POST',{token:new URL(invite.data.activationPath,base).searchParams.get('token'),password:'Account-password-123!'})).status).toBe(400);
 });
 it('preserves tenant history and clears a school administrator assignment on lock',async()=>{
  const a=await school('HISTORY-A'),b=await school('HISTORY-B'),teacher=await account(a.id,'history@example.test');
  store.run("INSERT INTO school_classes VALUES('history-class',?,?,?, ?,?,'HISTORY1')",a.id,teacher.id,'Class history',new Date().toISOString(),new Date().toISOString());
  expect((await api('/api/admin/users/'+teacher.id,'PUT',{...teacher,data:{...teacher.data,schoolId:b.id}})).status).toBe(409);
  const admin=await account(a.id,'assigned@example.test','SCHOOL_ADMIN');
  expect((await api('/api/admin/auth/activate','POST',{token:new URL(admin.activationPath,base).searchParams.get('token'),password:'School-password-123!'})).status).toBe(200);
  const active=(await api('/api/admin/users/'+admin.id)).data;
  expect((await api('/api/admin/schools/'+a.id,'PUT',{...a,data:{...a.data,administratorId:admin.id}})).status).toBe(200);
  expect((await api('/api/admin/users/'+active.id,'PUT',{...active,status:'locked'})).status).toBe(200);
  expect((await api('/api/admin/schools/'+a.id)).data.data.administratorId).toBeNull();
 });
});
