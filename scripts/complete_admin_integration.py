from pathlib import Path
def edit(path,before,after):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if before not in s:raise RuntimeError('Missing '+path+': '+before[:75])
 p.write_text(s.replace(before,after),encoding='utf-8')
p='src/features/admin/AdminEditors.tsx'
edit(p,'checked={d.behaviors?.includes(b)} onChange=', 'checked={d.behaviors?.includes(b)} disabled onChange=')
edit(p,'<div className="wide admin-behaviors">', '<p className="admin-form-hint wide">Các hành vi dưới đây đi kèm mẫu engine; chưa hỗ trợ bật/tắt riêng từng hành vi.</p><div className="wide admin-behaviors">')
needle="<p className=\"admin-form-hint\">Chỉ dùng effect engine đã hỗ trợ."
insert='''<fieldset className="admin-form-section"><legend>Cấu hình bài thực hành mẫu</legend><label className="admin-inline-check"><input type="checkbox" checked={!!d.experimentConfig?.enabled} onChange={e=>set('experimentConfig',{title:draft.name,grade:9,minutes:15,objectives:d.explanation||'',instructions:d.observation||'',...d.experimentConfig,enabled:e.target.checked})}/>Phát hành bài mẫu vào thư viện Lab khi phản ứng được xuất bản</label>{d.experimentConfig?.enabled&&<div className="admin-form-grid"><Field label="Tên bài thực hành mẫu" value={d.experimentConfig.title} onChange={v=>set('experimentConfig',{...d.experimentConfig,title:v})} wide/><Field label="Khối lớp bài mẫu" type="number" min={8} max={12} value={d.experimentConfig.grade} onChange={v=>set('experimentConfig',{...d.experimentConfig,grade:v})}/><Field label="Thời lượng bài mẫu (phút)" type="number" min={1} max={120} value={d.experimentConfig.minutes} onChange={v=>set('experimentConfig',{...d.experimentConfig,minutes:v})}/><Field label="Mục tiêu học tập" type="textarea" value={d.experimentConfig.objectives} onChange={v=>set('experimentConfig',{...d.experimentConfig,objectives:v})} wide/><Field label="Hướng dẫn bài mẫu" type="textarea" value={d.experimentConfig.instructions} onChange={v=>set('experimentConfig',{...d.experimentConfig,instructions:v})} wide/></div>}</fieldset>'''
edit(p,needle,insert+needle)
needle="</select></label>{l.blocks.map"
insert='''</select></label><div className="admin-form-grid">{([['chemicalIds','Hóa chất liên quan','chemicals'],['reactionIds','Phản ứng liên quan','reactions'],['apparatusIds','Dụng cụ liên quan','apparatus']] as const).map(([field,label,key])=><label key={field}>{label}<select multiple value={l[field]||[]} onChange={e=>{const values=Array.from(e.target.selectedOptions).map(o=>o.value);mutate(v=>{v[ci].lessons[li][field]=values})}}>{options[key]?.map((item:any)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>)}</div>{l.blocks.map'''
edit(p,needle,insert)
p='src/features/classrooms/AssignmentConfigEditor.tsx'
edit(p,"import { chemicals,", "import { useServerCatalog } from '../admin/catalogStore';\nimport { chemicals,")
edit(p,' const config=value?', ' const apparatus=useServerCatalog(s=>s.apparatus).filter(r=>!equipmentLibrary.some(e=>e.type===r.id));\n const config=value?')
needle='/> {e.name}'
# Existing labels have no separating space; add catalog controls before closing apparatus details.
edit(p,'/>{e.name}</label>)}</details>', '/>{e.name}</label>)}{apparatus.map(r=><label key={r.id} className="checkbox-label"><input type="checkbox" checked={!!config.catalogApparatusIds?.includes(r.id)} onChange={e=>update({catalogApparatusIds:e.target.checked?[...(config.catalogApparatusIds||[]),r.id]:(config.catalogApparatusIds||[]).filter(id=>id!==r.id)})}/>{r.name} · Thư viện hệ thống</label>)}</details>')
p='src/features/auth/authStore.ts'
edit(p,"signOut:()=>{sessionStorage.removeItem('virtual-lab-session');set({user:null});}", "signOut:async()=>{try{await fetch('/api/admin/auth/logout',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:'{}'})}catch{}sessionStorage.removeItem('virtual-lab-session');set({user:null});}")
needle="  const account=accounts().find(a=>a.email===email.trim().toLowerCase());"
replacement="""  try{const response=await fetch('/api/admin/auth/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:JSON.stringify({email,password})});if(response.ok){const data=await response.json();if(['TEACHER','STUDENT'].includes(data.user.role)){const user:User={id:data.user.id,name:data.user.name,email:data.user.email,role:data.user.role==='TEACHER'?'teacher':'student'};sessionStorage.setItem('virtual-lab-session',JSON.stringify(user));set({user});return user;}throw new Error('Tài khoản quản trị đăng nhập tại mục Quản trị hệ thống.')}}catch(error){if(error instanceof Error&&error.message.startsWith('Tài khoản quản trị'))throw error;}
"""+needle
edit(p,needle,replacement)
edit(p,"  const {id,name,role}=account;const user=", "  try{await fetch('/api/admin/auth/logout',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:'{}'})}catch{}\n  const {id,name,role}=account;const user=")
p='src/layouts/WorkspaceLayout.tsx'
edit(p,"onClick={()=>{signOut();navigate('/login')}}", "onClick={async()=>{await signOut();navigate('/login')}}")
p='src/features/auth/AuthPage.tsx'
edit(p,'Bản demo trên trình duyệt. Tài khoản chỉ lưu trên thiết bị này, chưa có xác thực máy chủ và không đồng bộ giữa các thiết bị. Hãy dùng mật khẩu riêng cho demo.', 'Tài khoản tự đăng ký dành cho học tập cá nhân trên thiết bị này. Tài khoản do nhà trường cấp dùng mật khẩu đã thiết lập qua lời mời của quản trị viên.')
edit(p,'</p></section></div>', '</p><p className="auth-switch"><Link to="/admin/login">Tài khoản nhà trường / Quản trị hệ thống</Link></p></section></div>')
p='src/features/admin/AdminAuth.tsx'
edit(p,"else navigate('/admin')", "else {sessionStorage.removeItem('virtual-lab-session');useAuth.setState({user:null});navigate('/admin')}")
p='server/admin/database.ts'
edit(p,"source:r.source||chemicalProfiles.HCl.source", "source:r.source||'https://www2.chem.wisc.edu/deptfiles/genchem/lab/ccaold/main/naoh/page1.htm'")
p='server/admin/service.ts'
edit(p,"safeName=text(name,'Tên file',180).replace(/[\\r\\n\"\\\\/]/g,'_')", "safeName=text(name,'Tên file',180).replace(/\\.[^.]+$/,'').replace(/[^\\p{L}\\p{N} _-]/gu,'_').slice(0,140)+({\"application/pdf\":'.pdf',\"image/png\":'.png',\"image/jpeg\":'.jpg',\"image/webp\":'.webp'} as Record<string,string>)[mime]")
