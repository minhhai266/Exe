import {afterAll,afterEach,beforeAll,beforeEach,expect,it,vi} from 'vitest';
import {createServer,type Server} from 'node:http';
import {generateKeyPairSync,sign} from 'node:crypto';
import {OAuth2Client} from 'google-auth-library';
import {AdminDatabase} from './database';
import {adminMiddleware} from './plugin';

const clientId='test-client.apps.googleusercontent.com';
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
let store:AdminDatabase,server:Server,base:string;
function token(nonce:string,claims:Record<string,unknown>={},badSignature=false){
 const now=Math.floor(Date.now()/1000);
 const header=Buffer.from(JSON.stringify({alg:'RS256',kid:'test-key',typ:'JWT'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify({iss:'https://accounts.google.com',aud:clientId,sub:'google-subject-1',email:'learner@gmail.com',email_verified:true,name:'Nguyễn Minh Anh',iat:now,exp:now+3600,nonce,...claims})).toString('base64url');
 const input=header+'.'+payload;
 return input+'.'+(badSignature?Buffer.from('wrong-signature'):sign('RSA-SHA256',Buffer.from(input),keys.privateKey)).toString('base64url');
}
async function api(path:string,method='POST',data?:unknown,cookie='',extra:Record<string,string>={}){
 const response=await fetch(base+path,{method,headers:{'x-virtual-lab':'1',...(data?{'content-type':'application/json'}:{}),cookie,...extra},body:data?JSON.stringify(data):undefined});
 const cookies=response.headers.getSetCookie().map(c=>c.split(';')[0]);
 return {status:response.status,data:await response.json(),cookies,headers:response.headers};
}
async function prepare(role='student'){const response=await api('/api/admin/auth/google/prepare','POST',{role});expect(response.status).toBe(200);return {nonce:response.data.nonce,cookie:response.cookies[0]}}
async function login(role='student',claims:Record<string,unknown>={}){const p=await prepare(role);return api('/api/admin/auth/google','POST',{credential:token(p.nonce,claims)},p.cookie)}
beforeAll(()=>{
 // Keep real JWT signature/audience/issuer/expiry verification; only replace Google's key download.
 vi.spyOn(OAuth2Client.prototype,'getFederatedSignonCertsAsync').mockResolvedValue({certs:{'test-key':keys.publicKey.export({type:'spki',format:'pem'}).toString()},format:'PEM'} as any);
});
beforeEach(async()=>{
 store=new AdminDatabase(':memory:');const middleware=adminMiddleware(store,'',false,{GOOGLE_CLIENT_ID:clientId});
 server=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end()}));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+(server.address() as any).port;
});
afterEach(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));store.close()});
afterAll(()=>vi.restoreAllMocks());

it('creates a verified personal account and a server session without a fake school',async()=>{
 const result=await login();expect(result.status).toBe(200);
 expect(result.data.user).toMatchObject({name:'Nguyễn Minh Anh',email:'learner@gmail.com',role:'STUDENT',schoolId:null});
 const cookie=result.cookies.find(c=>c.startsWith('vl_admin_session='))!;
 expect(result.headers.getSetCookie().join(';')).toContain('HttpOnly');
 expect((await api('/api/admin/auth/state','GET',undefined,cookie)).data).toMatchObject({setupRequired:true,user:{id:result.data.user.id}});
 expect(store.get('SELECT COUNT(*) n FROM schools').n).toBe(0);
 expect((await api('/api/admin/dashboard','GET',undefined,cookie)).status).toBe(403);
 expect((await api('/api/learning/sessions','POST',{id:'google-practice',experimentId:'hydrogen'},cookie)).status).toBe(200);
 expect((await api('/api/admin/auth/logout','POST',{},cookie)).status).toBe(200);
 expect((await api('/api/admin/auth/state','GET',undefined,cookie)).data.user).toBeNull();
 // Personal users must not prevent the first system administrator from being initialized.
 expect((await api('/api/admin/auth/setup','POST',{name:'Admin',email:'admin@example.test',password:'Secure-password-123!'})).status).toBe(201);
});
it('preserves an existing identity and its role on subsequent sign-in',async()=>{
 const first=await login('teacher');expect(first.data.user.role).toBe('TEACHER');
 const second=await login('student');expect(second.status).toBe(200);expect(second.data.user.id).toBe(first.data.user.id);expect(second.data.user.role).toBe('TEACHER');
 expect(store.get('SELECT COUNT(*) n FROM users').n).toBe(1);
});
it('does not trust a role submitted with a Google credential',async()=>{
 const p=await prepare();const result=await api('/api/admin/auth/google','POST',{credential:token(p.nonce),role:'SYSTEM_ADMIN'},p.cookie);
 expect(result.data.user.role).toBe('STUDENT');
 expect((await api('/api/admin/auth/google/prepare','POST',{role:'SYSTEM_ADMIN'})).status).toBe(400);
});
it.each([
 ['wrong audience',{aud:'another-client'},false],
 ['wrong issuer',{iss:'https://evil.example'},false],
 ['expired token',{iat:1,exp:100},false],
 ['invalid signature',{},true],
 ['wrong nonce',{nonce:'wrong'},false],
 ['unverified email',{email_verified:false},false],
])('rejects %s without creating an account',async(_name,claims,badSignature)=>{
 const p=await prepare();const result=await api('/api/admin/auth/google','POST',{credential:token(p.nonce,claims,badSignature)},p.cookie);
 expect(result.status).toBe(401);expect(store.get('SELECT COUNT(*) n FROM users').n).toBe(0);
});
it('rejects missing, expired and replayed login challenges',async()=>{
 const p=await prepare(),credential=token(p.nonce);
 expect((await api('/api/admin/auth/google','POST',{credential})).status).toBe(401);
 expect((await api('/api/admin/auth/google','POST',{credential},p.cookie)).status).toBe(200);
 expect((await api('/api/admin/auth/google','POST',{credential},p.cookie)).status).toBe(401);
 const expired=await prepare();store.run("UPDATE google_login_challenges SET expires_at='2000-01-01'");
 expect((await api('/api/admin/auth/google','POST',{credential:token(expired.nonce)},expired.cookie)).status).toBe(401);
});
it('does not link an existing school or administrator account by email',async()=>{
 await api('/api/admin/auth/setup','POST',{name:'School Admin',email:'learner@gmail.com',password:'Secure-password-123!'});
 const result=await login();expect(result.status).toBe(409);
 expect(store.get('SELECT COUNT(*) n FROM google_identities').n).toBe(0);
});
it('blocks locked users and rejects cross-origin requests',async()=>{
 await login();store.run("UPDATE users SET status='locked'");expect((await login()).status).toBe(403);
 expect((await api('/api/admin/auth/google/prepare','POST',{role:'student'},'',{origin:'https://evil.example'})).status).toBe(403);
 expect((await api('/api/admin/auth/google/prepare','POST',{role:'student'},'',{'x-virtual-lab':''})).status).toBe(403);
});
