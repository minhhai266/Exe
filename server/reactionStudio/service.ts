import {createHash,randomUUID} from 'node:crypto';
import type {AdminDatabase} from '../admin/database';
import {AdminService} from '../admin/service';
import {ApiError} from '../admin/security';
import {text,numeric,source} from '../admin/validation';
import type {ServerUser} from '../../src/features/admin/domain';
import {definitionEquation,parseReactionEquation,phaseToState,type ReactionDefinition} from '../../src/engine/reactionDefinition';
import {normalizeDefinition,normalizeQuestions,assessDefinition,compileDefinition,reactionData,chemicalCatalog} from './validation';
import type {AnalysisInput,ReactionAIProvider,StudioAIConfig} from './provider';
import type {Experiment} from '../../src/features/experiments/data';
import {defaultReactionSimulation} from '../../src/engine/reactionConfiguration';
import {defaultAssignmentConfig} from '../../src/engine/assignmentLab';
import {chemicals,type ChemicalId} from '../../src/engine/chemicals';

const hash=(definition:ReactionDefinition)=>createHash('sha256').update(JSON.stringify(definition)).digest('hex');
export class ReactionStudioService{
 private active=0;
 private analysisCache=new Map<string,{at:number;definition:ReactionDefinition}>();
 constructor(readonly store:AdminDatabase,readonly admin:AdminService,readonly provider:ReactionAIProvider,private config:StudioAIConfig={}){}
 get(user:ServerUser,id:string){
  const row=this.store.get('SELECT * FROM ai_reaction_drafts WHERE id=?'+(user.role==='SYSTEM_ADMIN'?'':' AND owner_id=? AND school_id IS ?'),id,...(user.role==='SYSTEM_ADMIN'?[]:[user.id,user.schoolId]));
  if(!row)throw new ApiError(404,'Không tìm thấy bản nháp trong phạm vi được cấp.');
  const definition=normalizeDefinition(JSON.parse(row.data)),review=row.review?JSON.parse(row.review):null;
  const reviewValid=review?.contentHash===hash(definition);
  return {id:row.id,ownerId:row.owner_id,schoolId:row.school_id,version:row.version,status:row.status,definition,validation:assessDefinition(this.store,definition,reviewValid),review:reviewValid?review:null,provenance:JSON.parse(row.provenance),publishedReactionId:row.published_reaction_id,createdAt:row.created_at,updatedAt:row.updated_at};
 }
 list(user:ServerUser){return {items:this.store.all('SELECT id,version,status,updated_at,json_extract(data,\'$.name\') name FROM ai_reaction_drafts WHERE status!=\'archived\''+(user.role==='SYSTEM_ADMIN'?'':' AND owner_id=? AND school_id IS ?')+' ORDER BY updated_at DESC LIMIT 100',...(user.role==='SYSTEM_ADMIN'?[]:[user.id,user.schoolId]))}}
 private input(value:any):AnalysisInput{
  if(!value||typeof value!=='object'||!Number.isInteger(value.grade)||!['guided','exploration'].includes(value.simulationMode)||!['brief','detailed'].includes(value.explanationLevel))throw new ApiError(400,'Cấu hình yêu cầu chưa hợp lệ.');
  return {input:text(value.input,'Phương trình / ý tưởng',4000),grade:numeric(value.grade,'Lớp',8,12),purpose:text(value.purpose||'','Mục đích',1000,false),simulationMode:value.simulationMode,explanationLevel:value.explanationLevel};
 }
 private async ai<T>(user:ServerUser,kind:'reaction'|'questions',run:()=>Promise<T>){
  if(!this.provider.configured)throw new ApiError(503,'Chưa cấu hình Gemini trên máy chủ. Chế độ nhập phương trình vẫn sử dụng được.');
  const limit=Math.max(1,Math.min(100,Number(this.config.AI_STUDIO_DAILY_LIMIT)||30)),since=new Date(Date.now()-86400000).toISOString();
  if(this.active>=2||this.store.get('SELECT COUNT(*) n FROM ai_generation_requests WHERE user_id=? AND created_at>=?',user.id,since).n>=limit)throw new ApiError(429,'Đã đạt giới hạn tạo AI. Vui lòng thử lại sau.');
  this.store.run('INSERT INTO ai_generation_requests VALUES(?,?,?,?)',randomUUID(),user.id,kind,new Date().toISOString());this.active++;
  try{return await run()}finally{this.active--}
 }
 async analyze(user:ServerUser,value:any,signal?:AbortSignal){
  const input=this.input(value);let definition:ReactionDefinition;
  if(value.method==='ai'){
   const cacheKey=createHash('sha256').update(JSON.stringify([user.id,input,this.config.GEMINI_MODEL])).digest('hex'),cached=this.analysisCache.get(cacheKey);
   definition=normalizeDefinition(await this.ai(user,'reaction',async()=>{if(cached&&Date.now()-cached.at<300000)return structuredClone(cached.definition);const fresh=normalizeDefinition(await this.provider.analyze(input,chemicalCatalog(this.store),signal),true);this.analysisCache.set(cacheKey,{at:Date.now(),definition:structuredClone(fresh)});if(this.analysisCache.size>200)this.analysisCache.delete(this.analysisCache.keys().next().value!);return fresh}),true);
   definition.learning={...definition.learning,grade:input.grade,purpose:input.purpose||definition.learning.purpose,mode:input.simulationMode,explanationLevel:input.explanationLevel};
  }
  else if(value.method==='equation'){
   let composition;try{composition=parseReactionEquation(input.input,chemicalCatalog(this.store))}catch(error){throw new ApiError(400,(error as Error).message)}
   const equivalent=(rows:any[],participants:any[])=>rows.length===participants.length&&rows.every(p=>participants.some(q=>q.formula===p.formula&&q.coefficient===p.coefficient));
   const rows=this.store.all("SELECT id,data FROM reactions WHERE status='published'");
   const catalog=chemicalCatalog(this.store);
   const base=rows.find(row=>{const d=JSON.parse(row.data),convert=(parts:any[])=>parts.map(p=>({formula:catalog.find(c=>c.id===p.chemical)?.formula,coefficient:p.coefficient}));return equivalent(composition.reactants,convert(d.reactants))&&equivalent(composition.products,convert(d.products))});
   const data=base?JSON.parse(base.data):{},experiment=base?this.store.get('SELECT data FROM experiment_catalog WHERE id=?',base.id):null,lesson=experiment?JSON.parse(experiment.data):{};
   definition=normalizeDefinition({schemaVersion:1,name:data.name||definitionEquation(composition),...composition,conditions:{contactRequired:true,heatingRequired:(data.minTemperature||20)>25,minTemperature:data.minTemperature||20,catalysts:[]},observation:data.observation||'',explanation:data.explanation||'',source:data.source||'',durationSeconds:data.durationSeconds||10,learning:{grade:input.grade,purpose:input.purpose,mode:input.simulationMode,explanationLevel:input.explanationLevel,objectives:input.purpose||lesson.objectives||'',instructions:lesson.instructions||''},questions:[]});
  }else throw new ApiError(400,'Chọn phân tích phương trình hoặc AI.');
  if(signal?.aborted)throw new ApiError(499,'Đã hủy yêu cầu AI.');
  if(typeof value.name==='string'&&value.name.trim())definition.name=text(value.name,'Tên phản ứng',180);
  definition.simulation ||= defaultReactionSimulation(definition);
  return this.save(user,{definition},undefined,{method:value.method,provider:value.method==='ai'?this.provider.name:'equation-parser'});
 }
 save(user:ServerUser,input:any,id?:string,origin?:{method:string;provider:string}){
  const old=id?this.get(user,id):undefined;
  if(old&&input.version!==old.version)throw new ApiError(409,'Bản nháp đã thay đổi. Tải lại trước khi lưu.');
  const definition=normalizeDefinition(input.definition),same=old&&hash(old.definition)===hash(definition),review=same?old.review:null;
  const validation=assessDefinition(this.store,definition,!!review),now=new Date().toISOString(),key=id||randomUUID(),version=(old?.version||0)+1;
  const provenance=old?.provenance||{method:origin?.method||'manual',provider:origin?.provider||'manual-editor',generatedAt:now};
  this.store.transaction(()=>{
   if(old)this.store.run("UPDATE ai_reaction_drafts SET data=?,validation=?,review=?,status='draft',version=?,updated_at=? WHERE id=?",JSON.stringify(definition),JSON.stringify(validation),review?JSON.stringify(review):null,version,now,key);
   else this.store.run("INSERT INTO ai_reaction_drafts VALUES(?,?,?,?, 'draft',?,?,?,?,NULL,1,?,?)",key,user.id,user.schoolId,1,JSON.stringify(definition),JSON.stringify(validation),JSON.stringify(provenance),null,now,now);
   this.store.run('INSERT INTO ai_reaction_draft_versions VALUES(?,?,?,?,?)',key,version,JSON.stringify({definition,validation,review}),user.id,now);
   this.admin.audit(user,old?'updated':'created','reaction_drafts',key,definition.name);
  });return this.get(user,key);
 }
 review(user:ServerUser,id:string,input:any){
  const draft=this.get(user,id);if(draft.version!==input.version)throw new ApiError(409,'Bản nháp đã thay đổi.');
  if(input.confirmed!==true)throw new ApiError(400,'Cần xác nhận đã đối chiếu dữ liệu với nguồn độc lập.');
  const reviewSource=source(input.source,true),note=text(input.note,'Ghi chú kiểm chứng',2000),validation=assessDefinition(this.store,draft.definition);
  if(!validation.balanceValid||validation.support!=='SUPPORTED')throw new ApiError(409,'Sửa phương trình và các giới hạn mô hình trước khi duyệt.');
  const review={actorId:user.id,source:reviewSource,note,contentHash:hash(draft.definition),reviewedAt:new Date().toISOString()};
  this.store.transaction(()=>{this.store.run('UPDATE ai_reaction_drafts SET review=?,validation=?,version=version+1,updated_at=? WHERE id=?',JSON.stringify(review),JSON.stringify(assessDefinition(this.store,draft.definition,true)),review.reviewedAt,id);this.store.run('INSERT INTO ai_reaction_draft_versions VALUES(?,?,?,?,?)',id,draft.version+1,JSON.stringify({definition:draft.definition,validation:assessDefinition(this.store,draft.definition,true),review}),user.id,review.reviewedAt);this.admin.audit(user,'reviewed','reaction_drafts',id,draft.definition.name)});
  return this.get(user,id);
 }
 preview(user:ServerUser,id:string){const draft=this.get(user,id);if(!draft.validation.previewAllowed)throw new ApiError(409,'Bản nháp chưa đủ điều kiện mô phỏng. Xem kết quả kiểm tra.');return {rule:compileDefinition(this.store,{...draft.definition,source:draft.review?.source||draft.validation.reference?.source||draft.definition.source},id),validation:draft.validation,returnTo:user.role==='SYSTEM_ADMIN'?'/admin/reactions/studio':'/teacher/reaction-studio',definitionVersion:draft.version,experiment:this.experiment(user,id,true),config:defaultAssignmentConfig(this.experiment(user,id,true))}}
 async questions(user:ServerUser,id:string,input:any,signal?:AbortSignal){const draft=this.get(user,id);if(draft.version!==input.version)throw new ApiError(409,'Bản nháp đã thay đổi.');if(!draft.validation.previewAllowed)throw new ApiError(409,'Cần phản ứng hợp lệ trước khi tạo câu hỏi.');const questions=normalizeQuestions(await this.ai(user,'questions',()=>this.provider.questions(draft.definition,signal)),true);return this.save(user,{version:draft.version,definition:{...draft.definition,questions}},id)}
 publish(user:ServerUser,id:string,input:any){
  if(user.role!=='SYSTEM_ADMIN')throw new ApiError(403,'Chỉ System Admin xuất bản thư viện dùng chung.');const draft=this.get(user,id);
  if(draft.version!==input.version)throw new ApiError(409,'Bản nháp đã thay đổi.');
  if(draft.status==='published')throw new ApiError(409,'Phiên bản này đã được xuất bản. Lưu thay đổi thành bản nháp trước khi xuất bản phiên bản mới.');
  if(!draft.validation.previewAllowed||!draft.review)throw new ApiError(409,'Cần xác nhận kiểm chứng và cấu hình được hỗ trợ trước khi xuất bản.');
  const data=reactionData(draft.definition,chemicalCatalog(this.store));
  // AdminService owns the publication transaction, versions, reference checks and audit.
  return this.store.transaction(()=>{
   const reaction=this.admin.save(user,'reactions',{name:draft.definition.name,code:`studio-${id}-${draft.version}`,status:'published',data:{...data,source:draft.review.source,reviewed:true}}),now=new Date().toISOString();
   this.store.run("UPDATE ai_reaction_drafts SET status='published',published_reaction_id=?,version=version+1,updated_at=? WHERE id=?",reaction.id,now,id);
   const next=this.get(user,id);this.store.run('INSERT INTO ai_reaction_draft_versions VALUES(?,?,?,?,?)',id,next.version,JSON.stringify({definition:next.definition,validation:next.validation,review:next.review,status:'published',publishedReactionId:reaction.id}),user.id,now);
   return {...next,reaction};
  });
 }
 experiment(user:ServerUser,id:string,preview=false):Experiment{
  const draft=this.get(user,id);if(!draft.validation.previewAllowed||!preview&&!draft.review)throw new ApiError(409,'Cần kiểm chứng nội dung trước khi đưa vào bài thực hành.');
  const rule=compileDefinition(this.store,{...draft.definition,source:draft.review?.source||draft.validation.reference?.source||draft.definition.source},id),d=draft.definition,simulation=d.simulation||defaultReactionSimulation(d);
  const data=reactionData(d,chemicalCatalog(this.store)),product=[...data.products].sort((a,b)=>Number(['khí','kết tủa'].includes(chemicals[b.chemical as ChemicalId].phase))-Number(['khí','kết tủa'].includes(chemicals[a.chemical as ChemicalId].phase)))[0].chemical as ChemicalId;
  return {assessmentQuestions:d.questions.filter(q=>q.reviewed).map(({answer,...q})=>q),reactionDefinition:{id:draft.id,version:draft.version},id:'studio-'+draft.id+'-v'+draft.version,simulation,ownerId:user.id,title:d.name,subtitle:d.observation,grade:d.learning.grade,topic:'Phản ứng tự soạn',minutes:simulation.minutes,difficulty:simulation.difficulty,reagents:[...new Set([...data.reactants.map(p=>p.chemical as ChemicalId),...(rule.catalysts||[])])],equipment:simulation.equipment,product,goals:['product','observe','equation'],objectives:d.learning.objectives||d.learning.purpose,instructions:d.learning.instructions,hints:simulation.hints,amount:10,status:preview?'draft':'published',customReaction:rule,demo:false,questions:d.questions.filter(q=>q.reviewed).map(q=>q.prompt+(q.choices.length?'\n'+q.choices.map((choice,index)=>`${String.fromCharCode(65+index)}. ${choice}`).join('\n'):''))};
 }
 archive(user:ServerUser,id:string,input:any){const draft=this.get(user,id);if(input.version!==draft.version)throw new ApiError(409,'Bản nháp đã thay đổi.');return this.store.transaction(()=>{const now=new Date().toISOString();this.store.run("UPDATE ai_reaction_drafts SET status='archived',version=version+1,updated_at=? WHERE id=?",now,id);this.store.run('INSERT INTO ai_reaction_draft_versions VALUES(?,?,?,?,?)',id,draft.version+1,JSON.stringify({definition:draft.definition,validation:draft.validation,review:draft.review,status:'archived'}),user.id,now);this.admin.audit(user,'archived','reaction_drafts',id,draft.definition.name);return this.get(user,id)})}
}
