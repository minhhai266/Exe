from pathlib import Path

def edit(path, old, new):
    p=Path(path)
    s=p.read_text(encoding='utf-8')
    assert old in s, (path, old[:80])
    p.write_text(s.replace(old,new),encoding='utf-8')

edit('src/features/admin/admin.css', '--admin-primary:var(--brand-primary);--admin-primary-hover:var(--brand-primary-hover);--admin-bg:#f8fafc;--admin-surface:#fff;--admin-ink:#0f172a;--admin-muted:#64748b;--admin-border:#e2e8f0;--admin-subtle:#f1f5f9;--admin-success:#16a34a;--admin-warning:#d97706;--admin-danger:#dc2626;--admin-info:#0284c7;', '')
edit('src/styles/tokens.css', ':root{', ':root{\n --admin-primary:var(--brand-primary);--admin-primary-hover:var(--brand-primary-hover);--admin-bg:#f8fafc;--admin-surface:#fff;--admin-ink:#0f172a;--admin-muted:#64748b;--admin-border:#e2e8f0;--admin-subtle:#f1f5f9;--admin-success:#16a34a;--admin-warning:#d97706;--admin-danger:#dc2626;--admin-info:#0284c7;')
edit('src/features/admin/AdminResourceEditor.tsx', "useState<'archive'|'publish'|null>(null)", "useState<'archive'|'publish'|'access'|null>(null)")
edit('src/features/admin/AdminResourceEditor.tsx', "else save()}}", "else if(draft.id&&['users','schools'].includes(resource)&&(draft.status!==record.data?.status||resource==='users'&&(draft.data.role!==record.data?.data?.role||draft.data.schoolId!==record.data?.data?.schoolId)))setConfirm('access');else save()}}")
edit('src/features/admin/AdminResourceEditor.tsx', "title={confirm==='publish'?'Xuất bản nội dung?':'Lưu trữ bản ghi?'}", "title={confirm==='access'?'Thay đổi quyền hoặc trạng thái?':confirm==='publish'?'Xuất bản nội dung?':'Lưu trữ bản ghi?'}")
edit('src/features/admin/AdminResourceEditor.tsx', "description={confirm==='publish'?", "description={confirm==='access'?'Thay đổi này có thể thu hồi phiên đăng nhập và ảnh hưởng quyền truy cập của tài khoản trong trường.':confirm==='publish'?")
edit('src/features/admin/AdminResourceEditor.tsx', "save(confirm==='publish'?'published':'archived')", "save(confirm==='access'?undefined:confirm==='publish'?'published':'archived')")
edit('server/admin/validation.ts', 'const portIds=new Set<string>();', 'const portIds=new Set<string>(),portTypes=new Set<string>();')
edit('server/admin/validation.ts', "portIds.add(p.id);if(!", "portIds.add(p.id);if(portTypes.has(p.type))throw new ApiError(400,'Mỗi mẫu chỉ hỗ trợ một cổng vào và một cổng ra.');portTypes.add(p.type);if(!")
edit('server/admin/validation.ts', "if(published&&d.assetUrl&&!/^\\/api\\/admin\\/assets\\/[a-z0-9-]+$/.test(d.assetUrl))throw new ApiError(400,'Ảnh phải được tải lên kho file của hệ thống.');", "if(d.assetUrl){const assetId=String(d.assetUrl).split('/').at(-1),asset=store.get('SELECT mime FROM assets WHERE id=?',assetId);if(d.assetUrl!==`/api/admin/assets/${assetId}`||!asset?.mime.startsWith('image/'))throw new ApiError(400,'Ảnh phải được tải lên kho file của hệ thống.');}")
edit('server/admin/service.ts', "const order=params.get('sort')", "const category=params.get('category');if(resource==='chemicals'&&category){where+=\" AND json_extract(data,'$.category')=?\";args.push(category.slice(0,100))}\n  const order=params.get('sort')")
edit('src/features/admin/AdminTable.tsx', "[status,setStatus]=useState('')", "[category,setCategory]=useState(''),[status,setStatus]=useState('')")
edit('src/features/admin/AdminTable.tsx', "setStatus('');setRole", "setStatus('');setCategory('');setRole")
edit('src/features/admin/AdminTable.tsx', '{q,status,role,schoolId,page:', '{q,status,role,schoolId,category,page:')
edit('src/features/admin/AdminTable.tsx', "{resource==='users'&&<>", "{resource==='chemicals'&&<select aria-label=\"Lọc phân loại hóa chất\" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option value=\"\">Tất cả phân loại</option>{[...new Set<string>(options.data?.chemicals?.map((c:AdminRecord)=>c.data.category).filter(Boolean)||[])].sort().map(c=><option key={c} value={c}>{c}</option>)}</select>}{resource==='users'&&<>")
