import {afterAll,beforeAll,describe,it,expect} from 'vitest';
import {createServer,type Server} from 'node:http';
import {randomUUID} from 'node:crypto';
import {AdminDatabase} from './database';
import {adminMiddleware} from './plugin';
import {passwordHash} from './security';

let store:AdminDatabase,server:Server,base:string;
async function api(path:string,method='GET',data?:unknown,cookie=''){
 const response=await fetch(base+path,{method,headers:{'x-virtual-lab':'1',...(data?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:data?JSON.stringify(data):undefined});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]||''};
}
beforeAll(async()=>{store=new AdminDatabase(':memory:');const middleware=adminMiddleware(store);server=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end()}));await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+(server.address() as {port:number}).port});
afterAll(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));store.close()});
describe('Learner registration connects teacher authoring to real sessions',()=>{
 it('lets a self-registered teacher create a reaction draft, without granting administration',async()=>{
  const registered=await api('/api/admin/auth/register','POST',{name:'Teacher',email:'teacher@example.test',password:'password-123',role:'teacher',schoolId:'untrusted',status:'active'});
  expect(registered.status).toBe(201);expect(registered.cookie).toContain('vl_admin_session=');expect(registered.data.user).toMatchObject({role:'TEACHER',schoolId:null});expect(JSON.stringify(registered.data)).not.toContain('password');
  expect((await api('/api/reaction-studio/config','GET',undefined,registered.cookie)).status).toBe(200);
  const draft=await api('/api/reaction-studio/analyze','POST',{method:'equation',input:'Zn + 2HCl -> ZnCl2 + H2',grade:8,purpose:'Thu khí',simulationMode:'guided',explanationLevel:'brief'},registered.cookie);
  expect(draft.status).toBe(200);expect(draft.data.ownerId).toBe(registered.data.user.id);
  expect((await api('/api/admin/users','GET',undefined,registered.cookie)).status).toBe(403);
  expect(store.get('SELECT password_hash FROM users WHERE id=?',registered.data.user.id).password_hash).toMatch(/^scrypt:/);
 });
 it('keeps students outside Reaction Studio and rejects privileged registration roles',async()=>{
  const student=await api('/api/admin/auth/register','POST',{name:'Student',email:'student@example.test',password:'password-123',role:'student'});expect(student.status).toBe(201);
  expect((await api('/api/reaction-studio/config','GET',undefined,student.cookie)).status).toBe(403);
  expect((await api('/api/admin/auth/register','POST',{name:'Fake admin',email:'admin@example.test',password:'password-123',role:'SYSTEM_ADMIN'})).status).toBe(400);
 });
 it('preserves a legacy account ID but never replaces an existing server account',async()=>{
  const id=randomUUID(),payload={id,name:'Legacy teacher',email:'legacy@example.test',password:'password-123',role:'teacher'};
  expect((await api('/api/admin/auth/register','POST',payload)).data.user.id).toBe(id);
  const duplicate=await api('/api/admin/auth/register','POST',{...payload,password:'different-password'});expect(duplicate.status).toBe(409);expect(duplicate.cookie).toBe('');
  expect((await api('/api/admin/auth/register','POST',{...payload,email:'other@example.test'})).status).toBe(409);
  const login=await api('/api/admin/auth/login','POST',{email:payload.email,password:payload.password});expect(login.status).toBe(200);expect(login.data.user.id).toBe(id);
 });
 it('retains the existing minimum for admin passwords and validates learner passwords',async()=>{
  await expect(passwordHash('eight888')).rejects.toThrow('12');
  expect((await api('/api/admin/auth/register','POST',{name:'Short',email:'short@example.test',password:'short',role:'teacher'})).status).toBe(400);
 });
});
