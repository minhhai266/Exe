import type {IncomingMessage} from 'node:http';
import type {ServerUser} from '../../src/features/admin/domain';
import type {Security} from '../admin/security';
import {ApiError} from '../admin/security';
import {ReactionStudioService} from './service';
import {randomUUID} from 'node:crypto';
export async function studioRequest(req:IncomingMessage,url:URL,user:ServerUser,security:Security,studio:ReactionStudioService,json:(req:IncomingMessage)=>Promise<any>,signal?:AbortSignal){
 const path=url.pathname;
 if(path==='/api/reaction-studio/config'&&req.method==='GET')return {provider:studio.provider.name,configured:studio.provider.configured,schemaVersion:1,user:{id:user.id,role:user.role,schoolId:user.schoolId}};
 if(path==='/api/reaction-studio/drafts'&&req.method==='GET')return studio.list(user);
 if((path==='/api/reaction-studio/analyze'||path==='/api/teacher/reactions/analyze')&&req.method==='POST'){security.limit('studio-analyze:'+user.id,8);const data=await json(req);if(data.inputType!==undefined&&!['equation','description'].includes(data.inputType))throw new ApiError(400,'Kiểu nội dung cần là phương trình hoặc mô tả.');return studio.analyze(user,path.startsWith('/api/teacher/')?{...data,method:'ai',purpose:data.purpose||'',simulationMode:data.simulationMode||'guided',explanationLevel:data.explanationLevel||'detailed'}:data,signal)}
 if(path==='/api/reaction-studio/drafts'&&req.method==='POST')return studio.save(user,await json(req));
 const match=path.match(/^\/api\/reaction-studio\/drafts\/([a-z0-9-]+)(?:\/(validate|preview|review|publish|questions|experiment|versions|archive|trial))?$/);
 if(!match)throw new ApiError(404,'Không tìm thấy API Reaction Studio.');
 const [,id,action]=match;
 if(req.method==='GET'){
  if(!action||action==='validate')return studio.get(user,id);
  if(action==='preview')return studio.preview(user,id);
  if(action==='experiment')return studio.experiment(user,id);
  if(action==='versions'){studio.get(user,id);return {items:studio.store.all('SELECT version,data,created_at FROM ai_reaction_draft_versions WHERE draft_id=? ORDER BY version DESC',id)}}
 }
 if(req.method==='PUT'&&!action)return studio.save(user,await json(req),id);
 if(req.method==='POST'){
  const body=await json(req);
  if(action==='trial'){
   const draft=studio.get(user,id);if(body.version!==draft.version||!draft.validation.previewAllowed)throw new ApiError(409,'Phiên bản chưa đủ điều kiện chạy thử.');
   if(!Array.isArray(body.vessels)||body.vessels.length>100||!Array.isArray(body.events)||body.events.length>5000)throw new ApiError(400,'Dữ liệu chạy thử không hợp lệ.');
   studio.store.run('INSERT INTO studio_trials VALUES(?,?,?,?,?,?)',randomUUID(),id,draft.version,user.id,JSON.stringify({vessels:body.vessels,events:body.events,notes:typeof body.notes==='string'?body.notes.slice(0,10000):''}),new Date().toISOString());
   studio.admin.audit(user,'preview_saved','reaction_drafts',id,draft.definition.name);return {ok:true};
  }
  if(action==='review')return studio.review(user,id,body);
  if(action==='publish')return studio.publish(user,id,body);
  if(action==='archive')return studio.archive(user,id,body);
  if(action==='questions'){security.limit('studio-questions:'+user.id,5);return studio.questions(user,id,body,signal)}
 }
 throw new ApiError(405,'Thao tác Reaction Studio không được hỗ trợ.');
}
