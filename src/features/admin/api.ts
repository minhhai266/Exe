import { useEffect,useState } from 'react';
export class AdminApiError extends Error{constructor(message:string,public status:number){super(message)}}
export async function adminApi<T=any>(path:string,options:RequestInit={}):Promise<T>{
 const response=await fetch(path,{...options,credentials:'same-origin',headers:{'x-virtual-lab':'1',...(options.body&&!(options.body instanceof File)?{'content-type':'application/json'}:{}),...options.headers}});
 const data=await response.json().catch(()=>({error:{message:'Máy chủ không trả dữ liệu JSON hợp lệ.'}}));if(!response.ok)throw new AdminApiError(typeof data.error==='string'?data.error:data.error?.message||'Không thể xử lý yêu cầu.',response.status);return data;
}
export const writeApi=<T=any>(path:string,method:string,data:any)=>adminApi<T>(path,{method,body:JSON.stringify(data)});
export function useAdminData<T=any>(path:string){
 const [state,setState]=useState<{path:string;data?:T;error?:Error;loading:boolean}>({path,loading:true});
 const [version,setVersion]=useState(0);
 useEffect(()=>{const abort=new AbortController();setState({path,loading:true});adminApi<T>(path,{signal:abort.signal}).then(data=>{if(!abort.signal.aborted)setState({path,data,loading:false})}).catch(error=>{if(!abort.signal.aborted)setState({path,error,loading:false})});return()=>abort.abort()},[path,version]);
 return {...(state.path===path?state:{loading:true,data:undefined,error:undefined}),reload:()=>setVersion(v=>v+1)};
}
