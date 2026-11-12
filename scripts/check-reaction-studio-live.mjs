import {createServer,loadEnv} from 'vite';
const environment=loadEnv('development','.', ['GEMINI_']);
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(...args)=>{
 const response=await nativeFetch(...args);
 if(String(args[0]).startsWith('https://generativelanguage.googleapis.com/')&&!response.ok){
  const error=await response.clone().json().catch(()=>({}));
  const message=String(error.error?.message||'').replaceAll(environment.GEMINI_API_KEY||'__no_key__','[redacted]');
  console.log(JSON.stringify({providerHttpStatus:response.status,message}));
 }
 return response;
};
// Isolated database: never creates or changes a real administrator or teaching draft.
process.env.ADMIN_DB_PATH=':memory:';
process.env.ADMIN_SETUP_TOKEN='';
process.env.ADMIN_SECURE_COOKIES='0';
let server;
try{
 server=await createServer({server:{host:'127.0.0.1',port:5180,strictPort:true}});await server.listen();
 const base='http://127.0.0.1:5180';
 const setup=await fetch(base+'/api/admin/auth/setup',{method:'POST',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:JSON.stringify({name:'Isolated live check',email:'live-check@example.test',password:'Isolated-check-password-123!'})});
 if(!setup.ok)throw new Error('Could not initialize isolated verification.');
 const cookie=setup.headers.get('set-cookie').split(';')[0];
 const config=await (await fetch(base+'/api/reaction-studio/config',{headers:{cookie}})).json();
 if(!config.configured){console.log(JSON.stringify({configured:false}));process.exitCode=1}
 else{
  const response=await fetch(base+'/api/teacher/reactions/analyze',{method:'POST',headers:{'content-type':'application/json','x-virtual-lab':'1',cookie},body:JSON.stringify({input:'CuSO4 + 2NaOH -> Cu(OH)2 + Na2SO4',inputType:'equation',grade:9})});
  const result=await response.json();
  console.log(JSON.stringify({configured:true,status:response.status,provider:result.provenance?.provider,support:result.validation?.support,science:result.validation?.science,error:result.error?.message}));
  if(!response.ok)process.exitCode=1;
 }
}catch(error){console.error(error instanceof Error?error.message:'Live verification failed');process.exitCode=1}
finally{await server?.close()}
