import { ArrowRight,BookOpen,FileText,Search } from 'lucide-react';
import { Link,useLocation,useSearchParams } from 'react-router-dom';
import { useServerCatalog } from '../admin/catalogStore';
import { mergeEbooks } from './ebooks';
import { PageHeading } from '../../shared/components/PageHeading';
import './ebooks.css';
import './document-library.css';

const normalize=(s:string)=>s.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d').trim();
const categoryOf=(book:ReturnType<typeof mergeEbooks>[number])=>book.data.category||(book.data.builtin?'Bài học chuyên đề':'Ebook bổ sung');
const descriptions:Record<string,string>={
 'Sách giáo khoa':'Kiến thức nền tảng và nội dung theo chương trình học.',
 'Ôn tập giữa kỳ II':'Hệ thống kiến thức và luyện tập trước kỳ kiểm tra giữa kỳ II.',
 'Ôn tập cuối kỳ II':'Củng cố kiến thức và luyện tập cho kỳ kiểm tra cuối kỳ II.',
 'Bài học chuyên đề':'Đọc theo chủ đề, tìm hiểu hiện tượng và liên hệ thực hành.',
};
export function DocumentLibrary(){
 const published=useServerCatalog(s=>s.ebooks),loading=useServerCatalog(s=>s.loading);
 const all=mergeEbooks(published,true),location=useLocation();
 const [params,setParams]=useSearchParams();
 const query=params.get('q')||'',grade=params.get('grade')||'',category=params.get('category')||'',format=params.get('format')||'',sort=params.get('sort')||'grade';
 const change=(key:string,value:string)=>{const next=new URLSearchParams(window.location.search);if(value)next.set(key,value);else next.delete(key);setParams(next,{replace:true})};
 const categories=[...new Set(all.map(categoryOf))];
 const list=all.filter(book=>(!grade||Number(book.data.grade)===Number(grade))&&(!category||categoryOf(book)===category)&&(!format||(format==='pdf'?!!book.data.pdf:!book.data.pdf))&&normalize([book.name,book.data.subject,book.data.author,categoryOf(book)].join(' ')).includes(normalize(query))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'vi'):Number(a.data.grade)-Number(b.data.grade)||a.name.localeCompare(b.name,'vi'));
 const filtered=!!(query||grade||category||format||sort!=='grade');
 return <div className="container page document-library"><PageHeading label="THƯ VIỆN HỌC LIỆU" title="Sách và tài liệu cho từng bước học." description="Tìm sách giáo khoa, đề cương ôn tập và bài học chuyên đề từ lớp 8 đến lớp 12. Mở đọc ngay trên website, không bắt buộc tải về."/>
 <div className="document-summary"><span><BookOpen size={18}/><strong>{all.length}</strong> học liệu</span><span>Lớp 8–12</span><span>{categories.length} loại tài liệu</span><span><FileText size={17}/>{all.filter(b=>b.data.pdf).length} PDF đọc trực tiếp</span></div>
 <section className="document-filters" aria-label="Bộ lọc học liệu"><div className="search-field"><Search size={18}/><input aria-label="Tìm E-book" placeholder="Tìm tên sách, môn học hoặc loại tài liệu…" value={query} onChange={e=>change('q',e.target.value)}/></div><div className="document-filter-fields">
 <label>Khối lớp<select aria-label="Lọc khối lớp E-book" value={grade} onChange={e=>change('grade',e.target.value)}><option value="">Tất cả lớp</option>{[8,9,10,11,12].map(n=><option key={n} value={n}>Lớp {n}</option>)}</select></label>
 <label>Loại tài liệu<select aria-label="Loại tài liệu" value={category} onChange={e=>change('category',e.target.value)}><option value="">Tất cả loại</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
 <label>Định dạng<select aria-label="Định dạng tài liệu" value={format} onChange={e=>change('format',e.target.value)}><option value="">Tất cả định dạng</option><option value="pdf">PDF</option><option value="online">Bài đọc trực tuyến</option></select></label>
 <label>Sắp xếp<select aria-label="Sắp xếp học liệu" value={sort} onChange={e=>change('sort',e.target.value)}><option value="grade">Theo lớp</option><option value="name">Tên A–Z</option></select></label>
 </div></section>
 <div className="document-results"><p role="status"><strong>{list.length}</strong> học liệu{filtered?' phù hợp':''}{loading?' · Đang cập nhật thư viện…':''}</p>{filtered&&<button className="text-link" onClick={()=>setParams({})}>Xóa bộ lọc</button>}</div>
 {list.length?<div className="document-grid">{list.map(book=><Link className="ebook-card book-card document-card" key={book.id} to={'/ebooks/'+book.id} state={{from:location.pathname+location.search}}><span className="ebook-cover" aria-hidden="true">{book.data.cover?<img src={book.data.cover} alt="" loading="lazy"/>:<><BookOpen size={30}/><strong>{book.data.grade}</strong><small>{book.data.subject||'Hóa học'}</small></>}</span><div><small>{categoryOf(book)} · Lớp {book.data.grade}</small><h2>{book.name}</h2><p>{descriptions[categoryOf(book)]||'Tài liệu bổ sung kiến thức và hỗ trợ học tập.'}</p><div className="document-card-footer"><span>{book.data.pdf?'PDF':`${book.data.chapters?.length||0} chương · Bài đọc`}</span><span className="text-link">Đọc ngay <ArrowRight size={15}/></span></div></div></Link>)}</div>:<div className="empty"><Search size={28}/><h2>Chưa tìm thấy tài liệu phù hợp</h2><p>Thử từ khóa khác hoặc xóa bộ lọc.</p><button className="btn white" onClick={()=>setParams({})}>Xóa bộ lọc</button></div>}
 </div>;
}
