import { X,ZoomIn } from 'lucide-react';
import { Group,Layer,Rect,Stage } from 'react-konva';
import type { Vessel } from "../../../engine/equipment";
import {heightOf} from "../../../engine/connectionLogic";
import { equipmentLibrary } from "../../../engine/equipment";

import { AppearanceLegend } from "./AppearanceLegend";
import { VesselDrawing,useLabPalette } from "./LabVisuals";
export function ObservationLens({v,now,onClose}:{v:Vessel;now:number;onClose:()=>void}){const colors=useLabPalette();const width=Math.min(520,window.innerWidth-72);return <div className="modal-backdrop" onClick={onClose}><div className="modal observation-lens" role="dialog" aria-modal="true" aria-label="Quan sát dụng cụ phóng to" onClick={e=>e.stopPropagation()}><button className="icon-btn close" aria-label="Đóng kính quan sát" onClick={onClose}><X/></button><div className="eyebrow"><ZoomIn size={14}/>GÓC QUAN SÁT / PHÓNG TO 2D</div><h2>{equipmentLibrary.find(t=>t.type===v.type)?.name}</h2><p>Cùng một thí nghiệm, nhìn rõ hơn từng thay đổi.</p><AppearanceLegend v={v} compact/><div className="lens-canvas"><Stage width={width} height={width*430/520}><Layer><Rect width={width} height={width*430/520} fill={colors.wall}/><Group scaleX={width/520} scaleY={width/520}><Group x={260} y={215} scaleX={1.6} scaleY={1.6}><Group rotation={v.rotation||0} offsetY={-heightOf(v.type)/2}><VesselDrawing vessel={{...v,x:0,y:0}} now={now} number={1} selected={false} interactive={false} onSelect={()=>{}} onMove={()=>{}} showLabel={false}/></Group></Group></Group></Layer></Stage></div><p className="lens-note">Thể tích dung dịch: {v.volume} mL / {v.capacity} mL. Hình ảnh được phóng to để quan sát; không thay đổi lượng chất hoặc thời gian diễn họa.</p></div></div>}
