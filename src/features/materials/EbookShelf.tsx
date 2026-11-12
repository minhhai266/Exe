import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, FileText } from 'lucide-react';
import { useServerCatalog } from '../admin/catalogStore';
import { mergeEbooks } from './ebooks';
import './ebooks.css';

export function EbookShelf({ grade, home = false, section }: { grade?: number; home?: boolean; section?: 'sgk' | 'review' }) {
 const published = useServerCatalog(state => state.ebooks);
 const [selected, setSelected] = useState(8);
 const activeGrade = grade ?? selected;
 const books = mergeEbooks(published).filter(book => Number(book.data.grade) === activeGrade && (!section || (section === 'sgk' ? book.data.category === 'Sách giáo khoa' : book.data.category !== 'Sách giáo khoa')));
 const categories = [...new Set(books.map(book => book.data.category || 'Ebook bổ sung'))];
 return <section className={'ebook-shelf' + (home ? ' container section' : '')} aria-label="Ebook theo lớp">
  <div className="ebook-section-heading"><div><span className="eyebrow">TỦ SÁCH ĐIỆN TỬ</span><h2>{home ? 'Mở sách, khám phá kiến thức.' : `${section === 'sgk' ? 'Sách giáo khoa' : section === 'review' ? 'Tài liệu ôn tập' : 'Ebook & tài liệu'} lớp ${activeGrade}`}</h2><p>Đọc trực tiếp trên website, không bắt buộc tải về.</p></div>{home && <Link className="text-link" to="/ebooks">Tất cả học liệu <ArrowRight size={16}/></Link>}</div>
  {grade === undefined && <div className="ebook-grade-tabs" role="group" aria-label="Chọn lớp đọc ebook">{[8,9,10,11,12].map(n => <button key={n} className={'btn ' + (selected === n ? 'primary' : 'white')} aria-pressed={selected === n} onClick={() => setSelected(n)}>Lớp {n}</button>)}</div>}
  {categories.map(category => <div className="ebook-category" key={category}><h3>{category}</h3><div className="ebook-grid">{books.filter(book => (book.data.category || 'Ebook bổ sung') === category).map(book => <Link className="ebook-card" key={book.id} to={'/ebooks/' + book.id}><span className="ebook-cover" aria-hidden="true"><BookOpen size={30}/><strong>{activeGrade}</strong><small>{book.data.subject}</small></span><div><small><FileText size={13}/>{book.data.pdf ? 'PDF' : 'Ebook'} · Lớp {activeGrade}</small><h4>{book.name}</h4><span className="text-link">Đọc ngay <ArrowRight size={15}/></span></div></Link>)}</div></div>)}
  {!books.length && <p className="empty">{section === 'review' ? 'Chưa có tài liệu ôn tập cho lớp này.' : 'Chưa có ebook cho lớp này.'}</p>}
 </section>;
}
