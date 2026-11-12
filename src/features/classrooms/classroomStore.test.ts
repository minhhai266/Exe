import { beforeAll,beforeEach,describe,expect,it,vi } from 'vitest';
let classroom:typeof import('./classroomStore');
let auth:typeof import('../auth/authStore');
let lab:typeof import('../lab/labStore');
function identity(id:string,role:'teacher'|'student') {auth.useAuth.setState({user:{id,name:id,email:id+'@example.com',role}})}
beforeAll(async()=>{
 const values=new Map<string,string>();
 const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)},removeItem:(key:string)=>{values.delete(key)}};
 vi.stubGlobal('localStorage',storage);vi.stubGlobal('sessionStorage',storage);
 auth=await import("../auth/authStore");lab=await import("../lab/labStore");classroom=await import("./classroomStore");
});
beforeEach(()=>{classroom.useClassrooms.setState({classes:[],assignments:[],materials:[],submissions:[]});lab.useStore.setState({templates:[],attempts:[],draftLabs:{}});classroom.useAccess.setState({entitlements:{}});identity('teacher','teacher')});

describe('classroom ownership and membership',()=>{
 it('normalizes join codes, prevents duplicate membership and isolates classes',()=>{
  const state=classroom.useClassrooms;const first=state.getState().createClass('9A');const second=state.getState().createClass('9B');
  const code=state.getState().classes.find(c=>c.id===first)!.code;
  identity('student','student');expect(state.getState().joinClass(' '+code.toLowerCase()+' ')).toBe(first);state.getState().joinClass(code);
  expect(state.getState().classes.find(c=>c.id===first)!.members).toHaveLength(1);expect(state.getState().classes.find(c=>c.id===second)!.members).toHaveLength(0);
  expect(()=>state.getState().createClass('Unauthorized')).toThrow();
 });
 it('only the owning teacher can assign or share and private templates stay private',()=>{
  const state=classroom.useClassrooms;const id=state.getState().createClass('9A');
  identity('other','teacher');expect(()=>state.getState().assign(id,'hydrogen','Bài 1','','')).toThrow();expect(()=>state.getState().share(id,'Tài liệu','Nội dung','')).toThrow();
  identity('teacher','teacher');state.getState().assign(id,'hydrogen','Bài 1','','');
  expect(()=>state.getState().share(id,'Tài liệu','','javascript:alert(1)')).toThrow();
  expect(()=>state.getState().assign(id,'oxygen','Trả phí','','')).toThrow(/trả phí/);
  expect(()=>state.getState().assign(id,'hydrogen','Hết hạn','',new Date(Date.now()-1000).toISOString())).toThrow(/tương lai/);
  expect(state.getState().assignments).toHaveLength(1);expect(state.getState().materials).toHaveLength(0);
 });
 it('submission requires the matching assignment and a student in that class; grading requires its teacher',()=>{
  const state=classroom.useClassrooms;const id=state.getState().createClass('9A');const code=state.getState().classes[0].code;state.getState().assign(id,'hydrogen','Bài 1','','');const assignment=state.getState().assignments[0];
  const attempt:import('../lab/labStore').Attempt={id:'attempt',experimentId:'hydrogen',title:'Test',date:new Date().toISOString(),success:false,score:0,contents:{},notes:'Quan sát',hints:0,seconds:10,logs:[],equation:false};
  identity('student','student');expect(()=>state.getState().submit(assignment.id,attempt)).toThrow();state.getState().joinClass(code);expect(()=>state.getState().submit(assignment.id,{...attempt,experimentId:'oxygen'})).toThrow();state.getState().submit(assignment.id,attempt);
  const submission=state.getState().submissions[0];expect(()=>state.getState().review(submission.id,'Self grading',10)).toThrow();
  identity('other','teacher');expect(()=>state.getState().review(submission.id,'Other teacher',10)).toThrow();
  identity('teacher','teacher');expect(()=>state.getState().review(submission.id,'',11)).toThrow();state.getState().review(submission.id,'Nhận xét',8);expect(state.getState().submissions[0].grade).toBe(8);
 });
 it('keeps drafts and attempts separated between accounts',()=>{
  const draft={vessels:[],logs:[],notes:'Teacher notes',hints:0,seconds:0,equation:false};lab.useStore.getState().saveLab('hydrogen',draft);
  identity('student','student');lab.useStore.getState().saveLab('hydrogen',{...draft,notes:'Student notes'});
  expect(lab.useStore.getState().draftLabs['teacher:hydrogen'].notes).toBe('Teacher notes');expect(lab.useStore.getState().draftLabs['student:hydrogen'].notes).toBe('Student notes');
 });
});
