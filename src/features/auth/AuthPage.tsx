import {ArrowRight,BookOpen,FlaskConical,GraduationCap} from 'lucide-react';
import {useState,type FormEvent} from 'react';
import {Link,Navigate,useLocation,useNavigate} from 'react-router-dom';
import {useStore} from '../lab/labStore';
import {useAuth,type Role,type User} from './authStore';
import {GoogleSignIn} from './GoogleSignIn';

export function AuthPage({register=false}:{register?:boolean}){
 const {user,signIn,signInGoogle,register:createAccount}=useAuth();
 const location=useLocation(),navigate=useNavigate();
 const [role,setRole]=useState<Role>('student'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 if(user)return <Navigate to={`/${user.role}/dashboard`} replace/>;
 function complete(account:User){
  useStore.getState().setRole(account.role);
  const from=location.state?.from;
  const target=typeof from==='string'&&(from.startsWith(`/${account.role}/`)||from.startsWith('/lab/'))?from:`/${account.role}/dashboard`;
  navigate(target,{replace:true});
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setError('');
  const data=new FormData(event.currentTarget);
  if(register&&data.get('password')!==data.get('confirm')){setError('Mật khẩu xác nhận chưa khớp.');return}
  setBusy(true);
  try{complete(register?await createAccount(String(data.get('name')),String(data.get('email')),String(data.get('password')),role):await signIn(String(data.get('email')),String(data.get('password'))))}
  catch(e){setError(e instanceof Error?e.message:'Không thể lưu tài khoản. Vui lòng kiểm tra quyền lưu dữ liệu trình duyệt.')}
  finally{setBusy(false)}
 }
 return <div className="auth-page">
  <section className="auth-intro">
   <span className="feature-icon"><FlaskConical size={30}/></span><div className="eyebrow">VIRTUAL LAB 2D</div>
   <h1 className="auth-headline"><span className="auth-title-lead">Mỗi lần thử.</span><span className="auth-title-accent">Một khám phá mới.</span></h1>
   <p>Không gian riêng để học sinh thực hành và giáo viên đồng hành trên hành trình khám phá khoa học.</p>
   <div className="auth-note">Đăng nhập bằng Google hoặc email để lưu tài khoản và sử dụng các công cụ theo vai trò. Tài khoản nhà trường dùng mật khẩu đã thiết lập qua lời mời.</div>
  </section>
  <section className="auth-card" key={register?'register':'login'}>
   <h2>{register?'Tạo tài khoản':'Chào mừng trở lại'}</h2>
   <p>{register?'Bắt đầu hành trình khám phá của bạn.':'Đăng nhập để vào không gian của bạn.'}</p>
   {register&&<div className="auth-roles">{(['student','teacher'] as const).map(r=><button type="button" disabled={busy} aria-pressed={role===r} className={role===r?'selected':''} key={r} onClick={()=>setRole(r)}>{r==='student'?<BookOpen size={20}/>:<GraduationCap size={20}/>} {r==='student'?'Học sinh':'Giáo viên'}</button>)}</div>}
   <GoogleSignIn role={register?role:'student'} disabled={busy} onBusyChange={setBusy} onCredential={async credential=>{setError('');complete(await signInGoogle(credential))}}/>
   <div className="auth-divider">hoặc dùng email</div>
   <form onSubmit={submit}>
    {register&&<label>Họ và tên<input name="name" autoComplete="name" required maxLength={100} placeholder="Nguyễn Minh Anh"/></label>}
    <label>Email<input name="email" type="email" autoComplete="email" required placeholder="ban@example.com"/></label>
    <label>Mật khẩu<input name="password" type="password" minLength={register?8:1} autoComplete={register?'new-password':'current-password'} required placeholder={register?'Ít nhất 8 ký tự':'Nhập mật khẩu'}/></label>
    {register&&<label>Xác nhận mật khẩu<input name="confirm" type="password" autoComplete="new-password" required placeholder="Nhập lại mật khẩu"/></label>}
    {error&&<p className="auth-error" role="alert">{error}</p>}
    <button className="btn primary" disabled={busy}>{busy?'Đang xử lý…':register?'Đăng ký':'Đăng nhập'} <ArrowRight size={17}/></button>
   </form>
   <p className="auth-switch">{register?'Đã có tài khoản?':'Chưa có tài khoản?'} <Link to={register?'/login':'/register'} onClick={()=>setError('')}>{register?'Đăng nhập':'Đăng ký ngay'}</Link></p>
   <p className="auth-switch"><Link to="/admin/login">Tài khoản nhà trường / Quản trị hệ thống</Link></p>
  </section>
 </div>;
}
