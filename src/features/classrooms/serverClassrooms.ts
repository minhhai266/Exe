import {adminApi,AdminApiError,writeApi} from '../admin/api';
import {useAuth} from '../auth/authStore';
import {useClassrooms,type Classroom,type Assignment,type Submission,type Material} from './classroomStore';
import {useStore,type Attempt} from '../lab/labStore';
import type {Experiment} from '../experiments/data';
import type {AssignmentConfig} from '../../engine/assignmentLab';
export async function refreshClassrooms(){
 const user=useAuth.getState().user;if(!user)return;
 try{
  const remote=await adminApi<{userId:string;classes:Classroom[];assignments:Assignment[];submissions:Submission[];materials:Material[];templates:Experiment[]}>('/api/learning/state');
  if(useAuth.getState().user?.id!==user.id||remote.userId!==user.id)return;
  const active={...user,server:true};useAuth.setState({user:active});sessionStorage.setItem('virtual-lab-session',JSON.stringify(active));
  const merge=<T extends {id:string}>(local:T[],incoming:T[])=>[...incoming,...local.filter(item=>!incoming.some(r=>r.id===item.id))];
  useClassrooms.setState(state=>({classes:merge(state.classes,remote.classes),assignments:merge(state.assignments,remote.assignments),submissions:merge(state.submissions,remote.submissions),materials:merge(state.materials,remote.materials)}));
  useStore.setState(state=>({templates:merge(state.templates,remote.templates),attempts:merge(state.attempts,remote.submissions.map(s=>s.attempt))}));
 }catch(error){if(!(error instanceof AdminApiError&&[401,403].includes(error.status)))throw error}
}
const remote=()=>!!useAuth.getState().user?.server;
export async function createClass(name:string){
 if(!remote())return useClassrooms.getState().createClass(name);
 const result=await writeApi('/api/learning/classes','POST',{name});await refreshClassrooms();return result.id as string;
}
export async function joinClass(code:string){
 if(!remote())return useClassrooms.getState().joinClass(code);
 const result=await writeApi('/api/learning/classes/join','POST',{code});await refreshClassrooms();return result.id as string;
}
export async function saveServerTemplate(experiment:Experiment){
 const saved=remote()?await writeApi<Experiment>('/api/learning/templates','POST',{experiment}):experiment;
 useStore.getState().saveTemplate(saved);
}
export async function assign(classId:string,experimentId:string,title:string,instructions:string,dueAt:string,config:AssignmentConfig){
 if(!remote())return useClassrooms.getState().assign(classId,experimentId,title,instructions,dueAt,config);
 const local=useClassrooms.getState().classes.find(c=>c.id===classId);
 if(local)await writeApi('/api/learning/classes','POST',{id:local.id,name:local.name,code:local.code});
 await writeApi('/api/learning/assignments','POST',{classId,experimentId,title,instructions,dueAt,config});await refreshClassrooms();
}
export async function submitAssignment(assignmentId:string,attempt:Attempt){
 if(!remote())return useClassrooms.getState().submit(assignmentId,attempt);
 await writeApi('/api/learning/submissions','POST',{assignmentId,attempt});await refreshClassrooms();
}
export async function reviewSubmission(id:string,feedback:string,grade:number,criterionGrades?:Record<string,number>){
 if(!remote())return useClassrooms.getState().review(id,feedback,grade,criterionGrades);
 await writeApi('/api/learning/submissions/'+id+'/review','POST',{feedback,grade,criterionGrades});await refreshClassrooms();
}
export async function shareMaterial(classId:string,title:string,body:string,url:string){
 if(!remote())return useClassrooms.getState().share(classId,title,body,url);
 await writeApi('/api/learning/materials','POST',{classId,title,body,url});await refreshClassrooms();
}
