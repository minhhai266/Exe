import { FlaskConical,LoaderCircle,PenLine,Plus,Sparkles,X } from 'lucide-react';
import { useEffect,useRef,useState } from 'react';
import { chemicals,reagents,type ChemicalId } from "../../../engine/chemicals";
import { draftFromRule,equationFor,validateReactionDraft,type ReactionDraft,type ReactionSpecies } from "../../../engine/reactionAuthoring";
import { reactionRules } from "../../../engine/reactionRules";

export function ReactionComposer({value,reviewed,onChange,onReviewed,onGenerated,mode='ai'}:{value:ReactionDraft|null;reviewed:boolean;onChange:(d:ReactionDraft|null)=>void;onReviewed:(v:boolean)=>void;onGenerated:(d:ReactionDraft)=>void;mode?:'ai'|'manual'}){
 const [prompt,setPrompt]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const update=<K extends keyof ReactionDraft>(key:K,v:ReactionDraft[K])=>{if(value){onChange({...value,[key]:v});onReviewed(false)}};
 async function generate(){
  if(prompt.trim().length<10){setError('Mô tả phản ứng và mục tiêu bài học ít nhất 10 ký tự.');return}
  setBusy(true);setError('');const request=new AbortController();controller.current=request;const timeout=setTimeout(()=>request.abort('timeout'),50000);
  try{
   const response=await fetch('/api/reaction-draft',{method:'POST',headers:{'Content-Type':'application/json','x-virtual-lab':'1'},body:JSON.stringify({prompt}),signal:request.signal});
   const result=await response.json();if(!response.ok)throw new Error((typeof result.error==='string'?result.error:result.error?.message)||'Chưa tạo được bản nháp.');
   const problem=validateReactionDraft(result.draft);if(problem)throw new Error(problem);
   onChange(result.draft);onReviewed(false);onGenerated(result.draft);
  }catch(e){setError(request.signal.aborted?(request.signal.reason==='timeout'?'Gemini phản hồi quá lâu. Hãy thử lại.':'Đã hủy tạo bản nháp. Bạn có thể chỉnh yêu cầu và thử lại.'):e instanceof Error?e.message:'Không kết nối được Gemini. Hãy thử lại hoặc tự soạn.')}finally{clearTimeout(timeout);controller.current=null;setBusy(false)}
 }
 const validation=value?validateReactionDraft(value):undefined;
 const rows=(side:'reactants'|'products')=>value&&<div className="reaction-side">
  <h4>{side==='reactants'?'Chất tham gia':'Sản phẩm'}</h4>
  {value[side].map((r,i)=><div className="reaction-species" key={i}>
   <label>Chất {i+1}<select aria-label={`${side==='reactants'?'Chất tham gia':'Sản phẩm'} ${i+1}`} value={r.chemical} onChange={e=>update(side,value[side].map((v,j)=>j===i?{...v,chemical:e.target.value}:v))}>{(side==='reactants'?reagents.filter(c=>c!=='indicator'):(Object.keys(chemicals) as ChemicalId[]).filter(c=>c!=='indicator')).map(id=><option value={id} key={id}>{chemicals[id].formula} · {chemicals[id].name}</option>)}</select></label>
   <label>Hệ số<input aria-label={`Hệ số ${side==='reactants'?'tham gia':'sản phẩm'} ${i+1}`} type="number" min="1" max="20" step="1" value={r.coefficient} onChange={e=>update(side,value[side].map((v,j)=>j===i?{...v,coefficient:+e.target.value}:v))}/></label>
   <button type="button" className="icon-btn" aria-label={`Xóa ${side==='reactants'?'chất tham gia':'sản phẩm'} ${i+1}`} onClick={()=>update(side,value[side].filter((_,j)=>j!==i))}><X size={15}/></button>
  </div>)}
  <button type="button" className="text-link" disabled={value[side].length>=8} onClick={()=>update(side,[...value[side],{chemical:side==='reactants'?'HCl':'H2O',coefficient:1} satisfies ReactionSpecies])}><Plus size={14}/>Thêm chất</button>
 </div>;
 return <section className="reaction-composer" aria-label="Soạn phản ứng với Gemini">
  <h3>{mode==='ai'?<Sparkles size={22}/>:<PenLine size={22}/>}Từ ý tưởng đến một thí nghiệm {mode==='ai'&&<span className="ai-badge">Gemini</span>}</h3>
  <p>Mô tả bằng lời, nhận bản nháp rồi chỉnh chất, hệ số và hiện tượng theo bài học của bạn.</p>
  {mode==='ai'&&<div className="composer-ai"><label>Yêu cầu cho Gemini<textarea disabled={busy} maxLength={4000} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ví dụ: Soạn bài lớp 9 về CuSO4 và NaOH, tạo kết tủa xanh. Đưa ra phương trình, giải thích và 3 gợi ý cho học sinh."/></label><div className="composer-examples">{['Lớp 8: Zn và HCl tạo hiđro, thu bằng đẩy nước.','Lớp 9: CuSO4 và NaOH tạo kết tủa xanh.'].map(example=><button type="button" disabled={busy} key={example} onClick={()=>setPrompt(example)}>{example}</button>)}</div><p className="ai-caution">AI có thể sai. Bản nháp cần được giáo viên kiểm tra nguồn, phương trình, điều kiện và hiện tượng trước khi xuất bản.</p><button type="button" className="btn primary" disabled={busy} onClick={generate}>{busy?<LoaderCircle size={16}/>:<Sparkles size={16}/>} {busy?'Đang soạn bản nháp…':error?'Thử lại với Gemini':'Tạo với Gemini'}</button>{busy&&<button type="button" className="btn white" onClick={()=>controller.current?.abort()}>Hủy tạo bản nháp</button>}</div>}
  <div className="composer-actions"><button type="button" className="btn white" disabled={busy} onClick={()=>{const d=draftFromRule(reactionRules.find(r=>r.id==='precipitate')!);d.source='https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch18/complex.php';onChange(d);onReviewed(false);setError('')}}><PenLine size={16}/>Tự soạn phản ứng</button>{value&&<button type="button" className="btn ghost" disabled={busy} onClick={()=>{onChange(null);onReviewed(false)}}>Dùng phản ứng thư viện</button>}</div>
  <small className="muted">Chỉ nội dung yêu cầu được gửi đến Gemini khi bấm tạo. Không cần API key nếu tự soạn.</small>
  {error&&<p role="alert" className="validation-error">{error}</p>}
  {value&&<div className="reaction-editor"><h3><FlaskConical size={18}/>Bản nháp phản ứng · có thể chỉnh sửa</h3><div className="equation-block">{equationFor(value)}</div>{rows('reactants')}{rows('products')}
   <div className="two-cols"><label>Nhiệt độ tối thiểu (°C)<input type="number" min="20" max="98" value={value.minTemperature} onChange={e=>update('minTemperature',+e.target.value)}/></label><label>Thời gian mô phỏng (giây)<input type="number" min="1" max="120" value={value.durationSeconds} onChange={e=>update('durationSeconds',+e.target.value)}/></label></div>
   <label>Hiện tượng quan sát<textarea maxLength={3000} value={value.observation} onChange={e=>update('observation',e.target.value)}/></label>
   <label>Giải thích phản ứng<textarea maxLength={3000} value={value.explanation} onChange={e=>update('explanation',e.target.value)}/></label>
   <label>Nguồn phản ứng để đối chiếu<input type="url" placeholder="https://…" value={value.source} onChange={e=>update('source',e.target.value)}/></label>
   <p className={validation?'validation-error':'validation-success'} role="status">{validation||'Đã cân bằng nguyên tử; chất và điều kiện nằm trong phạm vi mô phỏng.'}</p>
   <label className="reaction-review"><input type="checkbox" checked={reviewed} onChange={e=>onReviewed(e.target.checked)}/>Tôi đã kiểm tra nguồn, điều kiện và tính đúng đắn của phản ứng trước khi giao bài.</label>
   <small className="muted">Kiểm tra cân bằng không chứng minh phản ứng xảy ra thực tế. Chất ngoài thư viện cần được bổ sung dữ liệu trước khi mô phỏng. Hiệu ứng lấy từ pha sản phẩm; nhiệt phản ứng mới chưa được tính.</small>
  </div>}
 </section>;
}
