import { useState } from 'react';
import { ArrowRight,FlaskConical,Lightbulb,RotateCcw,NotebookPen,Play,Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LabArt } from '../../shared/components/LabArt';
import { ReactionArt } from '../../shared/components/ReactionArt';
import { experiments } from '../experiments/data';

export function HeroPreview(){
 const [running,setRunning]=useState(false);
 return <div className="hero-scene"><div className="lab-preview"><div className="preview-title"><span><FlaskConical size={16}/> BÀN THÍ NGHIỆM 01</span><span className="tag">Xem trước</span></div><div className="preview-inner"><div className="preview-label"><strong>Điều chế khí Hiđro</strong><span>Zn + HCl</span></div><LabArt active={running}/><div className="formula"><span>Zn + 2HCl → ZnCl₂ + H₂ ↑</span></div><div className="preview-controls"><button className="btn white" aria-pressed={running} onClick={()=>setRunning(!running)}>{running?<Pause size={16}/>:<Play size={16}/>} {running?'Dừng chuyển động':'Quan sát bọt khí'}</button><Link to="/practice/hydrogen" className="text-link">Mở phòng lab <ArrowRight size={16}/></Link></div><p className="preview-explanation" role="status">{running?'Kẽm phản ứng với HCl, giải phóng khí hiđro.':'Chọn “Quan sát bọt khí” để xem minh họa hiện tượng.'}</p></div></div><p className="scene-caption">Minh họa hiện tượng · Thực hành kéo thả trong phòng lab</p></div>;
}
const features=[
 {icon:FlaskConical,title:'Tự tay thao tác',description:'Chọn dụng cụ, thêm hóa chất và bố trí bàn thí nghiệm.',heading:'Bắt đầu từ một chiếc bình.',body:'Trong phòng lab, kéo dụng cụ từ kệ lên bàn, chọn hóa chất rồi điều chỉnh lượng chất trước khi chạy phản ứng.'},
 {icon:Lightbulb,title:'Gợi ý đúng lúc',description:'Tìm hướng đi, vẫn tự mình khám phá.',heading:'Một gợi ý nhỏ. Một khám phá lớn.',body:experiments[0].hints[0]},
 {icon:RotateCcw,title:'Thử sai, học thật',description:'Thay đổi điều kiện, quan sát sự khác biệt.',heading:'Điều gì xảy ra khi đun nóng?',body:'KMnO₄ phân hủy khi được đun nóng, tạo ra khí oxi. Mở bài điều chế oxi và thử bật điều kiện gia nhiệt.'},
 {icon:NotebookPen,title:'Lưu lại khám phá',description:'Ghi quan sát và xem lại kết quả thực hành.',heading:'Nhật ký của chính bạn.',body:'Ghi lại hiện tượng trong phòng lab và xem kết quả sau khi hoàn thành. Nhật ký chỉ có nội dung khi bạn thực hành.'},
];
export function DiscoveryFeatures(){
 const [selected,setSelected]=useState(0);const f=features[selected];
 return <section id="features" className="features-section"><div className="container"><div className="center-heading"><div className="eyebrow">HỌC BẰNG CÁCH LÀM</div><h2>Không chỉ xem. Tự mình khám phá.</h2><p>Mỗi lần thử là một cơ hội để hiểu thêm.</p></div><div className="discovery-layout"><div className="feature-selectors" aria-label="Khám phá tính năng">{features.map((item,i)=><button key={item.title} aria-pressed={selected===i} aria-controls="discovery-panel" onClick={()=>setSelected(i)}><item.icon size={22}/><span><strong>{item.title}</strong><small>{item.description}</small></span><ArrowRight size={17}/></button>)}</div><div id="discovery-panel" className="discovery-panel" aria-live="polite"><span className="eyebrow">GIỚI THIỆU TÍNH NĂNG · 0{selected+1}</span>{selected===0?<LabArt small/>:selected===1?<div className="hint-preview"><Lightbulb size={32}/><blockquote>“{experiments[0].hints[1]}”</blockquote><span>Gợi ý trong thí nghiệm Hiđro</span></div>:selected===2?<div className="catalyst-preview"><ReactionArt art="oxygen-heat" label="Đun nóng KMnO₄ sinh khí oxi"/><span>Đun nóng KMnO₄ · Thu khí O₂</span></div>:<div className="journal-preview"><NotebookPen size={32}/><span>Hiện tượng quan sát</span><div/><span>Giải thích & phương trình</span><div/><small>Ghi chép của bạn sẽ bắt đầu từ lần thực hành đầu tiên.</small></div>}<h3>{f.heading}</h3><p>{f.body}</p><Link className="text-link" to={'/practice/'+(selected===2?'oxygen':'hydrogen')}>Thử trong phòng lab <ArrowRight size={16}/></Link></div></div></div></section>;
}
