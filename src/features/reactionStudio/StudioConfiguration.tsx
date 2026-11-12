import {AssignmentConfigEditor} from '../classrooms/AssignmentConfigEditor';
import {defaultReactionSimulation} from '../../engine/reactionConfiguration';
import type {ReactionDefinition,ReactionSimulation} from '../../engine/reactionDefinition';
import type {Experiment} from '../experiments/data';
import {PhenomenonBadges} from '../../shared/components/PhenomenonBadges';
export function StudioConfiguration({form,onChange,validation}:{form:ReactionDefinition;onChange:(s:ReactionSimulation)=>void;validation:{effects?:string[];phenomena?:string[];support:string}}){
 const simulation=form.simulation||defaultReactionSimulation(form);
 const experiment:Experiment={id:'studio-configuration',title:form.name,subtitle:form.observation,grade:form.learning.grade,topic:'Phản ứng tự soạn',minutes:simulation.minutes,difficulty:simulation.difficulty,reagents:simulation.stock.map(s=>s.id),equipment:simulation.equipment,product:'Cu(OH)2',goals:['product','observe','equation'],objectives:form.learning.objectives,instructions:form.learning.instructions,hints:simulation.hints,amount:10};
 return <section className="admin-panel studio-configuration"><h2>Cấu hình bàn thực hành</h2><p>Kho, thời gian và rubric này được dùng cho cả lần chạy thử và bài giao học sinh.</p>
 <label>Độ khó<select value={simulation.difficulty} onChange={e=>onChange({...simulation,difficulty:e.target.value})}>{['Cơ bản','Trung bình','Nâng cao'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Gợi ý cho học sinh (mỗi dòng một gợi ý)<textarea value={simulation.hints.join('\n')} onChange={e=>onChange({...simulation,hints:e.target.value.split('\n')})}/></label>
 <AssignmentConfigEditor hideLesson hideQuestions experiment={experiment} value={{...simulation,version:1,experiment,questions:[]}} onChange={c=>onChange({...simulation,stock:c.stock,equipment:c.equipment,minutes:c.minutes,hintsAllowed:c.hintsAllowed,explanation:c.explanation,rubric:c.rubric})}/>
 <h3>Hiệu ứng được engine xác định</h3><PhenomenonBadges codes={validation.phenomena as any}/><p className="admin-form-hint">{validation.effects?.join(' · ')||'Chưa có hiệu ứng đủ điều kiện.'}</p><p className="admin-form-hint">Hiệu ứng phụ thuộc vào lượng chất, sự tiếp xúc, nhiệt độ và kết nối thực tế trên bàn. Không thể thêm hiệu ứng ngoài mô hình.</p>
 </section>;
}
