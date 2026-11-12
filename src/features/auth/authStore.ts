import { create } from 'zustand';

export type Role = 'teacher' | 'student';
export type User = {id:string; name:string; email:string; role:Role;server?:boolean};
type Account = User & {salt:string; digest:string};
const key = 'virtual-lab-accounts';
async function hash(password:string,salt:string){
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},material,256);
 return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');
}
function accounts():Account[]{return JSON.parse(localStorage.getItem(key)||'[]');}
function session():User|null{try{return JSON.parse(sessionStorage.getItem('virtual-lab-session')||'null')}catch{return null}}
function saveServerSession(data:any):User{
 if(!['TEACHER','STUDENT'].includes(data.user?.role))throw new Error('Vai trò tài khoản không hợp lệ.');
 const user:User={id:data.user.id,name:data.user.name,email:data.user.email,role:data.user.role==='TEACHER'?'teacher':'student',server:true};
 sessionStorage.setItem('virtual-lab-session',JSON.stringify(user));return user;
}
async function registerServer(name:string,email:string,password:string,role:Role,id?:string){
 const response=await fetch('/api/admin/auth/register',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:JSON.stringify({name,email,password,role,...(id?{id}:{})})});
 const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Không thể tạo tài khoản. Vui lòng thử lại.');
 return saveServerSession(data);
}
export const useAuth=create<{user:User|null; signOut:()=>void; signIn:(email:string,password:string)=>Promise<User>; signInGoogle:(credential:string)=>Promise<User>; register:(name:string,email:string,password:string,role:Role)=>Promise<User>}>((set)=>({
 user:session(),
 signInGoogle:async(credential)=>{
  const response=await fetch('/api/admin/auth/google',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:JSON.stringify({credential})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||'Không thể đăng nhập bằng Google.');
  if(!['STUDENT','TEACHER'].includes(data.user?.role))throw new Error('Vai trò tài khoản không hợp lệ.');
  const user:User={id:data.user.id,name:data.user.name,email:data.user.email,role:data.user.role==='TEACHER'?'teacher':'student',server:true};
  sessionStorage.setItem('virtual-lab-session',JSON.stringify(user));set({user});return user;
 },
 signOut:async()=>{try{await fetch('/api/admin/auth/logout',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:'{}'})}catch{}sessionStorage.removeItem('virtual-lab-session');set({user:null});},
 signIn:async(email,password)=>{
  try{const response=await fetch('/api/admin/auth/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:JSON.stringify({email,password})});if(response.ok){const data=await response.json();if(['TEACHER','STUDENT'].includes(data.user.role)){const user:User={id:data.user.id,name:data.user.name,email:data.user.email,role:data.user.role==='TEACHER'?'teacher':'student',server:true};sessionStorage.setItem('virtual-lab-session',JSON.stringify(user));set({user});return user;}throw new Error('Tài khoản quản trị đăng nhập tại mục Quản trị hệ thống.')}}catch(error){if(error instanceof Error&&error.message.startsWith('Tài khoản quản trị'))throw error;}
  const account=accounts().find(a=>a.email===email.trim().toLowerCase());
  if(!account||await hash(password,account.salt)!==account.digest)throw new Error('Email hoặc mật khẩu không đúng.');
  const user=await registerServer(account.name,account.email,password,account.role,account.id);
  set({user});return user;
 },
 register:async(name,email,password,role)=>{
  email=email.trim().toLowerCase();
  if(!name.trim())throw new Error('Vui lòng nhập họ và tên.');
  if(password.length<8)throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
  if(accounts().some(a=>a.email===email))throw new Error('Email này đã được đăng ký trên thiết bị. Hãy đăng nhập để kết nối tài khoản.');
  const user=await registerServer(name.trim(),email,password,role);set({user});return user;
 }
}));
