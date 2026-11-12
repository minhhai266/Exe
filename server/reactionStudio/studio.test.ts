import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {createServer,type Server} from 'node:http';
import {AdminDatabase} from '../admin/database';
import {adminMiddleware} from '../admin/plugin';
import {AdminService} from '../admin/service';
import {ReactionStudioService} from './service';
import {GeminiReactionProvider} from './provider';
import {normalizeDefinition} from './validation';
let store:AdminDatabase,server:Server,base:string,cookie='';
async function api(path:string,method='GET',data?:any,session=cookie){const response=await fetch(base+path,{method,headers:{'x-virtual-lab':'1',...(session?{cookie:session}:{}),...(data!==undefined?{'content-type':'application/json'}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]||''}}
const request={method:'equation',input:'CuSO4 + 2NaOH -> Cu(OH)2 + Na2SO4',grade:9,purpose:'Quan sát kết tủa',simulationMode:'guided',explanationLevel:'detailed'};
beforeAll(async()=>{store=new AdminDatabase(':memory:');const middleware=adminMiddleware(store);server=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end()}));await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+(server.address() as any).port;const result=await api('/api/admin/auth/setup','POST',{name:'Studio Admin',email:'studio@example.test',password:'Studio-password-123!'});cookie=result.cookie});
afterAll(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));store.close()});
describe('Reaction Studio vertical slice over HTTP and SQLite',()=>{
 it('analyzes, saves, reopens and previews a verified precipitation equation',async()=>{
  const result=await api('/api/reaction-studio/analyze','POST',request);expect(result.status).toBe(200);
  expect(result.data.validation).toMatchObject({support:'SUPPORTED',science:'library-verified',previewAllowed:true});
  const loaded=await api('/api/reaction-studio/drafts/'+result.data.id);expect(loaded.data.definition.products[0].formula).toBe('Cu(OH)2');
  const preview=await api('/api/reaction-studio/drafts/'+result.data.id+'/preview');expect(preview.status).toBe(200);expect(preview.data.rule.effect).toBe('precipitate');
  expect((await api('/api/reaction-studio/drafts/'+result.data.id+'/publish','POST',{version:result.data.version})).status).toBe(409);
  const reviewed=await api('/api/reaction-studio/drafts/'+result.data.id+'/review','POST',{version:result.data.version,confirmed:true,source:result.data.definition.source,note:'Đối chiếu phản ứng với dữ liệu chuẩn của thư viện.'});expect(reviewed.status).toBe(200);
  const published=await api('/api/reaction-studio/drafts/'+result.data.id+'/publish','POST',{version:reviewed.data.version});expect(published.status).toBe(200);
  expect((await api('/api/catalog')).data.reactions.some((r:any)=>r.id===published.data.publishedReactionId)).toBe(true);
 });
 it('retains invalid or unsupported chemistry as drafts and prevents preview',async()=>{
  for(const equation of ['CuSO4 + NaOH -> Cu(OH)2 + Na2SO4','AgNO3 + NaCl -> AgCl + NaNO3']){
   const result=await api('/api/reaction-studio/analyze','POST',{...request,input:equation});expect(result.status).toBe(200);expect(result.data.validation.previewAllowed).toBe(false);
   expect((await api('/api/reaction-studio/drafts/'+result.data.id+'/preview')).status).toBe(409);
  }
  expect((await api('/api/reaction-studio/analyze','POST',{...request,input:'<script>alert(1)</script>'})).status).toBe(400);
 });
 it('invalidates review on edit and rejects stale writes and schema injections',async()=>{
  const draft=(await api('/api/reaction-studio/analyze','POST',request)).data;
  const reviewed=(await api('/api/reaction-studio/drafts/'+draft.id+'/review','POST',{version:draft.version,confirmed:true,source:draft.definition.source,note:'Kiểm tra phương trình và hiện tượng.'})).data;
  const edited=await api('/api/reaction-studio/drafts/'+draft.id,'PUT',{version:reviewed.version,definition:{...reviewed.definition,name:'Edited precipitation'}});expect(edited.status).toBe(200);expect(edited.data.review).toBeNull();
  expect((await api('/api/reaction-studio/drafts/'+draft.id,'PUT',{version:reviewed.version,definition:reviewed.definition})).status).toBe(409);
  expect((await api('/api/reaction-studio/drafts/'+draft.id,'PUT',{version:edited.data.version,definition:{...edited.data.definition,execute:'alert(1)'}})).status).toBe(400);
  expect((await api('/api/reaction-studio/drafts/'+draft.id+'/versions')).data.items.length).toBeGreaterThanOrEqual(3);
 });
 it('does not impersonate AI when no provider is configured',async()=>{
  expect((await api('/api/reaction-studio/config')).data.configured).toBe(false);
  expect((await api('/api/reaction-studio/analyze','POST',{...request,method:'ai',input:'Tạo kết tủa xanh lam'})).status).toBe(503);
  expect((await api('/api/reaction-studio/config','GET',undefined,'')).status).toBe(401);
  expect((await api('/api/reaction-draft','POST',{prompt:'Tạo phản ứng kết tủa'},'')).status).toBe(401);
 });
 it('isolates teacher drafts across schools and denies students and global teacher publication',async()=>{
  async function teacher(code:string){const school=(await api('/api/admin/schools','POST',{name:code,code,status:'active',data:{}})).data;const invited=(await api('/api/admin/users','POST',{name:code,status:'invited',data:{email:code+'@example.test',schoolId:school.id,role:'TEACHER'}})).data;await api('/api/admin/auth/activate','POST',{token:new URL(invited.activationPath,base).searchParams.get('token'),password:'Teacher-password-123!'});return (await api('/api/admin/auth/login','POST',{email:code+'@example.test',password:'Teacher-password-123!'})).cookie}
  const a=await teacher('STUDIO-A'),b=await teacher('STUDIO-B');
  const draft=(await api('/api/reaction-studio/analyze','POST',request,a)).data;
  expect((await api('/api/reaction-studio/drafts/'+draft.id,'GET',undefined,b)).status).toBe(404);
  expect((await api('/api/reaction-studio/drafts/'+draft.id+'/publish','POST',{version:draft.version},a)).status).toBe(403);
  expect((await api('/api/reaction-studio/drafts','GET',undefined,b)).data.items).toEqual([]);
 });
});
describe('provider trust boundary',()=>{
 it('retries a transient Gemini 503 only once and preserves structured validation',async()=>{
  const definition=normalizeDefinition(JSON.parse(store.get('SELECT data FROM ai_reaction_drafts ORDER BY created_at LIMIT 1').data));
  const fetcher=vi.fn().mockResolvedValueOnce(new Response('{}',{status:503})).mockResolvedValueOnce(new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(definition)}]}}]})));
  const provider=new GeminiReactionProvider({GEMINI_API_KEY:'test-key',GEMINI_MODEL:'test-model'},fetcher);
  expect((await provider.analyze(request as any,[])).name).toBe(definition.name);expect(fetcher).toHaveBeenCalledTimes(2);
 });
 it('retains drafts and returns a clear error after a second provider overload',async()=>{
  const fetcher=vi.fn().mockImplementation(()=>Promise.resolve(new Response('{}',{status:503})));
  const provider=new GeminiReactionProvider({GEMINI_API_KEY:'test-key',GEMINI_MODEL:'test-model'},fetcher);
  await expect(provider.analyze(request as any,[])).rejects.toThrow('quá tải');expect(fetcher).toHaveBeenCalledTimes(2);
 });
 it('never accepts AI question approval and only exports questions approved by the teacher',async()=>{
  const adminService=new AdminService(store),user=adminService.record('users',store.get("SELECT * FROM users WHERE role='SYSTEM_ADMIN' LIMIT 1"));
  const definition=normalizeDefinition(JSON.parse(store.get('SELECT data FROM ai_reaction_drafts ORDER BY created_at LIMIT 1').data));
  const provider={name:'Question test provider',configured:true,analyze:vi.fn(),questions:vi.fn().mockResolvedValue([{id:'question-test',type:'observation',prompt:'Mô tả kết tủa.',choices:[],answer:'Gợi ý riêng cho giáo viên.',reviewed:true}])};
  const service=new ReactionStudioService(store,adminService,provider);
  const draft=service.save(user as any,{definition}),generated=await service.questions(user as any,draft.id,{version:draft.version});
  expect(generated.definition.questions[0].reviewed).toBe(false);
  const reviewed=service.review(user as any,generated.id,{version:generated.version,confirmed:true,source:definition.source,note:'Đã kiểm tra nguồn và hiện tượng.'});
  expect(service.experiment(user as any,reviewed.id).questions).toEqual([]);
 });
 it('rolls back nested publication changes together with the enclosing transaction',()=>{
  const adminService=new AdminService(store),user=adminService.record('users',store.get("SELECT * FROM users WHERE role='SYSTEM_ADMIN' LIMIT 1"));
  const base=adminService.get(user as any,'reactions','precipitate'),before=store.get('SELECT COUNT(*) n FROM admin_audit_logs').n;
  expect(()=>store.transaction(()=>{adminService.save(user as any,'reactions',{...base,code:'rollback-studio',name:'Rollback studio'});throw new Error('Rollback test')})).toThrow('Rollback test');
  expect(store.get('SELECT id FROM reactions WHERE code=?','rollback-studio')).toBeUndefined();expect(store.get('SELECT COUNT(*) n FROM admin_audit_logs').n).toBe(before);
 });
 it('sends the versioned schema without keys or people in the prompt and distrusts question approvals',async()=>{
  const draft=normalizeDefinition(JSON.parse(store.get('SELECT data FROM ai_reaction_drafts ORDER BY created_at LIMIT 1').data));
  const result={...draft,questions:[]};
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result)}]}}]})));
  const provider=new GeminiReactionProvider({GEMINI_API_KEY:'provider-test-secret',GEMINI_MODEL:'test-model'},fetcher);
  const output=await provider.analyze(request as any,[]);expect(output.schemaVersion).toBe(1);
  const body=JSON.parse(fetcher.mock.calls[0][1].body);expect(body.generationConfig.responseJsonSchema.properties.schemaVersion.enum).toEqual([1]);expect(JSON.stringify(body)).not.toContain('provider-test-secret');
  expect(()=>normalizeDefinition({...draft,arbitraryCode:'x()'},true)).toThrow('schema');
 });
 it('enforces provider spending limits before making further requests',async()=>{
  const user=new AdminService(store).record('users',store.get("SELECT * FROM users WHERE role='SYSTEM_ADMIN' LIMIT 1"));
  const definition=normalizeDefinition(JSON.parse(store.get('SELECT data FROM ai_reaction_drafts ORDER BY created_at LIMIT 1').data));
  const provider={name:'Test provider',configured:true,analyze:vi.fn().mockResolvedValue(definition),questions:vi.fn()};
  const used=store.get('SELECT COUNT(*) n FROM ai_generation_requests WHERE user_id=?',user.id).n;
  const service=new ReactionStudioService(store,new AdminService(store),provider,{AI_STUDIO_DAILY_LIMIT:String(used+1)});
  await service.analyze(user as any,{...request,method:'ai'});
  await expect(service.analyze(user as any,{...request,method:'ai'})).rejects.toThrow('giới hạn');expect(provider.analyze).toHaveBeenCalledTimes(1);
 });
});
