import {randomBytes,randomUUID} from 'node:crypto';
import {OAuth2Client} from 'google-auth-library';
import type {IncomingMessage} from 'node:http';
import type {AdminDatabase} from './database';
import {ApiError,activeAccount,digest,publicUser} from './security';

export interface GoogleConfig{GOOGLE_CLIENT_ID?:string}
export class GoogleSignIn{
 private client=new OAuth2Client();
 constructor(private store:AdminDatabase,private config:GoogleConfig){}
 prepare(role:unknown){
  const clientId=this.config.GOOGLE_CLIENT_ID?.trim();
  if(!clientId)throw new ApiError(503,'Đăng nhập Google hiện chưa khả dụng. Vui lòng dùng email và mật khẩu.');
  if(role!=='student'&&role!=='teacher')throw new ApiError(400,'Vai trò không hợp lệ.');
  const nonce=randomBytes(32).toString('hex');
  this.store.run('DELETE FROM google_login_challenges WHERE expires_at<=?',new Date().toISOString());
  this.store.run('INSERT INTO google_login_challenges VALUES(?,?,?)',digest(nonce),role.toUpperCase(),new Date(Date.now()+5*60000).toISOString());
  return {clientId,nonce};
 }
 cookie(req:IncomingMessage,nonce:string,secure:boolean){return `vl_google_nonce=${nonce}; Path=/api/admin/auth/google; HttpOnly; SameSite=Strict; Max-Age=${nonce?300:0}${secure||!!(req.socket as any).encrypted?'; Secure':''}`}
 async signIn(req:IncomingMessage,credential:unknown){
  const clientId=this.config.GOOGLE_CLIENT_ID?.trim();
  if(!clientId)throw new ApiError(503,'Đăng nhập Google hiện chưa khả dụng.');
  const nonce=req.headers.cookie?.split(';').map(c=>c.trim()).find(c=>c.startsWith('vl_google_nonce='))?.slice('vl_google_nonce='.length);
  if(!nonce||!/^[a-f0-9]{64}$/.test(nonce))throw new ApiError(401,'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.');
  const challenge=this.store.get('SELECT * FROM google_login_challenges WHERE nonce_hash=? AND expires_at>?',digest(nonce),new Date().toISOString());
  if(!challenge)throw new ApiError(401,'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.');
  this.store.run('DELETE FROM google_login_challenges WHERE nonce_hash=?',digest(nonce));
  if(typeof credential!=='string'||credential.length>12000||credential.split('.').length!==3)throw new ApiError(400,'Thông tin đăng nhập Google không hợp lệ.');
  let payload;
  try{payload=(await this.client.verifyIdToken({idToken:credential,audience:clientId})).getPayload()}catch{throw new ApiError(401,'Không xác minh được tài khoản Google. Vui lòng thử lại.')}
  if(!payload||payload.nonce!==nonce||!payload.sub||!payload.email||payload.email_verified!==true)throw new ApiError(401,'Tài khoản Google chưa được xác minh hoặc phiên không hợp lệ.');
  return this.store.transaction(()=>{
   let row=this.store.get('SELECT u.*,s.status school_status FROM google_identities g JOIN users u ON u.id=g.user_id LEFT JOIN schools s ON s.id=u.school_id WHERE g.subject=?',payload.sub);
   if(!row){
    const email=payload.email!.trim().toLowerCase();
    if(this.store.get('SELECT id FROM users WHERE email=?',email))throw new ApiError(409,'Email này đã có tài khoản. Vui lòng đăng nhập bằng phương thức đã đăng ký; tài khoản nhà trường dùng mục đăng nhập nhà trường.');
    const id=randomUUID(),now=new Date().toISOString(),name=(payload.name||email.split('@')[0]).slice(0,180);
    this.store.run("INSERT INTO users VALUES(?,?,?,?,NULL,'active',NULL,1,?,?)",id,email,name,challenge.role,now,now);
    this.store.run('INSERT INTO google_identities VALUES(?,?,?)',payload.sub,id,now);
    row=this.store.get('SELECT * FROM users WHERE id=?',id);
   }
   if(!activeAccount(row))throw new ApiError(403,'Tài khoản đang bị khóa hoặc chưa hoạt động.');
   if(!['STUDENT','TEACHER'].includes(row.role))throw new ApiError(403,'Tài khoản này cần đăng nhập tại mục quản trị.');
   return publicUser(row);
  });
 }
}
