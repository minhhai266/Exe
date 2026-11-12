import { CheckCircle2,Lightbulb } from 'lucide-react';
export function LabWorkflow({current,onHint}:{current:number;onHint:()=>void}){
 const labels=['Chuẩn bị','Thêm chất','Phản ứng','Ghi quan sát','Hoàn thành'];
 return <nav className="lab-workflow" aria-label="Tiến trình thực hành"><ol>{labels.map((label,i)=><li key={label} className={i<current?'done':''} aria-current={i===current?'step':undefined}>{i<current?<CheckCircle2 size={14}/>:<span>{i+1}.</span>}{label}</li>)}</ol><button className="text-link" onClick={onHint}><Lightbulb size={16}/>Gợi ý bước này</button></nav>;
}
