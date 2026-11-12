import {Link,useParams} from 'react-router-dom';
import {useAdminData} from '../admin/api';
import {AdminError,AdminLoading} from '../admin/AdminShared';
import {lazy,Suspense} from 'react';
import type {Experiment} from '../experiments/data';
import type {AssignmentConfig} from '../../engine/assignmentLab';
const Lab=lazy(()=>import('../lab/LabPage'));
export function StudioLabPreview(){
 const {draftId}=useParams();
 const state=useAdminData<{experiment:Experiment;config:AssignmentConfig;definitionVersion:number;returnTo:string}>('/api/reaction-studio/drafts/'+draftId+'/preview');
 if(state.loading)return <AdminLoading/>;
 if(state.error)return <div className="container page"><AdminError error={state.error} retry={state.reload}/><Link to={'/teacher/reaction-studio?draft='+draftId}>Về bản nháp</Link></div>;
 return <Suspense fallback={<AdminLoading/>}><Lab key={draftId+':'+state.data!.definitionVersion} preview={{experiment:state.data!.experiment,config:state.data!.config,returnTo:state.data!.returnTo+'?draft='+draftId,version:state.data!.definitionVersion,draftId:draftId!}}/></Suspense>;
}
