import {useEffect,useRef,useState} from 'react';
import type {Role} from './authStore';
import './google-sign-in.css';

type GoogleIdentity={
 initialize:(options:{client_id:string;nonce:string;auto_select:boolean;callback:(response:{credential:string})=>void})=>void;
 renderButton:(element:HTMLElement,options:{type:string;theme:string;size:string;text:string;shape:string;width:number;locale:string})=>void;
};
declare global{interface Window{google?:{accounts:{id:GoogleIdentity}}}}
let scriptPromise:Promise<GoogleIdentity>|undefined;
function loadGoogle(){
 if(window.google?.accounts.id)return Promise.resolve(window.google.accounts.id);
 if(!scriptPromise)scriptPromise=new Promise<GoogleIdentity>((resolve,reject)=>{
  const script=document.createElement('script');
  const fail=()=>{clearTimeout(timer);script.remove();scriptPromise=undefined;reject(new Error('Không tải được Google. Vui lòng kiểm tra kết nối và thử lại.'))};
  const timer=window.setTimeout(fail,15000);
  script.src='https://accounts.google.com/gsi/client?hl=vi';script.async=true;script.defer=true;
  script.onload=()=>{clearTimeout(timer);const identity=window.google?.accounts.id;if(identity)resolve(identity);else fail()};
  script.onerror=fail;document.head.appendChild(script);
 });
 return scriptPromise;
}
function GoogleMark(){return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.61 0-4.82-1.77-5.61-4.15H3.04v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.9a6 6 0 0 1 0-3.8V7.51H3.04a10 10 0 0 0 0 8.98l3.35-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.59C7.18 7.72 9.39 5.95 12 5.95Z"/></svg>}

export function GoogleSignIn({role,disabled,onCredential,onBusyChange}:{role:Role;disabled:boolean;onCredential:(credential:string)=>Promise<void>;onBusyChange:(busy:boolean)=>void}){
 const host=useRef<HTMLDivElement>(null),handlers=useRef({onCredential,onBusyChange,disabled});
 handlers.current={onCredential,onBusyChange,disabled};
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[unavailable,setUnavailable]=useState(false),[attempt,setAttempt]=useState(0),[signing,setSigning]=useState(false);
 const locked=useRef(false);
 useEffect(()=>{
  let disposed=false,observer:ResizeObserver|undefined;const controller=new AbortController();
  setReady(false);setError('');setUnavailable(false);
  async function setup(){
   try{
    const response=await fetch('/api/admin/auth/google/prepare',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:JSON.stringify({role}),signal:controller.signal});
    const data=await response.json();if(disposed)return;
    if(!response.ok){setUnavailable(response.status===503);throw new Error(data.error?.message||'Không thể kết nối Google.')}
    const identity=await loadGoogle();if(disposed||!host.current)return;
    identity.initialize({client_id:data.clientId,nonce:data.nonce,auto_select:false,callback:async({credential})=>{
     if(disposed||locked.current||handlers.current.disabled)return;
     locked.current=true;setSigning(true);setError('');handlers.current.onBusyChange(true);
     try{await handlers.current.onCredential(credential)}catch(e){if(!disposed){setReady(false);setError(e instanceof Error?e.message:'Không thể đăng nhập bằng Google.')}}
     finally{locked.current=false;if(!disposed)setSigning(false);handlers.current.onBusyChange(false)}
    }});
    const element=host.current,parent=element.parentElement!;
    let lastWidth=0;
    const render=()=>{
     const width=Math.floor(Math.min(400,parent.clientWidth));if(width<100||width===lastWidth||disposed)return;
     lastWidth=width;element.replaceChildren();
     identity.renderButton(element,{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'rectangular',width,locale:'vi'});
    };
    render();observer=new ResizeObserver(render);observer.observe(parent);
    setReady(true);
   }catch(e){if(!disposed)setError(e instanceof Error?e.message:'Không thể kết nối Google.')}
  }
  void setup();return()=>{disposed=true;controller.abort();observer?.disconnect()};
 },[role,attempt]);
 return <div className="google-auth" aria-busy={signing}>
  <div ref={host} className={'google-auth-button'+(!ready||disabled?' is-inactive':'')} inert={!ready||disabled} aria-hidden={!ready||disabled}/>
  {!ready&&<button type="button" className="btn white google-auth-fallback" disabled={unavailable||!error||disabled} onClick={()=>setAttempt(v=>v+1)}><GoogleMark/>{error&&!unavailable?'Thử lại đăng nhập Google':'Đăng nhập bằng Google'}</button>}
  {signing&&<p className="google-auth-status" role="status">Đang xác minh tài khoản Google…</p>}
  {error&&<p className="auth-error google-auth-status" role={unavailable?'status':'alert'}>{error}</p>}
 </div>;
}
