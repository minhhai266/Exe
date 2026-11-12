import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';

// Own Vite in this process: avoid Windows shell/process-tree teardown hangs.
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
Object.assign(process.env,{ADMIN_DB_PATH:':memory:',ADMIN_SETUP_TOKEN:'',ADMIN_SECURE_COOKIES:'0',GEMINI_API_KEY:'',GEMINI_MODEL:'',ADMIN_TEST_EXTERNAL_SERVER:'1'});
let server,child;
try{
 server=await createServer({server:{host:'127.0.0.1',port:5176,strictPort:true}});
 await server.listen();
 child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test','--config','playwright.admin.config.ts',...process.argv.slice(2)],{stdio:'inherit',env:process.env,windowsHide:true});
 const interrupt=()=>child?.kill();process.once('SIGINT',interrupt);process.once('SIGTERM',interrupt);
 process.exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code??1))});
 process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',interrupt);
}catch(error){console.error(error instanceof Error?error.message:error);process.exitCode=1}
finally{await server?.close()}
