import type { Vessel } from './equipment';
import { estimatePH } from './visualModel';

export function litmusColor(v:Vessel):'red'|'blue'|'purple'|undefined{
  const ph=estimatePH(v.contents,v.volume);
  return ph===undefined?undefined:ph<5?'red':ph>8?'blue':'purple';
}
export function testLitmus(items:Vessel[],vesselId:string){
  const target=items.find(v=>v.id===vesselId),paper=items.find(v=>v.type==='litmusPaper'&&!v.mountedOn&&!v.litmusResult);
  if(!target||target.volume<=0||target.sealed)return {items,error:'Chọn dụng cụ có dung dịch và tháo nút trước khi thử quỳ.'};
  if(!paper)return {items,error:'Thêm một mẩu giấy quỳ tím mới từ Tiện ích.'};
  const result=litmusColor(target);
  if(!result)return {items,error:'Quỳ tím hiện chỉ áp dụng hệ HCl / NaOH / NaCl trong mô hình.'};
  const label=result==='red'?'đỏ (axit)':result==='blue'?'xanh (bazơ)':'tím (gần trung tính)';
  return {items:items.map(v=>v.id===paper.id?{...v,mountedOn:target.id,x:target.x,y:target.y-25,litmusResult:result}:v.id===target.id?{...v,litmusResult:result}:v),message:'Quỳ tím chuyển '+label+'.',error:undefined};
}
