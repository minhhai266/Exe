import { randomBytes,scrypt,timingSafeEqual,createHash } from 'node:crypto';
import { promisify } from 'node:util';
import type { IncomingMessage } from 'node:http';
import type { AdminDatabase } from './database';
import type { ServerUser } from '../../src/features/admin/domain';
const derive=promisify(scrypt);
export class ApiError extends Error{constructor(public status:number,message:string){super(message)}}
export function digest(value:string){return createHash('sha256').update(value).digest('hex')}
export async function passwordHash(password:string,minLength=12){if(typeof password!=='string'||password.length<minLength||password.length>200)throw new ApiError(400,`Mật khẩu cần ${minLength}–200 ký tự.`);const salt=randomBytes(16).toString('hex');const hash=await derive(password,salt,64) as Buffer;return `scrypt:${salt}:${hash.toString('hex')}`}
export async function verifyPassword(password:string,stored:string|null){const [,salt,hash]=(stored||'scrypt:virtual-lab-dummy:'.padEnd(166,'0')).split(':');const actual=await derive(password,salt||'dummy',64) as Buffer;const expected=Buffer.from(hash||'0'.repeat(128),'hex');return !!stored&&expected.length===actual.length&&timingSafeEqual(actual,expected)}
export function publicUser(row:any):ServerUser{return {id:row.id,name:row.name,email:row.email,role:row.role,schoolId:row.school_id,schoolName:row.school_name||undefined,status:row.status,createdAt:row.created_at,version:row.version}}
export function activeAccount(row:any){return !!row&&row.status==='active'&&(row.role==='SYSTEM_ADMIN'||(row.school_id?row.school_status==='active':['TEACHER','STUDENT'].includes(row.role)))}
export class Security{
 private limits=new Map<string,{count:number;until:number}>();
 constructor(private store:AdminDatabase){}
 limit(key:string,max=20,windowMs=60000){const now=Date.now();if(this.limits.size>10000)for(const [k,v] of this.limits)if(v.until<now)this.limits.delete(k);let value=this.limits.get(key);if(!value||value.until<now){value={count:0,until:now+windowMs};this.limits.set(key,value)}if(++value.count>max)throw new ApiError(429,'Quá nhiều yêu cầu. Hãy thử lại sau.');}
 user(req:IncomingMessage){const cookie=req.headers.cookie?.split(';').map(p=>p.trim()).find(c=>c.startsWith('vl_admin_session='))?.slice('vl_admin_session='.length);if(!cookie)return undefined;const row=this.store.get('SELECT u.*,s.name school_name,s.status school_status FROM sessions x JOIN users u ON x.user_id=u.id LEFT JOIN schools s ON s.id=u.school_id WHERE x.token_hash=? AND x.expires_at>?',digest(cookie),new Date().toISOString());if(!activeAccount(row))return undefined;return publicUser(row)}
 require(req:IncomingMessage,roles:string[]=['SYSTEM_ADMIN','SCHOOL_ADMIN']){const user=this.user(req);if(!user)throw new ApiError(401,'Vui lòng đăng nhập bằng tài khoản máy chủ.');if(!roles.includes(user.role))throw new ApiError(403,'Bạn không có quyền thực hiện thao tác này.');return user}
 issue(userId:string){const token=randomBytes(32).toString('hex'),now=new Date().toISOString();this.store.run('DELETE FROM sessions WHERE expires_at<=?',now);this.store.run('INSERT INTO sessions VALUES(?,?,?,?)',digest(token),userId,new Date(Date.now()+8*3600000).toISOString(),now);return token}
 revoke(req:IncomingMessage){const raw=req.headers.cookie?.split(';').map(p=>p.trim()).find(c=>c.startsWith('vl_admin_session='))?.slice(17);if(raw)this.store.run('DELETE FROM sessions WHERE token_hash=?',digest(raw))}
 sameOrigin(req:IncomingMessage){if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)throw new ApiError(403,'Yêu cầu khác nguồn bị từ chối.');if(req.headers['sec-fetch-site']==='cross-site')throw new ApiError(403,'Yêu cầu khác nguồn bị từ chối.');if(!['GET','HEAD'].includes(req.method||'GET')&&req.headers['x-virtual-lab']!=='1')throw new ApiError(403,'Thiếu mã xác nhận nguồn yêu cầu.');}
}
