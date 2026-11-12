import type { Connect,Plugin } from 'vite';
import type { IncomingMessage,ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { AdminDatabase } from './database';
import { AdminService } from './service';
import {ReactionStudioService} from '../reactionStudio/service';
import {GeminiReactionProvider,type StudioAIConfig} from '../reactionStudio/provider';
import {studioRequest} from '../reactionStudio/http';
import {LearningService,learningRequest} from '../reactionStudio/learning';
import {reactionData,chemicalCatalog} from '../reactionStudio/validation';
import { ApiError,Security,passwordHash,publicUser,verifyPassword,activeAccount } from './security';
import {GoogleSignIn,type GoogleConfig} from './google';
import { text } from './validation';
import { effectTemplates } from '../../src/features/admin/domain';
import {phenomenonTemplates} from '../../src/engine/phenomena';
import { equipmentLibrary } from '../../src/engine/equipment';
import { supportedBehaviors } from './validation';

async function body(req:IncomingMessage,max=2*1024*1024){const chunks:Buffer[]=[];let total=0;for await(const chunk of req){const b=Buffer.from(chunk);total+=b.length;if(total>max)throw new ApiError(413,'Nội dung vượt dung lượng cho phép.');chunks.push(b)}return Buffer.concat(chunks)}
async function json(req:IncomingMessage){if(!req.headers['content-type']?.startsWith('application/json'))throw new ApiError(415,'Cần dữ liệu JSON.');try{const value=JSON.parse((await body(req)).toString());if(!value||typeof value!=='object'||Array.isArray(value))throw new ApiError(400,'Nội dung JSON cần là một đối tượng.');return value}catch(e){if(e instanceof ApiError)throw e;throw new ApiError(400,'JSON không hợp lệ.')}}
function sessionCookie(req:IncomingMessage,token:string,clear=false,forceSecure=false){const secure=forceSecure||!!(req.socket as any).encrypted;return `vl_admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:28800}${secure?'; Secure':''}`}
export function adminMiddleware(store:AdminDatabase,setupToken='',secureCookies=false,studioConfig:StudioAIConfig&GoogleConfig={}):Connect.NextHandleFunction{
 const service=new AdminService(store),security=new Security(store),google=new GoogleSignIn(store,studioConfig),studio=new ReactionStudioService(store,service,new GeminiReactionProvider(studioConfig),studioConfig);
 const learning=new LearningService(store,studio);
 return async(req,res,next)=>{
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`),path=url.pathname;
  if(path!=='/api/teacher/reactions/analyze'&&!path.startsWith('/api/admin')&&!path.startsWith('/api/learning')&&path!=='/api/catalog'&&path!=='/api/reaction-draft'&&!path.startsWith('/api/reaction-studio'))return next();
  const send=(status:number,data:any)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data));};
  try{
   security.sameOrigin(req);security.limit('all:'+req.socket.remoteAddress,300);
   if(path==='/api/admin/auth/google/prepare'&&req.method==='POST'){
    security.limit('google-prepare:'+req.socket.remoteAddress,30,300000);
    const data=await json(req),prepared=google.prepare(data.role||'student');
    res.setHeader('Set-Cookie',google.cookie(req,prepared.nonce,secureCookies));return send(200,prepared);
   }
   if(path==='/api/admin/auth/google'&&req.method==='POST'){
    security.limit('google-login:'+req.socket.remoteAddress,12,300000);
    const data=await json(req);
    res.setHeader('Set-Cookie',google.cookie(req,'',secureCookies));
    const user=await google.signIn(req,data.credential);
    security.revoke(req);
    res.setHeader('Set-Cookie',[google.cookie(req,'',secureCookies),sessionCookie(req,security.issue(user.id),false,secureCookies)]);
    return send(200,{user});
   }
   if(path==='/api/admin/auth/state'&&req.method==='GET'){const user=security.user(req);return send(200,{user:user||null,setupRequired:!store.get("SELECT COUNT(*) n FROM users WHERE role='SYSTEM_ADMIN'").n,requiresSetupToken:!!setupToken})}
   if(path==='/api/admin/auth/setup'&&req.method==='POST'){
    security.limit('setup:'+req.socket.remoteAddress,5,300000);const data=await json(req);const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'');if(setupToken?data.setupToken!==setupToken:!local)throw new ApiError(403,'Khởi tạo quản trị chỉ được thực hiện tại máy chủ hoặc bằng ADMIN_SETUP_TOKEN.');
    const name=text(data.name,'Họ tên',180),email=text(data.email,'Email',180).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError(400,'Email không hợp lệ.');const hash=await passwordHash(data.password),id=randomUUID(),now=new Date().toISOString();store.transaction(()=>{if(store.get("SELECT COUNT(*) n FROM users WHERE role='SYSTEM_ADMIN'").n)throw new ApiError(409,'Hệ thống đã có tài khoản quản trị.');store.run("INSERT INTO users VALUES(?,?,?,'SYSTEM_ADMIN',NULL,'active',?,1,?,?)",id,email,name,hash,now,now);service.audit(null,'system_initialized','users',id,'Khởi tạo System Admin')});res.setHeader('Set-Cookie',sessionCookie(req,security.issue(id),false,secureCookies));return send(201,{user:publicUser(store.get('SELECT * FROM users WHERE id=?',id))});
   }
   if(path==='/api/admin/auth/register'&&req.method==='POST'){
    security.limit('register:'+req.socket.remoteAddress,10,300000);
    const data=await json(req),name=text(data.name,'Họ tên',180),email=text(data.email,'Email',180).toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError(400,'Email không hợp lệ.');
    if(!['teacher','student'].includes(data.role))throw new ApiError(400,'Chỉ được đăng ký tài khoản giáo viên hoặc học sinh.');
    const id=data.id===undefined?randomUUID():text(data.id,'Mã tài khoản',36);
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new ApiError(400,'Mã tài khoản không hợp lệ.');
    const hash=await passwordHash(data.password,8),role=data.role==='teacher'?'TEACHER':'STUDENT',now=new Date().toISOString();
    store.transaction(()=>{
     if(store.get('SELECT id FROM users WHERE email=? OR id=?',email,id))throw new ApiError(409,'Email hoặc tài khoản này đã tồn tại trên máy chủ. Hãy đăng nhập bằng mật khẩu tài khoản đó.');
     store.run("INSERT INTO users (id,email,name,role,school_id,status,password_hash,version,created_at,updated_at) VALUES(?,?,?,?,NULL,'active',?,1,?,?)",id,email,name,role,hash,now,now);
     service.audit(null,'account_registered','users',id,'Đăng ký tài khoản '+role);
    });
    security.revoke(req);res.setHeader('Set-Cookie',sessionCookie(req,security.issue(id),false,secureCookies));
    return send(201,{user:publicUser(store.get('SELECT * FROM users WHERE id=?',id))});
   }
   if(path==='/api/admin/auth/login'&&req.method==='POST'){
    security.limit('login:'+req.socket.remoteAddress,12,300000);const data=await json(req),email=text(data.email,'Email',180).toLowerCase(),password=text(data.password,'Mật khẩu',200);const row=store.get('SELECT u.*,s.status school_status FROM users u LEFT JOIN schools s ON s.id=u.school_id WHERE u.email=?',email);const valid=await verifyPassword(password,row?.password_hash||null);if(!valid||!activeAccount(row))throw new ApiError(401,'Email hoặc mật khẩu không đúng, hoặc tài khoản chưa hoạt động.');res.setHeader('Set-Cookie',sessionCookie(req,security.issue(row.id),false,secureCookies));return send(200,{user:publicUser(row)});
   }
   if(path==='/api/admin/auth/logout'&&req.method==='POST'){security.revoke(req);res.setHeader('Set-Cookie',sessionCookie(req,'',true,secureCookies));return send(200,{ok:true})}
   if(path==='/api/admin/auth/activate'&&req.method==='POST'){security.limit('activate:'+req.socket.remoteAddress,10,300000);const data=await json(req);return send(200,await service.activate(text(data.token,'Mã liên kết',200),data.password))}
   if(path==='/api/reaction-draft'){
    if(req.method!=='POST')throw new ApiError(405,'Chỉ hỗ trợ POST.');
    const actor=security.require(req,['SYSTEM_ADMIN','TEACHER']);security.limit('studio-analyze:'+actor.id,8);
    const input=await json(req),result=await studio.analyze(actor,{method:'ai',input:input.prompt,grade:9,purpose:'Soạn bài thực hành',simulationMode:'guided',explanationLevel:'detailed'}),d=result.definition,data=reactionData(d,chemicalCatalog(store));
    return send(200,{draft:{title:d.name,objectives:d.learning.objectives,instructions:d.learning.instructions,hints:['Quan sát các chất trước khi trộn.','Đối chiếu tỉ lệ lượng chất với phương trình.','Ghi lại hiện tượng và giải thích bằng dữ liệu phản ứng.'],reactants:data.reactants,products:data.products,observation:d.observation,explanation:d.explanation,source:result.validation.reference?.source||d.source,minTemperature:d.conditions.minTemperature,durationSeconds:d.durationSeconds}});
   }
   if(path.startsWith('/api/reaction-studio')||path==='/api/teacher/reactions/analyze'){
    const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort()});
    return send(200,await studioRequest(req,url,security.require(req,['SYSTEM_ADMIN','TEACHER']),security,studio,json,controller.signal));
   }
   if(path==='/api/catalog'&&req.method==='GET')return send(200,service.publicCatalog());
   if(path.startsWith('/api/learning/')){
    if(path==='/api/learning/state'||path==='/api/learning/classes'||path==='/api/learning/classes/join'||path==='/api/learning/templates'||path==='/api/learning/assignments'||path==='/api/learning/submissions'||path==='/api/learning/materials'||/^\/api\/learning\/submissions\/[^/]+\/review$/.test(path))return send(200,await learningRequest(req,url,security.require(req,['TEACHER','STUDENT']),learning,json));
    const user=security.require(req,['TEACHER','STUDENT']);if(req.method!=='POST')throw new ApiError(405,'Chỉ hỗ trợ POST.');const data=await json(req);
    if(path==='/api/learning/sessions'){const id=text(data.id,'Session ID',100),experimentId=text(data.experimentId,'Experiment ID',100);if(!/^[A-Za-z0-9_-]+$/.test(id))throw new ApiError(400,'Session ID không hợp lệ.');const old=store.get('SELECT user_id FROM learning_sessions WHERE id=?',id);if(old&&old.user_id!==user.id)throw new ApiError(404,'Không tìm thấy phiên.');const now=new Date().toISOString();store.run("INSERT INTO learning_sessions(id,user_id,school_id,experiment_id,status,created_at,updated_at) VALUES(?,?,?,?,'started',?,?) ON CONFLICT(id) DO NOTHING",id,user.id,user.schoolId,experimentId,now,now);return send(200,{id})}
    const match=path.match(/^\/api\/learning\/sessions\/([A-Za-z0-9_-]+)\/complete$/);if(match){const change=store.run("UPDATE learning_sessions SET status='completed',updated_at=CASE WHEN completed_at IS NULL THEN ? ELSE updated_at END,completed_at=COALESCE(completed_at,?) WHERE id=? AND user_id=? AND school_id IS ?",new Date().toISOString(),new Date().toISOString(),match[1],user.id,user.schoolId);if(!change.changes)throw new ApiError(404,'Không tìm thấy phiên của bạn.');return send(200,{ok:true})}throw new ApiError(404,'Không tìm thấy API.');
   }
   const assetMatch=path.match(/^\/api\/admin\/assets\/([a-z0-9-]+)$/);
   if(assetMatch&&req.method==='GET'){
    const a=store.get('SELECT * FROM assets WHERE id=?',assetMatch[1]);if(!a)throw new ApiError(404,'Không tìm thấy file.');const visible=store.get("SELECT 1 FROM ebook_resources r JOIN ebooks e ON e.id=r.ebook_id WHERE r.asset_id=? AND e.status='published'",a.id)||store.get("SELECT 1 FROM apparatus WHERE status='published' AND json_extract(data,'$.assetUrl')=?",path);if(!visible&&!store.get("SELECT 1 FROM chemicals WHERE status='published' AND json_extract(data,'$.imageUrl')=?",path))security.require(req,['SYSTEM_ADMIN']);res.statusCode=200;res.setHeader('Content-Type',a.mime);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");res.setHeader('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(a.name)}`);res.setHeader('Cache-Control','private, max-age=60');res.end(Buffer.from(a.bytes));return;
   }
   const user=security.require(req);
   if(path==='/api/admin/profile'&&req.method==='PATCH'){const data=await json(req),name=text(data.name,'Họ tên',180);store.run('UPDATE users SET name=?,version=version+1,updated_at=? WHERE id=?',name,new Date().toISOString(),user.id);service.audit(user,'profile_updated','users',user.id,name);return send(200,{user:publicUser(store.get('SELECT * FROM users WHERE id=?',user.id))})}
   if(path==='/api/admin/dashboard'&&req.method==='GET')return send(200,service.dashboard(user,url.searchParams));
   if(path==='/api/admin/options'&&req.method==='GET')return send(200,{effects:effectTemplates,phenomena:phenomenonTemplates,templates:equipmentLibrary.map(e=>({...e,behaviors:supportedBehaviors(e.type)})),experiments:store.all('SELECT id,name FROM experiment_catalog'),chemicals:store.all("SELECT id,name,formula,status,json_extract(data,'$.category') category FROM chemicals WHERE status!='archived'"),reactions:store.all("SELECT id,name FROM reactions WHERE status!='archived'"),apparatus:store.all("SELECT id,name FROM apparatus WHERE status!='archived'"),schools:service.list(user,'schools',new URLSearchParams('pageSize=100')).items,users:user.role==='SYSTEM_ADMIN'?store.all("SELECT id,name,school_id schoolId FROM users WHERE role='SCHOOL_ADMIN' AND status='active'"):[]});
   if(path==='/api/admin/assets'&&req.method==='POST'){security.limit('upload:'+user.id,20);const bytes=await body(req,10*1024*1024);let name='file';try{name=decodeURIComponent(String(req.headers['x-file-name']||'file'))}catch{throw new ApiError(400,'Tên file không hợp lệ.')}return send(201,service.upload(user,name,bytes))}
   const match=path.match(/^\/api\/admin\/(chemicals|apparatus|reactions|ebooks|schools|users)(?:\/([^/]+))?(?:\/(invite|validate|overview|versions))?$/);if(!match)throw new ApiError(404,'Không tìm thấy API.');const resource=service.resource(match[1]),id=match[2]?decodeURIComponent(match[2]):undefined,action=match[3];
   if(action==='invite'&&id&&resource==='users'&&req.method==='POST')return send(200,service.invite(user,id));
   if(action==='overview'&&id&&resource==='schools'&&req.method==='GET')return send(200,service.schoolDetail(user,id));
   if(action==='versions'&&id&&req.method==='GET'){service.get(user,resource,id);if(user.role!=='SYSTEM_ADMIN')throw new ApiError(403,'Không có quyền xem phiên bản nội dung toàn hệ thống.');return send(200,{items:store.all('SELECT version,created_at,data FROM content_versions WHERE entity_type=? AND entity_id=? ORDER BY version DESC',resource,id)})}
   if(action==='validate'&&resource==='reactions'&&req.method==='POST'){if(user.role!=='SYSTEM_ADMIN')throw new ApiError(403,'Không có quyền kiểm tra bản nháp.');const data=await json(req);const {validateContent}=await import('./validation');return send(200,validateContent(resource,{...data,status:'draft'},store,id&&id!=='new'?service.get(user,resource,id):undefined))}
   if(action)throw new ApiError(405,'Thao tác không được hỗ trợ.');
   if(req.method==='GET')return send(200,id?service.get(user,resource,id):service.list(user,resource,url.searchParams));
   if(req.method==='POST'&&!id)return send(201,service.save(user,resource,await json(req)));
   if(req.method==='PUT'&&id)return send(200,service.save(user,resource,await json(req),id));
   throw new ApiError(405,'Phương thức không được hỗ trợ; sử dụng lưu trữ thay vì xóa vĩnh viễn.');
  }catch(error){if(error instanceof ApiError)return send(error.status,{error:{message:error.message}});const message=error instanceof Error?error.message:'';if(/UNIQUE constraint failed/i.test(message))return send(409,{error:{message:'Mã, công thức, email hoặc ID nội dung đã tồn tại.'}});if(/FOREIGN KEY constraint failed/i.test(message))return send(409,{error:{message:'Dữ liệu còn được tham chiếu hoặc liên kết không tồn tại.'}});console.error('[admin-api]',error instanceof Error?error.name:'UnknownError');send(500,{error:{message:'Không thể xử lý yêu cầu. Vui lòng thử lại hoặc kiểm tra máy chủ.'}})}
 };
}
export function adminPlugin(env:Record<string,string>={}):Plugin{
 let store:AdminDatabase|undefined;const mount=(server:{middlewares:Connect.Server})=>{const path=process.env.ADMIN_DB_PATH||env.ADMIN_DB_PATH||'.data/virtual-lab.sqlite';store||=new AdminDatabase(path===':memory:'?path:resolve(path));server.middlewares.use(adminMiddleware(store,process.env.ADMIN_SETUP_TOKEN||env.ADMIN_SETUP_TOKEN||'',(process.env.ADMIN_SECURE_COOKIES||env.ADMIN_SECURE_COOKIES)==='1',{...env,GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID||env.GOOGLE_CLIENT_ID,GEMINI_API_KEY:process.env.GEMINI_API_KEY??env.GEMINI_API_KEY,GEMINI_MODEL:process.env.GEMINI_MODEL??env.GEMINI_MODEL,AI_STUDIO_DAILY_LIMIT:process.env.AI_STUDIO_DAILY_LIMIT||env.AI_STUDIO_DAILY_LIMIT}))};
 return {name:'virtual-lab-admin',configureServer:mount,configurePreviewServer:mount,closeBundle(){store?.close();store=undefined}};
}
