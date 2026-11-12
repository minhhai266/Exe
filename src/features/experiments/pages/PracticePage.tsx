import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ExperimentCard } from '../components/ExperimentCard';
import { practiceExperiments } from '../practiceCatalog';
import { PageHeading } from '../../../shared/components/PageHeading';
import './practice.css';

const normalize=(s:string)=>s.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d').trim();
export function PracticePage(){
 const [params,setParams]=useSearchParams();
 const query=params.get('q')||'',grade=params.get('grade')||'',topic=params.get('topic')||'',difficulty=params.get('difficulty')||'',duration=params.get('duration')||'';
 const change=(key:string,value:string)=>{const next=new URLSearchParams(window.location.search);if(value)next.set(key,value);else next.delete(key);setParams(next,{replace:true})};
 const list=practiceExperiments.filter(e=>normalize(e.title+' '+e.subtitle+' '+e.topic+' '+e.reagents.join(' ')).includes(normalize(query))&&(!grade||e.grade===Number(grade))&&(!topic||e.topic===topic)&&(!difficulty||e.difficulty===difficulty)&&(!duration||(duration==='short'?e.minutes<=10:e.minutes>10)));
 const filtered=!!(query||grade||topic||difficulty||duration);
 return <div className="container page experiment-library-page practice-library"><PageHeading label="THÍ NGHIỆM TỰ DO" title="Chọn một thí nghiệm, khám phá theo cách của bạn." description="14 bài thực hành từ nhận biết axit – bazơ đến phản ứng hữu cơ. Chọn thí nghiệm, thử điều kiện và quan sát hiện tượng. Không cần đăng nhập hay nộp bài."/>
 <div className="practice-layout"><section className="practice-filters" aria-label="Bộ lọc thí nghiệm"><div className="search-field"><Search size={19}/><input aria-label="Tìm thí nghiệm" placeholder="Tìm tên, chủ đề hoặc hóa chất…" value={query} onChange={e=>change('q',e.target.value)}/></div><div className="practice-filter-heading"><strong>Lọc thí nghiệm</strong>{filtered&&<button className="text-link" onClick={()=>setParams({})}>Xóa bộ lọc</button>}</div><div className="practice-filter-fields">
 <label>Khối lớp<select aria-label="Khối lớp" value={grade} onChange={e=>change('grade',e.target.value)}><option value="">Tất cả lớp</option>{[...new Set(practiceExperiments.map(e=>e.grade))].sort((a,b)=>a-b).map(n=><option key={n} value={n}>Lớp {n}</option>)}</select></label>
 <label>Chủ đề<select aria-label="Chủ đề" value={topic} onChange={e=>change('topic',e.target.value)}><option value="">Tất cả chủ đề</option>{[...new Set(practiceExperiments.map(e=>e.topic))].map(t=><option key={t}>{t}</option>)}</select></label>
 <label>Độ khó<select aria-label="Độ khó" value={difficulty} onChange={e=>change('difficulty',e.target.value)}><option value="">Tất cả độ khó</option>{[...new Set(practiceExperiments.map(e=>e.difficulty))].map(d=><option key={d}>{d}</option>)}</select></label>
 <label>Thời lượng<select aria-label="Thời lượng" value={duration} onChange={e=>change('duration',e.target.value)}><option value="">Tất cả thời lượng</option><option value="short">Tối đa 10 phút</option><option value="long">Trên 10 phút</option></select></label>
 </div></section><div className="practice-results"><div className="list-caption" role="status"><strong>{list.length}/{practiceExperiments.length} thí nghiệm</strong><span>Miễn phí · Thực hành trực tiếp</span></div>
 {list.length?<div className="experiment-grid">{list.map((e,index)=><ExperimentCard key={e.id} e={e} index={index} practice/>)}</div>:<div className="empty"><Search size={28}/><h2>Chưa tìm thấy thí nghiệm phù hợp</h2><p>Thử từ khóa khác hoặc xóa bộ lọc.</p><button className="btn white" onClick={()=>setParams({})}>Xóa bộ lọc</button></div>}</div></div></div>;
}
