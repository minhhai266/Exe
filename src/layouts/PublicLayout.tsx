import { ArrowRight,Menu,X } from 'lucide-react';
import { useEffect,useState } from 'react';
import { Link,Outlet,useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/authStore';
import { Logo } from '../shared/components/Logo';
import './layouts.css';
export function PublicLayout(){
 const sectionLinks: {id:string;label:string;to?:string}[]=[{id:'home',label:'Trang chủ'},{id:'experiments',label:'Thư viện thí nghiệm'},{id:'materials',label:'Học liệu'},{id:'ebooks',label:'Ebook',to:'/ebooks'},{id:'pricing',label:'Gói sử dụng'}];
 const user=useAuth(s=>s.user),location=useLocation();const [open,setOpen]=useState(false);
 const navigation=sectionLinks.map(item=>{
  const active=item.to?location.pathname===item.to:location.pathname==='/'&&(location.hash||'#home')==='#'+item.id;
  return <Link key={item.id} to={item.to||'/#'+item.id} className={active?'active':undefined} aria-current={active?'location':undefined} onClick={()=>{
   setOpen(false);
   if(location.pathname==='/'&&location.hash==='#'+item.id)document.getElementById(item.id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }}>{item.label}</Link>;
 });
 useEffect(()=>setOpen(false),[location.pathname,location.hash]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
 return <><a className="skip-link" href="#main-content">Đến nội dung chính</a><header className="header"><div className="nav-wrap"><Logo/><nav className="public-links" aria-label="Điều hướng chính">{navigation}</nav><div className="nav-actions">{user?<Link className="btn primary" to={`/${user.role}/dashboard`}>Không gian của tôi <ArrowRight size={16}/></Link>:<><Link className="btn white" to="/login">Đăng nhập</Link><Link className="btn primary" to="/register">Đăng ký</Link></>}</div><button className="public-menu-toggle" aria-label={open?'Đóng menu':'Mở menu'} aria-expanded={open} aria-controls="public-mobile-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div><nav id="public-mobile-menu" className="public-mobile-menu" hidden={!open} aria-label="Điều hướng điện thoại">{navigation}{user?<Link to={`/${user.role}/dashboard`}>Không gian của tôi</Link>:<><Link to="/login">Đăng nhập</Link><Link to="/register">Đăng ký tài khoản</Link></>}</nav></header><main id="main-content" tabIndex={-1}><Outlet/></main><footer><div className="container footer-grid"><div><Logo/><p>Một không gian nhỏ. Vô vàn khám phá lớn.<br/>Thực hành hóa học an toàn trong trình duyệt.</p></div><div><h3>Khám phá</h3><Link to="/practice">Thư viện thí nghiệm</Link><Link to="/ebooks">Học liệu theo lớp</Link><Link to="/pricing">Gói sử dụng</Link></div><div><h3>Không gian học tập</h3><Link to="/student/dashboard">Dành cho học sinh</Link><Link to="/teacher/dashboard">Dành cho giáo viên</Link><Link to="/practice/hydrogen">Trải nghiệm phòng lab</Link></div></div><div className="container footer-bottom"><span>© 2026 Virtual Lab 2D</span><span>Học từ trải nghiệm. Nhớ bằng sự tò mò.</span></div></footer></>;
}


