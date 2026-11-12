import {createServer,loadEnv} from 'vite';

// Exercise the real provider without creating accounts, drafts or database records.
// Only status and question counts are printed; never print credentials or request headers.
const env={...loadEnv('development',process.cwd(),'GEMINI_'),...Object.fromEntries(Object.entries(process.env).filter(([key])=>key.startsWith('GEMINI_')))};
const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
try{
 const {GeminiReactionProvider}=await server.ssrLoadModule('/server/reactionStudio/provider.ts');
 const provider=new GeminiReactionProvider(env);
 if(!provider.configured)throw new Error('Gemini chưa được cấu hình đầy đủ trong môi trường máy chủ.');
 const questions=await provider.questions({schemaVersion:1,name:'Phản ứng tạo kết tủa đồng(II) hiđroxit',reactants:[{formula:'CuSO4',coefficient:1,state:'aqueous'},{formula:'NaOH',coefficient:2,state:'aqueous'}],products:[{formula:'Cu(OH)2',coefficient:1,state:'solid'},{formula:'Na2SO4',coefficient:1,state:'aqueous'}],conditions:{contactRequired:true,heatingRequired:false,minTemperature:20,catalysts:[]},observation:'Xuất hiện kết tủa xanh lam Cu(OH)2.',explanation:'Ion Cu²⁺ kết hợp với ion OH⁻ tạo Cu(OH)₂ ít tan.',source:'',durationSeconds:10,learning:{grade:9,purpose:'Nhận biết phản ứng tạo kết tủa',mode:'guided',explanationLevel:'detailed',objectives:'Quan sát kết tủa, giải thích hiện tượng và viết phương trình cân bằng.',instructions:'Trộn hai dung dịch trong mô phỏng và ghi lại hiện tượng.'},questions:[]});
 if(questions.length<3||questions.length>5)throw new Error('Số câu hỏi chưa đúng yêu cầu 3–5 câu.');
 console.log(JSON.stringify({ok:true,count:questions.length,types:questions.map(q=>q.type),requiresTeacherReview:questions.every(q=>!q.reviewed)}));
}catch(error){console.error(JSON.stringify({ok:false,status:error.status||null,message:error.message}));process.exitCode=1}
finally{await server.close()}
