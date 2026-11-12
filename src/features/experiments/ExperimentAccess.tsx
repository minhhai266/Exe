import { useServerCatalog } from '../admin/catalogStore';
import {useEffect,useState,type ReactNode} from 'react';
import {refreshClassrooms} from '../classrooms/serverClassrooms';
import { Link,Navigate,useLocation,useParams } from 'react-router-dom';
import { useAuth } from "../auth/authStore";
import { hasPremium,inClass,useAccess,useClassrooms } from "../classrooms/classroomStore";
import { useStore } from "../lab/labStore";
import { experiments } from "./data";

export function ExperimentAccess({children}:{children:ReactNode}){
 const published=useServerCatalog(s=>s.experiments);const user=useAuth(s=>s.user);const {id}=useParams();const location=useLocation();const state=useClassrooms();useAccess(s=>s.entitlements);const templates=useStore(s=>s.templates);const snapshotId=new URLSearchParams(location.search).get("assignment");const e=state.assignments.find(a=>a.id===snapshotId)?.config?.experiment||[...experiments,...published,...templates].find(e=>e.id===id);
 const [loading,setLoading]=useState(!!snapshotId&&!!user?.server),[error,setError]=useState('');
 useEffect(()=>{if(!snapshotId||!user?.server)return;let disposed=false;setLoading(true);setError('');refreshClassrooms().catch(e=>{if(!disposed)setError((e as Error).message)}).finally(()=>{if(!disposed)setLoading(false)});return()=>{disposed=true}},[snapshotId,user?.id]);
 if(loading)return <div className="container page" role="status">Đang tải bài được giao…</div>;
 if(error)return <div className="container page" role="alert">{error}</div>;
 if(!user)return <Navigate to="/login" state={{from:location.pathname+location.search}} replace/>;
 const assignmentId=new URLSearchParams(location.search).get('assignment');const assignment=state.assignments.find(a=>a.id===assignmentId);const classroom=state.classes.find(c=>c.id===assignment?.classId);const assigned=state.assignments.some(a=>a.experimentId===id&&state.classes.some(c=>c.id===a.classId&&inClass(c,user.id)));
 if(assignmentId&&(!assignment||assignment.experimentId!==id||!classroom||user.role!=='student'||!classroom.members.some(m=>m.id===user.id)))return <div className="panel access-gate"><h1>Không thể mở bài được giao</h1><p>Bạn cần tham gia đúng lớp và mở bài từ danh sách bài được giao.</p><Link className="btn primary" to={'/'+user.role+'/classes'}>Về lớp học</Link></div>;
 if(e?.ownerId&&e.ownerId!==user.id&&(!assigned||e.status!=='published'))return <div className="panel access-gate"><h1>Bài thực hành riêng của lớp</h1><Link className="btn primary" to={'/'+user.role+'/classes'}>Về lớp học</Link></div>;
 const paidAllowed=hasPremium(user.id)||assigned&&state.assignments.some(a=>a.experimentId===id&&state.classes.some(c=>c.id===a.classId&&inClass(c,user.id)&&hasPremium(c.teacherId)));
 if(e?.access==='premium'&&!e.ownerId&&!paidAllowed)return <div className="panel access-gate"><span className="access-badge premium">Thí nghiệm trả phí</span><h1>Nội dung dành cho gói trả phí</h1><p>Chọn thí nghiệm miễn phí để bắt đầu hoặc xem các gói sử dụng. Đăng ký tư vấn chưa kích hoạt quyền truy cập.</p><Link className="btn primary" to="/pricing">Xem gói sử dụng</Link><Link className="text-link" to="/experiments">Khám phá miễn phí</Link></div>;
 return children;
}
