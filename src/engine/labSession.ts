import type { Vessel } from './equipment';

export type LabEventType='SESSION_STARTED'|'APPARATUS_ADDED'|'APPARATUS_REMOVED'|'APPARATUS_MOVED'|'TUBE_CONNECTED'|'TUBE_DISCONNECTED'|'STOPPER_ATTACHED'|'APPARATUS_ATTACHED'|'APPARATUS_DETACHED'|'HEATING_STARTED'|'HEATING_STOPPED'|'CHEMICAL_ADDED'|'CHEMICAL_TRANSFERRED'|'REACTION_STARTED'|'REACTION_COMPLETED'|'CHEMICAL_INFO_VIEWED'|'APPARATUS_INFO_VIEWED'|'HINT_OPENED'|'EXPLANATION_VIEWED'|'ANSWER_SAVED'|'ASSIGNMENT_SUBMITTED'|'ATTEMPT_RESET'|'TIME_LIMIT_REACHED'|'UNDO'|'REDO';
export interface LabEvent{id:string;sessionId:string;type:LabEventType;time:string;schemaVersion:1;objectIds:string[];data:Record<string,unknown>;result:'applied'|'viewed'}
export interface LabSession{id:string;startedAt:string;assignmentId?:string;studentId?:string;attemptNumber:number;events:LabEvent[]}
export function createSession(assignmentId?:string,studentId?:string):LabSession{const session:LabSession={id:crypto.randomUUID(),startedAt:new Date().toISOString(),assignmentId,studentId,attemptNumber:1,events:[]};return recordEvent(session,'SESSION_STARTED',{assignmentId,studentId})}
export function recordEvent(session:LabSession,type:LabEventType,data:Record<string,unknown>={},objectIds:string[]=[],key:string=crypto.randomUUID()):LabSession{
 if(session.events.some(e=>e.id===key))return session;
 return {...session,events:[...session.events,{id:key,sessionId:session.id,type,time:new Date().toISOString(),schemaVersion:1,objectIds,data,result:type.endsWith('VIEWED')||type==='HINT_OPENED'?'viewed':'applied'}]};
}
/** Compare committed model changes; never record pointer movement or simulation ticks. */
export function modelEvents(session:LabSession,before:Vessel[],after:Vessel[]){
 let next=session;const emit=(type:LabEventType,v:Vessel,data:Record<string,unknown>={})=>{next=recordEvent(next,type,data,[v.id])};
 for(const v of after){const old=before.find(o=>o.id===v.id);if(!old){emit('APPARATUS_ADDED',v,{type:v.type});continue}
  if(v.mountedOn!==old.mountedOn)emit(v.mountedOn?v.type==='stopper'?'STOPPER_ATTACHED':'APPARATUS_ATTACHED':'APPARATUS_DETACHED',v,{parentId:v.mountedOn});
  if(!!v.burning!==!!old.burning)emit(v.burning?'HEATING_STARTED':'HEATING_STOPPED',v,{temperature:v.temperature});
  if(v.reaction?.status==='running'&&(old.reaction?.status!=='running'||v.reaction.startedAt!==old.reaction.startedAt))emit('REACTION_STARTED',v,{ruleId:v.reaction.ruleId,temperature:v.temperature,contents:v.contents});
  if(v.reaction?.status==='complete'&&old.reaction?.status!=='complete')emit('REACTION_COMPLETED',v,{ruleId:v.reaction.ruleId,extent:v.reaction.extent,produced:v.produced,collected:v.collected,escaped:v.escaped});
  for(const target of v.connections.filter(id=>!old.connections.includes(id)))emit('TUBE_CONNECTED',v,{target});
  for(const target of old.connections.filter(id=>!v.connections.includes(id)))emit('TUBE_DISCONNECTED',v,{target});
 }
 for(const v of before.filter(v=>!after.some(a=>a.id===v.id)))emit('APPARATUS_REMOVED',v,{type:v.type});
 return next;
}
export function expireLabSession(session:LabSession,items:Vessel[],minutes:number){
 const key=session.id+':time-limit';
 if(session.events.some(e=>e.id===key))return {session,items};
 const stopped=items.map(v=>({...v,burning:false,reaction:v.reaction?.status==='running'?{...v.reaction,status:'paused' as const}:v.reaction}));
 return {items:stopped,session:recordEvent(modelEvents(session,items,stopped),'TIME_LIMIT_REACHED',{minutes},[],key)};
}
