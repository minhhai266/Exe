import {randomBytes,randomUUID} from 'node:crypto';
import type {IncomingMessage} from 'node:http';
import type {ServerUser} from '../../src/features/admin/domain';
import type {AdminDatabase} from '../admin/database';
import {ApiError} from '../admin/security';
import {text,source,numeric} from '../admin/validation';
import {validateConfig,defaultAssignmentConfig,gradeRubric,type AssignmentConfig} from '../../src/engine/assignmentLab';
import {ReactionStudioService} from './service';
import {experiments,type Experiment} from '../../src/features/experiments/data';
import {AdminService} from '../admin/service';
import {reactionRules} from '../../src/engine/reactionRules';
import {chemicalCatalog,normalizeDefinition} from './validation';
import {phaseToState} from '../../src/engine/reactionDefinition';
import {defaultReactionSimulation} from '../../src/engine/reactionConfiguration';
import {chemicals} from '../../src/engine/chemicals';

export class LearningService{
 constructor(private store:AdminDatabase,private studio:ReactionStudioService){}
 private teacher(user:ServerUser){if(user.role!=='TEACHER')throw new ApiError(403,'Chỉ giáo viên quản lý lớp học.')}
 private classroom(user:ServerUser,id:string,write=false){
  const row=this.store.get('SELECT * FROM school_classes WHERE id=?',id);
  if(!row||row.school_id&&row.school_id!==user.schoolId||write&&row.teacher_id!==user.id||!write&&row.teacher_id!==user.id&&!this.store.get('SELECT 1 FROM class_members WHERE class_id=? AND user_id=?',id,user.id))throw new ApiError(404,'Không tìm thấy lớp trong phạm vi được cấp.');
  return row;
 }
 state(user:ServerUser){
  const rows=this.store.all('SELECT c.*,u.name teacher_name FROM school_classes c JOIN users u ON u.id=c.teacher_id WHERE c.teacher_id=? OR EXISTS(SELECT 1 FROM class_members m WHERE m.class_id=c.id AND m.user_id=?)',user.id,user.id).filter(c=>!c.school_id||c.school_id===user.schoolId);
  const classes=rows.map(c=>({id:c.id,name:c.name,code:c.join_code,teacherId:c.teacher_id,teacherName:c.teacher_name,createdAt:c.created_at,members:this.store.all('SELECT u.id,u.name,m.joined_at joinedAt FROM class_members m JOIN users u ON u.id=m.user_id WHERE m.class_id=?',c.id)}));
  const assignments=rows.flatMap(c=>this.store.all('SELECT * FROM learning_assignments WHERE class_id=? ORDER BY created_at DESC',c.id).map(a=>this.assignment(a)));
  const submissions=rows.flatMap(c=>this.store.all('SELECT s.*,u.name student_name FROM learning_submissions s JOIN users u ON u.id=s.student_id JOIN learning_assignments a ON a.id=s.assignment_id WHERE a.class_id=?'+(c.teacher_id===user.id?'':' AND s.student_id=?'),c.id,...(c.teacher_id===user.id?[]:[user.id])).map(s=>({id:s.id,assignmentId:s.assignment_id,studentId:s.student_id,studentName:s.student_name,attempt:JSON.parse(s.attempt),submittedAt:s.submitted_at,feedback:s.feedback,grade:s.grade,criterionGrades:s.criterion_grades?JSON.parse(s.criterion_grades):undefined,reviewedAt:s.reviewed_at})));
  const materials=rows.flatMap(c=>this.store.all('SELECT id,class_id classId,title,body,url,created_at createdAt FROM learning_materials WHERE class_id=?',c.id));
  const templates=user.role==='TEACHER'?this.store.all('SELECT data FROM studio_experiment_templates WHERE owner_id=?',user.id).map(r=>JSON.parse(r.data)):[];
  return {userId:user.id,classes,assignments,submissions,materials,templates};
 }
 private assignment(a:any){const config=JSON.parse(a.config);return {id:a.id,classId:a.class_id,experimentId:config.experiment.id,title:a.title,instructions:a.instructions,dueAt:a.due_at,createdAt:a.created_at,config}}
 createClass(user:ServerUser,data:any){
  this.teacher(user);const id=data.id?text(data.id,'ID lớp',100):randomUUID(),name=text(data.name,'Tên lớp',100),now=new Date().toISOString();
  const old=this.store.get('SELECT * FROM school_classes WHERE id=?',id);if(old){this.classroom(user,id,true);return {id}}
  const code=typeof data.code==='string'&&/^[A-Z0-9]{8}$/.test(data.code)?data.code:randomBytes(4).toString('hex').toUpperCase();
  this.store.transaction(()=>{this.store.run('INSERT INTO school_classes VALUES(?,?,?,?,?,?,?)',id,user.schoolId,user.id,name,now,now,code);new AdminService(this.store).audit(user,'class_created','classes',id,name)});return {id};
 }
 join(user:ServerUser,data:any){
  if(user.role!=='STUDENT')throw new ApiError(403,'Chỉ học sinh được tham gia lớp.');
  const code=text(data.code,'Mã lớp',8).toUpperCase(),row=this.store.get('SELECT * FROM school_classes WHERE join_code=?',code);
  if(!row||row.school_id&&row.school_id!==user.schoolId)throw new ApiError(404,'Không tìm thấy lớp phù hợp với tài khoản này.');
  this.store.run('INSERT OR IGNORE INTO class_members VALUES(?,?,?)',row.id,user.id,new Date().toISOString());return {id:row.id};
 }
 saveTemplate(user:ServerUser,experiment:Experiment){
  this.teacher(user);if(!experiment||typeof experiment!=='object')throw new ApiError(400,'Bài thực hành không hợp lệ.');
  if(!Array.isArray(experiment.reagents)||experiment.reagents.length>20||!Array.isArray(experiment.equipment)||!Array.isArray(experiment.hints)||experiment.hints.length>10||!Array.isArray(experiment.goals)||experiment.goals.some(g=>!['product','observe','equation','collectGas'].includes(g)))throw new ApiError(400,'Kho, gợi ý hoặc mục tiêu bài học không hợp lệ.');
  experiment={...experiment,id:text(experiment.id,'ID bài',150),minutes:numeric(experiment.minutes,'Thời lượng',0,240),difficulty:text(experiment.difficulty,'Độ khó',100)};
  if(!experiment.reactionDefinition){
   // Preserve the existing manual/library builder by importing its data through the same validator.
   const rule=experiment.customReaction||reactionRules.find(r=>Object.keys(r.reactants).every(c=>experiment.reagents?.includes(c as any))&&Object.hasOwn(r.products,experiment.product));
   if(!rule||experiment.customReaction&&!rule.teacherReviewed)throw new ApiError(409,'Cần xác nhận nguồn phản ứng trước khi lưu bài.');
   const catalog=chemicalCatalog(this.store),species=(values:any)=>Object.entries(values).map(([id,coefficient])=>{const c=catalog.find(c=>c.id===id);if(!c)throw new ApiError(400,'Hóa chất chưa có trong thư viện.');return {formula:c.formula,coefficient,state:phaseToState(c.phase)}});
   const definition=normalizeDefinition({schemaVersion:1,name:experiment.title,reactants:species(rule.reactants),products:species(rule.products),conditions:{contactRequired:true,heatingRequired:(rule.minTemperature||20)>25,minTemperature:rule.minTemperature||20,catalysts:(rule.catalysts||[]).map(id=>catalog.find(c=>c.id===id)?.formula)},durationSeconds:rule.durationSeconds||10,observation:rule.observation,explanation:rule.explanation,source:rule.source||JSON.parse(this.store.get('SELECT data FROM reactions WHERE id=?',rule.id)?.data||'{}').source||'',learning:{grade:experiment.grade,purpose:experiment.objectives,objectives:experiment.objectives,instructions:experiment.instructions||'',mode:'guided',explanationLevel:'detailed'},questions:[]});
   definition.simulation={...defaultReactionSimulation(definition),equipment:experiment.equipment,minutes:experiment.minutes,hints:experiment.hints.filter(Boolean),difficulty:experiment.difficulty};
   const imported=this.studio.save(user,{definition}),reviewed=this.studio.review(user,imported.id,{version:imported.version,confirmed:true,source:definition.source,note:'Nhập từ trình tạo bài: giáo viên đã xác nhận nội dung và nguồn phản ứng.'}),compiled=this.studio.experiment(user,reviewed.id);
   experiment={...experiment,reactionDefinition:compiled.reactionDefinition,customReaction:compiled.customReaction,simulation:definition.simulation};
  }
  const reference=experiment.reactionDefinition;if(!reference)throw new ApiError(400,'Chưa có phiên bản phản ứng.');
  const draft=this.studio.get(user,reference.id);
  if(draft.version!==reference.version)throw new ApiError(409,'Bản phản ứng đã thay đổi. Tạo bài từ phiên bản mới trước khi lưu.');
  const canonical=this.studio.experiment(user,draft.id);
  if(JSON.stringify(experiment.customReaction)!==JSON.stringify(canonical.customReaction))throw new ApiError(400,'Không được sửa quy tắc hóa học của bản đã kiểm chứng.');
  const old=this.store.get('SELECT owner_id FROM studio_experiment_templates WHERE id=?',experiment.id);if(old&&old.owner_id!==user.id)throw new ApiError(404,'Không tìm thấy bài của bạn.');
  const saved={...canonical,...experiment,assessmentQuestions:canonical.assessmentQuestions,customReaction:canonical.customReaction,product:canonical.product,reactionDefinition:canonical.reactionDefinition,ownerId:user.id,title:text(experiment.title,'Tên bài',180),objectives:text(experiment.objectives,'Mục tiêu',3000),status:experiment.status==='published'?'published':'draft'};
  validateConfig(defaultAssignmentConfig(saved));
  this.store.transaction(()=>{this.store.run('INSERT INTO studio_experiment_templates VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at',saved.id,user.id,draft.id,draft.version,JSON.stringify(saved),new Date().toISOString());new AdminService(this.store).audit(user,'template_saved','experiment_templates',saved.id,saved.title)});return saved;
 }
 assign(user:ServerUser,data:any){
  this.teacher(user);this.classroom(user,text(data.classId,'Lớp',100),true);
  let experiment:Experiment;
  if(data.draftId){const draft=this.studio.get(user,text(data.draftId,'Bản nháp',100));if(data.version!==draft.version)throw new ApiError(409,'Bản nháp đã thay đổi.');experiment=this.studio.experiment(user,draft.id)}
  else {const template=this.store.get('SELECT data FROM studio_experiment_templates WHERE id=? AND owner_id=?',data.experimentId,user.id);experiment=template?JSON.parse(template.data):experiments.find(e=>e.id===data.experimentId)!;if(!experiment||experiment.status==='draft'||experiment.access==='premium')throw new ApiError(400,'Chọn bài đã xuất bản và được phép sử dụng.');}
  const config:AssignmentConfig=structuredClone(data.config||defaultAssignmentConfig(experiment));
  // The immutable reaction rule and private answers always come from the server, never the submitted config.
  config.experiment={...experiment,...config.experiment,id:experiment.id,ownerId:experiment.ownerId,customReaction:experiment.customReaction,reactionDefinition:experiment.reactionDefinition,product:experiment.product,goals:experiment.goals,reagents:experiment.reagents,equipment:config.equipment,status:'published'};
  if(data.config&&JSON.stringify(data.config.experiment.customReaction)!==JSON.stringify(experiment.customReaction))throw new ApiError(400,'Cấu hình không được thay đổi quy tắc phản ứng.');
  try{validateConfig(config)}catch(error){throw new ApiError(400,(error as Error).message)}
  if(!config.questions.every(q=>typeof q==='string'&&q.length<=4000))throw new ApiError(400,'Câu hỏi không hợp lệ.');
  const due=data.dueAt?new Date(data.dueAt):null;if(due&&(!Number.isFinite(due.getTime())||due.getTime()<=Date.now()))throw new ApiError(400,'Hạn nộp phải ở tương lai.');
  const id=randomUUID(),now=new Date().toISOString();
  this.store.transaction(()=>{this.store.run('INSERT INTO learning_assignments VALUES(?,?,?,?,?,?,?,?,?,?)',id,data.classId,user.id,experiment.reactionDefinition?.id||null,experiment.reactionDefinition?.version||null,text(data.title||experiment.title,'Tiêu đề',180),text(data.instructions||'','Yêu cầu',4000,false),due?.toISOString()||'',JSON.stringify(config),now);new AdminService(this.store).audit(user,'assigned','assignments',id,experiment.title)});
  return this.assignment(this.store.get('SELECT * FROM learning_assignments WHERE id=?',id));
 }
 submit(user:ServerUser,data:any){
  if(user.role!=='STUDENT')throw new ApiError(403,'Chỉ học sinh được nộp bài.');
  const assignment=this.store.get('SELECT * FROM learning_assignments WHERE id=?',text(data.assignmentId,'Bài giao',100));if(!assignment)throw new ApiError(404,'Không tìm thấy bài giao.');
  this.classroom(user,assignment.class_id);const config:AssignmentConfig=JSON.parse(assignment.config),attempt=data.attempt;
  if(!attempt||attempt.experimentId!==config.experiment.id||!Array.isArray(attempt.vesselSnapshot)||!Array.isArray(attempt.session?.events)||attempt.vesselSnapshot.length>100||attempt.session.events.length>5000)throw new ApiError(400,'Dữ liệu thực hành không hợp lệ.');
  const contents=(value:any)=>value===undefined||value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([id,n])=>Object.hasOwn(chemicals,id)&&typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1000);
  if(attempt.vesselSnapshot.some((v:any)=>!v||typeof v.id!=='string'||!contents(v.contents)||!contents(v.produced)||!contents(v.collected)||!contents(v.escaped))||!contents(attempt.contents)||!contents(attempt.produced)||!contents(attempt.collected)||!contents(attempt.escaped)||typeof attempt.notes!=='string'||attempt.notes.length>10000||attempt.logs&&(!Array.isArray(attempt.logs)||attempt.logs.length>500)||attempt.answers&&(typeof attempt.answers!=='object'||Array.isArray(attempt.answers)||Object.entries(attempt.answers).some(([q,a])=>q.length>4000||typeof a!=='string'||a.length>10000)))throw new ApiError(400,'Nội dung bài nộp hoặc lượng chất không hợp lệ.');
  const now=new Date().toISOString();
  // Recompute the rubric from the snapshot; essays remain ungraded until the teacher reviews them.
  const assessment=gradeRubric(config,attempt.vesselSnapshot,attempt.session.events,String(attempt.notes||''),attempt.stockUsed||{});
  const saved={...attempt,userId:user.id,assignmentId:assignment.id,assignmentConfig:config,assessment,score:assessment.reduce((n,r)=>n+(r.earned??0),0)*10};
  const id=randomUUID();this.store.run('INSERT OR IGNORE INTO learning_submissions(id,assignment_id,student_id,attempt_id,attempt,submitted_at) VALUES(?,?,?,?,?,?)',id,assignment.id,user.id,text(attempt.id,'Lần nộp',100),JSON.stringify(saved),now);return {ok:true};
 }
 review(user:ServerUser,id:string,data:any){
  this.teacher(user);const row=this.store.get('SELECT s.*,a.class_id FROM learning_submissions s JOIN learning_assignments a ON a.id=s.assignment_id WHERE s.id=?',id);if(!row)throw new ApiError(404,'Không tìm thấy bài nộp.');this.classroom(user,row.class_id,true);
  const grade=numeric(data.grade,'Điểm',0,10);const criteria=data.criterionGrades||{},attempt=JSON.parse(row.attempt);
  for(const [key,value] of Object.entries(criteria)){const r=attempt.assessment.find((r:any)=>r.id===key&&r.earned===null);if(!r||typeof value!=='number'||!Number.isFinite(value)||value<0||value>r.points)throw new ApiError(400,'Điểm tiêu chí vượt trọng số.');}
  this.store.transaction(()=>{this.store.run('UPDATE learning_submissions SET feedback=?,grade=?,criterion_grades=?,reviewed_at=? WHERE id=?',text(data.feedback||'','Nhận xét',4000,false),grade,JSON.stringify(criteria),new Date().toISOString(),id);new AdminService(this.store).audit(user,'submission_reviewed','submissions',id,'Đánh giá bài thực hành')});return {ok:true};
 }
 share(user:ServerUser,data:any){this.teacher(user);this.classroom(user,data.classId,true);this.store.run('INSERT INTO learning_materials VALUES(?,?,?,?,?,?)',randomUUID(),data.classId,text(data.title,'Tiêu đề',180),text(data.body||'','Nội dung',10000,false),data.url?source(data.url,true):'',new Date().toISOString());return {ok:true}}
}
export async function learningRequest(req:IncomingMessage,url:URL,user:ServerUser,service:LearningService,json:(req:IncomingMessage)=>Promise<any>){
 if(req.method==='GET'&&url.pathname==='/api/learning/state')return service.state(user);
 if(req.method==='POST'){
  const data=await json(req);
  if(url.pathname==='/api/learning/classes')return service.createClass(user,data);
  if(url.pathname==='/api/learning/classes/join')return service.join(user,data);
  if(url.pathname==='/api/learning/templates')return service.saveTemplate(user,data.experiment);
  if(url.pathname==='/api/learning/assignments')return service.assign(user,data);
  if(url.pathname==='/api/learning/submissions')return service.submit(user,data);
  if(url.pathname==='/api/learning/materials')return service.share(user,data);
  const review=url.pathname.match(/^\/api\/learning\/submissions\/([^/]+)\/review$/);if(review)return service.review(user,review[1],data);
 }
 throw new ApiError(405,'Thao tác lớp học không được hỗ trợ.');
}
