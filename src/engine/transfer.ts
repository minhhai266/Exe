import { chemicals,type ChemicalId } from "./chemicals";
import { isContainer,type Vessel } from "./equipment";

/** Decant liquid proportionally. Settled solids and gases stay in their vessel. */
export function transferLiquid(items:Vessel[],sourceId:string,targetId:string,volume:number,now=Date.now()):{items:Vessel[];error?:string}{
 const source=items.find(v=>v.id===sourceId),target=items.find(v=>v.id===targetId);
 const fail=(error:string)=>({items,error});
 if(!source||!target||source===target||!isContainer(source)||!isContainer(target)||source.type==='gasJar'||target.type==='gasJar')return fail('Chọn hai dụng cụ chứa dung dịch khác nhau; bình thu khí không dùng để rót.');
 if(!Number.isFinite(volume)||volume<=0)return fail('Nhập thể tích rót lớn hơn 0 mL.');
 if(source.sealed||target.sealed)return fail('Tháo nút của cả hai bình trước khi rót.');
 if(source.reaction?.status==='running'||target.reaction?.status==='running')return fail('Tạm dừng phản ứng ở cả hai bình trước khi rót.');
 if(volume>source.volume+1e-9)return fail('Bình nguồn không đủ dung dịch. Hãy giảm thể tích cần rót.');
 if(volume+target.volume>target.capacity+1e-9)return fail('Bình đích không đủ chỗ. Hãy giảm lượng rót hoặc chọn bình lớn hơn.');
 const fraction=volume/source.volume,from={...source.contents},to={...target.contents};
 for(const key of Object.keys(from) as ChemicalId[]){
  if(['rắn','kết tủa','khí'].includes(chemicals[key].phase))continue;
  const moved=(from[key]||0)*fraction;
  from[key]=Math.max(0,(from[key]||0)-moved);to[key]=(to[key]||0)+moved;
 }
 const temperature=((source.temperature??25)*volume+(target.temperature??25)*target.volume)/(volume+target.volume);
 return {items:items.map(v=>v===source?{...v,contents:from,volume:Math.max(0,v.volume-volume),reaction:undefined,animation:undefined,effect:undefined,transfer:{targetId,startedAt:now}}:v===target?{...v,contents:to,volume:Math.min(v.capacity,v.volume+volume),temperature,reaction:undefined,animation:undefined,effect:undefined}:v)};
}
