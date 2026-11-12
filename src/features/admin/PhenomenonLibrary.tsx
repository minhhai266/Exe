import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Beaker,Flame,Layers,Palette,Search,Wind} from 'lucide-react';
import {adminApi} from './api';
import type {AdminRecord} from './domain';
import {phenomenonTemplates,availablePhenomena,compositionFromRows,suggestedEffect,type PhenomenonCode} from '../../engine/phenomena';
import {ReactionPreview} from './AdminEditors';
import {useAdminUser} from './AdminLayout';

const icons={Khí:Wind,'Chất rắn':Layers,'Màu sắc':Palette,'Axit – bazơ':Beaker,Nhiệt:Flame};
export function PhenomenonLibrary({options,draft,onChange}:{options:any;draft?:AdminRecord;onChange?:(value:AdminRecord)=>void}){
 const user=useAdminUser(),navigate=useNavigate();
 const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[example,setExample]=useState<AdminRecord>(),[busy,setBusy]=useState(''),[error,setError]=useState('');
 const compatible=draft?availablePhenomena(compositionFromRows(draft.data)):[];
 const selected:PhenomenonCode[]=draft?.data.phenomena||compatible;
 const rows=phenomenonTemplates.filter(item=>(!category||item.category===category)&&(item.name+' '+item.description).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
 async function load(code:PhenomenonCode,create=false){
  const item=phenomenonTemplates.find(item=>item.code===code)!;setBusy(code);setError('');
  try{
   const base=await adminApi<AdminRecord>('/api/admin/reactions/'+item.example);
   if(!create){setExample(base);return}
   const template={...base,id:'',code:'reaction-'+crypto.randomUUID().slice(0,8),name:base.name+' (bản mới)',version:0,status:'draft',createdAt:'',updatedAt:'',data:{...base.data,builtin:false,reviewed:false,phenomena:[code],experimentConfig:{enabled:false}}};
   navigate('/admin/reactions/new',{state:{reactionTemplate:template}});
  }catch(e){setError((e as Error).message)}finally{setBusy('')}
 }
 return <section className="admin-phenomena" aria-label="Kho hiện tượng phản ứng">
  <div className="admin-section-header"><div><h2>Kho hiện tượng phản ứng</h2><p>Chọn mẫu để bắt đầu hoặc gắn các hiện tượng phù hợp với phương trình đang soạn.</p></div></div>
  <div className="admin-phenomena-filters"><label className="admin-search"><Search size={17}/><input aria-label="Tìm hiện tượng" placeholder="Sinh khí, kết tủa, đổi màu…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Nhóm hiện tượng" value={category} onChange={e=>setCategory(e.target.value)}><option value="">Tất cả nhóm</option>{[...new Set(phenomenonTemplates.map(item=>item.category))].map(value=><option key={value}>{value}</option>)}</select></div>
  {error&&<p className="admin-field-error" role="alert">{error}</p>}
  {!rows.length&&<p className="admin-form-hint">Không có hiện tượng phù hợp với từ khóa.</p>}
  <div className="admin-phenomena-grid">{rows.map(item=>{const Icon=icons[item.category],valid=compatible.includes(item.code);return <article className={'admin-phenomenon-card'+(draft&&selected.includes(item.code)?' is-selected':'')} key={item.code}>
   <div className="admin-phenomenon-title"><Icon size={21}/><span>{item.category}</span></div><h3>{item.name}</h3><p>{item.description}</p><small>{item.constraint}</small>
   {draft&&<label className="admin-inline-check"><input type="checkbox" disabled={!valid||!onChange} checked={selected.includes(item.code)} onChange={event=>onChange?.({...draft,data:{...draft.data,phenomena:event.target.checked?[...selected,item.code]:selected.filter(code=>code!==item.code),effect:suggestedEffect(compositionFromRows(draft.data))}})}/>{valid?'Gắn vào phản ứng':'Chưa phù hợp với các chất đang chọn'}</label>}
   <div className="admin-form-toolbar"><button type="button" className="admin-button" disabled={!!busy} onClick={()=>load(item.code)}>{busy===item.code?'Đang tải…':'Xem mẫu'}</button>{user.role==='SYSTEM_ADMIN'&&!draft&&<button type="button" className="admin-button primary" disabled={!!busy} onClick={()=>load(item.code,true)}>Tạo từ mẫu</button>}</div>
  </article>})}</div>
  {draft&&onChange&&<button type="button" className="admin-button" onClick={()=>onChange({...draft,data:{...draft.data,phenomena:compatible,effect:suggestedEffect(compositionFromRows(draft.data))}})}>Gợi ý hiện tượng theo các chất đã chọn</button>}
  {example&&<section className="admin-panel admin-phenomenon-example"><div className="admin-section-header"><h3>Mẫu: {example.name}</h3><button type="button" className="admin-button" onClick={()=>setExample(undefined)}>Đóng mẫu</button></div><p>{example.data.observation}</p><ReactionPreview key={example.id} draft={example} options={options}/><p className="admin-form-hint">Mẫu minh họa phản ứng trong một dụng cụ. Dẫn và thu khí cần lắp bộ dụng cụ tương ứng trong Lab.</p></section>}
 </section>;
}
