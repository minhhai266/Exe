import { useState } from 'react';
import { Droplets,Thermometer,Wind } from 'lucide-react';
import { chemicals,type ChemicalId } from '../../../engine/chemicals';
import { observedReaction } from '../../../engine/learningPolicy';
import type { Vessel } from '../../../engine/equipment';
import { estimatePH } from '../../../engine/visualModel';
import { AppearanceLegend } from './AppearanceLegend';

export function LiveReadout({v,showAppearance=true,explanationAllowed=true,onExplain}:{v:Vessel;showAppearance?:boolean;explanationAllowed?:boolean;onExplain?:()=>void}){
 const [opened,setOpened]=useState<string|null>(null);
 const r=v.reaction,rule=observedReaction(v),key=v.id+':'+r?.startedAt;
 const revealed=explanationAllowed&&opened===key;
 const progress=r?r.extent/Math.max(r.target,1e-12):0,ph=estimatePH(v.contents,v.volume);
 return <div className="reaction-readout">
  <div className="readout-heading"><span className={'reaction-status '+(r?.status==='running'?'running':'')}><i/>{v.gasReceiving?'Đang thu khí':r?.status==='running'?'Phản ứng đang diễn ra':r?.status==='complete'?'Phản ứng hoàn tất':r?.status==='paused'?'Phản ứng tạm dừng':'Sẵn sàng quan sát'}</span><Wind size={14}/></div>
  {v.litmusResult&&<p>Quỳ tím: {v.litmusResult==='red'?'đỏ · môi trường axit':v.litmusResult==='blue'?'xanh · môi trường bazơ':'tím · gần trung tính'}.</p>}
  {r&&<><div className="progress-track"><span style={{width:Math.min(100,progress*100)+'%'}}/></div><div className="limiting-row"><span>Tiến độ</span><strong>{Math.round(progress*100)}%</strong></div><div className="limiting-row"><span>Tốc độ quy ước</span><strong>×{r.rate.toFixed(2)}</strong></div></>}
  {rule?<><p>{rule.observation}</p><button className="btn white full" disabled={!explanationAllowed} onClick={()=>{if(!revealed)onExplain?.();setOpened(revealed?null:key)}}>{revealed?'Ẩn giải thích':'Giải thích hiện tượng'}</button>{!explanationAllowed&&<small>Giải thích đang khóa theo cấu hình bài giao.</small>}{revealed&&<div className="reaction-explanation"><div className="readout-equation">{rule.equation}</div><p>{rule.explanation}</p><details><summary>Vai trò và điều kiện</summary><p>Chất phản ứng: {Object.keys(rule.reactants).map(c=>chemicals[c as ChemicalId].formula).join(', ')}. Sản phẩm: {Object.keys(rule.products).map(c=>chemicals[c as ChemicalId].formula).join(', ')}.</p><p>{rule.minTemperature?'Nhiệt độ tối thiểu: '+rule.minTemperature+'°C.':'Áp dụng điều kiện của quy tắc đang mô phỏng.'}</p></details></div>}</>:<p>{v.litmusResult?'Đây là phép thử bằng chất chỉ thị. Màu trên giấy cho biết môi trường axit hoặc bazơ của mẫu đã thử.':'Chưa ghi nhận phản ứng. Kiểm tra chất đã thêm, lượng chất, giá đỡ và điều kiện. Mô hình chỉ xử lý các phản ứng được hỗ trợ.'}</p>}
  <div className="sensor-grid"><div><Thermometer size={15}/><small>Nhiệt độ mô hình</small><strong>{(v.temperature??25).toFixed(1)}°C</strong></div><div><Droplets size={15}/><small>pH sau trộn · 25°C</small><strong>{ph===undefined?'—':ph.toFixed(1)}</strong></div></div>
  {(['H2','O2','CO2'] as ChemicalId[]).filter(c=>(v.produced?.[c]||v.collected?.[c]||0)>0).map(c=><div className="live-gas-stats" key={c}><strong>{chemicals[c].formula}</strong><span>Sinh ra: {((v.produced?.[c]||0)*1000).toFixed(2)} mmol</span><span>Thu được: {((v.collected?.[c]||0)*1000).toFixed(2)} mmol</span><span>Thoát ra: {((v.escaped?.[c]||0)*1000).toFixed(2)} mmol</span></div>)}
  {showAppearance&&<AppearanceLegend v={v} compact/>}<small className="sensor-disclaimer">Tốc độ là hệ số giáo dục, không phải hằng số thực nghiệm. pH chỉ áp dụng hệ axit/bazơ mạnh giản lược. Nhiệt và quy đổi khí đều là xấp xỉ.</small>
 </div>;
}
