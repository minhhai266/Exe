from pathlib import Path
def edit(path,old,new):
 p=Path(path);s=p.read_text(encoding='utf-8');assert old in s,(path,old[:70]);p.write_text(s.replace(old,new),encoding='utf-8')
edit('server/admin/validation.ts', "if(existing?.data.builtin&&store.get", "if(published&&existing?.data.builtin&&store.get")
edit('server/admin/service.ts', "if(value.status==='archived'){", "if(value.status!=='published'){")
edit('server/admin/service.ts', 'Không thể lưu trữ.', 'Không thể thu hồi phát hành hoặc lưu trữ.')
