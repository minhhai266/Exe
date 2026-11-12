import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {writeApi} from '../admin/api';
import {useAuth} from '../auth/authStore';
import {useClassrooms} from '../classrooms/classroomStore';
import {refreshClassrooms} from '../classrooms/serverClassrooms';
export function StudioAssignment({id,version,title,allowed}:{id:string;version:number;title:string;allowed:boolean}){
 const user=useAuth(s=>s.user),classes=useClassrooms(s=>s.classes).filter(c=>c.teacherId===user?.id),navigate=useNavigate();
 const [classId,setClassId]=useState(''),[dueAt,setDueAt]=useState(''),[instructions,setInstructions]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(user?.role!=='teacher')return null;
 return <section className="admin-panel studio-assignment"><h2>Giao bài cho lớp</h2><p>Bài giao lưu cố định phản ứng, kho hóa chất, câu hỏi đã duyệt và rubric của phiên bản hiện tại.</p><label>Chọn lớp<select aria-label="Chọn lớp" value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Chọn lớp của bạn</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Yêu cầu khi thực hành<textarea value={instructions} onChange={e=>setInstructions(e.target.value)}/></label><label>Hạn nộp (không bắt buộc)<input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></label>{error&&<p role="alert" className="admin-field-error">{error}</p>}<button type="button" className="admin-button primary" disabled={!allowed||!classId||busy} onClick={async()=>{setBusy(true);setError('');try{await writeApi('/api/learning/assignments','POST',{draftId:id,version,classId,title,instructions,dueAt});await refreshClassrooms();navigate('/teacher/classes/'+classId)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>{busy?'Đang giao bài…':'Giao phiên bản này cho lớp'}</button>{!allowed&&<p className="admin-form-hint">Lưu thay đổi và xác nhận kiểm chứng trước khi giao bài mô phỏng.</p>}<Link className="admin-text-link" to="/teacher/classes">Quản lý hoặc tạo lớp học</Link></section>;
}
