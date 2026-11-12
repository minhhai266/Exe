import {testLitmus} from './litmus';
import { definition,isContainer,type Vessel } from "./equipment";
export type Port='out'|'in';
export interface ConnectionPort{id:string;ownerId:string;type:'gas-out'|'gas-in';position:{x:number;y:number};direction:number;compatible:('gas-out'|'gas-in')[];occupied:boolean}
export function portsOf(v:Vessel):Port[]{return v.catalogPorts?v.catalogPorts.map(p=>p.type==='gas-out'?'out':'in'):(['flask','roundFlask','tube'].includes(v.type)?['out','in']:isContainer(v)?['in']:[])}
export function connectionPorts(v:Vessel,items:Vessel[]):ConnectionPort[]{return portsOf(v).map(p=>({id:v.id+':'+p,ownerId:v.id,type:p==='out'?'gas-out':'gas-in',position:portPosition(v,p as Port),direction:(v.rotation||0)+(v.catalogPorts?.find(c=>c.type===(p==='out'?'gas-out':'gas-in'))?.direction??-90),compatible:p==='out'?['gas-in']:['gas-out'],occupied:p==='out'?!!v.connections.length:items.some(s=>s.connections.includes(v.id))}))}
function descendant(items:Vessel[],child:string,parent:string){const seen=new Set<string>();let current=items.find(v=>v.id===child);while(current?.mountedOn&&!seen.has(current.id)){seen.add(current.id);if(current.mountedOn===parent)return true;current=items.find(v=>v.id===current!.mountedOn)}return false}
export function heightOf(type:Vessel['type']){return ({flask:193,roundFlask:190,tube:181,cylinder:190,gasJar:175,beaker:164,waterBath:140} as Partial<Record<Vessel['type'],number>>)[type]||80}
export function portPosition(v:Vessel,port:Port){const custom=v.catalogPorts?.find(p=>p.type===(port==='out'?'gas-out':'gas-in'));const x=custom?.x??(port==='out'?14:-14),y=custom?.y??-heightOf(v.type),r=(v.rotation||0)*Math.PI/180;return {x:v.x+x*Math.cos(r)-y*Math.sin(r),y:v.y+x*Math.sin(r)+y*Math.cos(r)}}
export function mouthPosition(v:Vessel){const r=(v.rotation||0)*Math.PI/180,h=heightOf(v.type)-5;return {x:v.x+h*Math.sin(r),y:v.y-h*Math.cos(r)}}
export function connectionError(source:Vessel|undefined,target:Vessel|undefined,from:Port='out',to:Port='in'){
 if(!source||!target)return 'Cổng kết nối không còn tồn tại.';
 if(!portsOf(source).includes(from)||!portsOf(target).includes(to))return 'Dụng cụ không có cổng nối được yêu cầu.';
 if(source.id===target.id)return 'Không nối hai cổng của cùng một dụng cụ.';
 if(from!=='out'||to!=='in')return 'Chỉ nối cổng RA với cổng VÀO.';
 if(!['flask','roundFlask','tube'].includes(source.type)||!isContainer(target))return 'Cổng của hai dụng cụ không tương thích.';
 if(source.connections.includes(target.id))return 'Hai dụng cụ đã được nối.';
 return undefined;
}
export function connectObjects(items:Vessel[],sourceId:string,targetId:string){const source=items.find(v=>v.id===sourceId),target=items.find(v=>v.id===targetId);const error=connectionError(source,target);if(error)return {items,error};if(items.some(v=>v.connections.includes(targetId)))return {items,error:'Cổng vào đã có ống nối. Hãy tháo ống cũ trước.'};if(source!.connections.length)return {items,error:'Cổng ra chỉ hỗ trợ một ống dẫn trong MVP.'};return {items:items.map(v=>v.id===sourceId?{...v,connections:[...v.connections,targetId]}:v),error:undefined}}
export function gasDestination(source:Vessel,items:Vessel[],gas?:import('./chemicals').ChemicalId){
 if(!source.sealed)return {reason:'Khí sinh ra đang thoát ra ngoài do hệ thống chưa kín.'};
 const dest=items.find(v=>source.connections.includes(v.id));
 if(!dest)return {reason:'Nút có lỗ nhưng chưa có đường dẫn; khí đang thoát ra ngoài.'};
 if(gas==='CO2'&&dest.type!=='gasJar'&&dest.volume>0&&!dest.sealed)return {dest,absorbing:true,reason:'CO₂ được dẫn vào dung dịch trong bình đích; quan sát phản ứng tại bình đích.'};
 const angle=((dest.rotation||0)%360+360)%360;
 if(dest.type!=='gasJar'||!dest.prepared||Math.abs(angle-180)>15)return {reason:'Khí chưa được thu: cần bình thu đầy nước và đảo 180°.'};
 if((dest.gasVolume||0)>=dest.capacity-1e-6)return {reason:'Bình thu đã đầy; khí tiếp tục sinh ra sẽ thoát ra ngoài.'};
 return {dest,absorbing:false,reason:'Khí đang đi qua ống dẫn và đẩy nước trong bình thu.'};
}
function placementResult(items:Vessel[],message:string){return {items:items.map(v=>isContainer(v)?{...v,sealed:items.some(c=>c.type==='stopper'&&c.mountedOn===v.id)}:v),message}}
export function placeObject(items:Vessel[],id:string,x:number,y:number){
 const object=items.find(v=>v.id===id)!;let next=items.map(v=>v.id===id?{...v,x,y,mountedOn:undefined,slot:undefined}:v);
 const dx=x-object.x,dy=y-object.y;const shift=(parent:string)=>{for(const child of items.filter(v=>v.mountedOn===parent)){next=next.map(v=>v.id===child.id?{...v,x:v.x+dx,y:v.y+dy}:v);shift(child.id)}};shift(id);
 let message='Đã di chuyển '+definition(object.type).name;
 if(object.type==='litmusPaper'){
  if(object.litmusResult)return placementResult(next,'Mẩu quỳ này đã dùng. Thêm mẩu giấy mới từ Tiện ích.');
  const target=next.find(v=>v.id!==id&&isContainer(v)&&v.volume>0&&Math.abs(v.x-x)<90&&Math.abs(v.y-y)<190);
  if(target){const fresh=[next.find(v=>v.id===id)!,...next.filter(v=>v.id!==id)];const tested=testLitmus(fresh,target.id);return {items:tested.items,message:tested.error||tested.message||'Đã thử quỳ tím.'}}
 }
 if(['tube','roundFlask'].includes(object.type)){
  const bath=next.find(v=>v.type==='waterBath'&&v.volume>0&&Math.abs(v.x-x)<90&&Math.abs(v.y-y)<180);
  if(bath&&!next.some(v=>v.mountedOn===bath.id&&isContainer(v)))return placementResult(next.map(v=>v.id===id?{...v,mountedOn:bath.id,x:bath.x,y:bath.y-12}:v),'Đã đặt dụng cụ vào bể cách thủy.');
 }
 if(['stopper','funnel','thermometer'].includes(object.type)){
  const parent=next.filter(v=>v.id!==id&&isContainer(v)&&Math.hypot(portPosition(v,'out').x-x,portPosition(v,'out').y-y)<120).sort((a,b)=>Math.hypot(portPosition(a,'out').x-x,portPosition(a,'out').y-y)-Math.hypot(portPosition(b,'out').x-x,portPosition(b,'out').y-y))[0];
  if(parent){if((object.type==='stopper'||object.type==='funnel')&&!['flask','roundFlask','tube'].includes(parent.type))return placementResult(next,'Dụng cụ này chỉ gắn vào cổ bình hoặc ống nghiệm.');if(next.some(v=>v.mountedOn===parent.id&&['stopper','funnel'].includes(v.type)&&['stopper','funnel'].includes(object.type)))return placementResult(next,'Miệng bình đã có nút hoặc phễu.');const p=mouthPosition(parent);next=next.map(v=>v.id===id?{...v,mountedOn:parent.id,x:p.x,y:p.y,rotation:parent.rotation||0}:v.id===parent.id&&object.type==='stopper'?{...v,sealed:true}:v);message='Đã gắn '+definition(object.type).name+' vào '+definition(parent.type).name;}
 }else if(isContainer(object)||object.type==='clamp'){
  const support=next.filter(v=>v.id!==id&&!descendant(next,v.id,id)&&['stand','clamp','rack','tripod'].includes(v.type)).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x)).find(v=>Math.abs(v.x-x)<85&&Math.abs(v.y-y)<190);
  if(support){if(object.type==='clamp'&&support.type!=='stand')return placementResult(next,'Kẹp cần được gắn trực tiếp lên giá đỡ.');let slot=0,sx=support.x+45,sy=object.type==='clamp'?support.y-190:support.y-75;
   if(support.type==='rack'){if(object.type!=='tube')return placementResult(next,'Giá ống nghiệm chỉ nhận ống nghiệm.');const used=next.filter(v=>v.mountedOn===support.id).map(v=>v.slot);slot=[0,1,2].filter(n=>!used.includes(n)).sort((a,b)=>Math.abs(support.x-45+a*45-x)-Math.abs(support.x-45+b*45-x))[0];if(slot===undefined)return placementResult(next,'Giá đã đủ ba ống nghiệm.');sx=support.x-45+slot*45;sy=support.y-15;
   }else if(support.type==='tripod'){if(!['beaker','flask','roundFlask','waterBath'].includes(object.type))return placementResult(next,'Chân đế này chỉ đỡ cốc và bình.');sx=support.x;sy=support.y-105;
   }else if(support.type==='clamp'){sx=support.x+25;sy=support.y+95}else if(!definition(object.type).mountable&&object.type!=='clamp')return placementResult(next,'Dụng cụ này không phù hợp để gắn lên giá.');
   next=next.map(v=>v.id===id?{...v,x:sx,y:sy,mountedOn:support.id,slot,rotation:support.type==='rack'?0:support.rotation||0}:v);message='Đã gắn '+definition(object.type).name+' lên '+definition(support.type).name;
  }
 }
 // Mounted children follow the final snapped position, not just the raw drop point.
 const final=next.find(v=>v.id===id)!;const correction={x:final.x-x,y:final.y-y};
 if(correction.x||correction.y)next=next.map(v=>v.id!==id&&descendant(next,v.id,id)?{...v,x:v.x+correction.x,y:v.y+correction.y}:v);
 // A removed stopper must never leave a logically sealed vessel.
 next=next.map(v=>isContainer(v)?{...v,sealed:next.some(c=>c.type==='stopper'&&c.mountedOn===v.id)}:v);
 return {items:next,message};
}
export function placementError(v:Vessel){return ['tube','roundFlask'].includes(v.type)&&!v.mountedOn?'Dụng cụ đáy tròn cần được gắn vào giá hoặc kẹp trước.':undefined}
