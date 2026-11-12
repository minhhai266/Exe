import type { AssignmentConfig,gradeRubric } from '../../engine/assignmentLab';
import type { LabSession } from '../../engine/labSession';
import type { ChemicalId } from '../../engine/chemicals';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contents } from "../../engine/chemicals";
import type { Vessel } from "../../engine/equipment";
import type { Log } from "../../engine/experimentLogger";
import { useAuth } from "../auth/authStore";
import type { Experiment } from "../experiments/data";
export interface Attempt {vesselSnapshot?:Vessel[];session?:LabSession;assignmentConfig?:AssignmentConfig;stockUsed?:Partial<Record<ChemicalId,number>>;answers?:Record<string,string>;assessment?:ReturnType<typeof gradeRubric>;userId?:string;assignmentId?:string;customReaction?:import('../../engine/reactionRules').ReactionRule;id:string;experimentId:string;title:string;date:string;success:boolean;score:number;contents:Contents;notes:string;hints:number;seconds:number;logs:Log[];equation:boolean;collected?:Contents;escaped?:Contents;produced?:Contents}
interface State {role:'student'|'teacher'; templates:Experiment[];attempts:Attempt[];draftLabs:Record<string,{vessels:Vessel[];logs:Log[];notes:string;hints:number;seconds:number;equation:boolean;session?:LabSession;stockUsed?:Partial<Record<ChemicalId,number>>;answers?:Record<string,string>}>;setRole:(role:State['role'])=>void;saveTemplate:(e:Experiment)=>void;saveAttempt:(a:Attempt)=>void;saveLab:(id:string,lab:State['draftLabs'][string])=>void}
export const useStore=create<State>()(persist((set)=>({role:'student',templates:[],attempts:[],draftLabs:{},setRole:role=>set({role}),saveTemplate:e=>{const user=useAuth.getState().user;if(!user||user.role!=='teacher')throw new Error('Teacher account required');set(s=>{const old=s.templates.find(t=>t.id===e.id);if(old?.ownerId&&old.ownerId!==user.id)throw new Error('Template access denied');return {templates:[...s.templates.filter(t=>t.id!==e.id),{...e,ownerId:user.id,access:'free'}]}})},saveAttempt:a=>set(s=>({attempts:[{...a,userId:useAuth.getState().user?.id},...s.attempts]})),saveLab:(id,lab)=>set(s=>({draftLabs:{...s.draftLabs,[(useAuth.getState().user?.id||'guest')+':'+id]:lab}}))}),{name:'virtual-lab-v1'}));
