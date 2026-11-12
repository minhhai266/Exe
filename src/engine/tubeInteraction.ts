import { connectObjects,portPosition } from "./connectionLogic";
import type { Vessel } from "./equipment";
import { simplifyTube } from './tubeGeometry';

export function drawTube(items:Vessel[],id:string,points:{x:number;y:number}[]){
 const tube=items.find(v=>v.id===id);
 if(!tube||tube.type!=='tubing'||points.length<2)return {items,message:'Giữ và kéo để vẽ đường ống.'};
 const clean=simplifyTube(points.slice(0,240));
 if(clean.length<2)return {items,message:'Đường ống cần ít nhất hai điểm hợp lệ.'};
 const first=clean[0],last=clean.at(-1)!;
 const nearest=(p:typeof first,port:'out'|'in')=>items.filter(v=>v.id!==id&&(port==='out'?['flask','roundFlask','tube'].includes(v.type):v.capacity>0)).map(v=>({v,d:Math.hypot(portPosition(v,port).x-p.x,portPosition(v,port).y-p.y)})).filter(x=>x.d<100).sort((a,b)=>a.d-b.d)[0]?.v;
 let from=nearest(first,'out'),to=nearest(last,'in');
 if(!from||!to||from.id===to.id){from=nearest(last,'out');to=nearest(first,'in');if(from&&to)clean.reverse()}
 // Redrawing a linked tube removes its old logical connection first.
 let next=items.map(v=>v.id===tube.tubeShape?.from?{...v,connections:v.connections.filter(x=>x!==tube.tubeShape?.to)}:v);
 next=next.map(v=>v.id===id?{...v,x:0,y:0,tubeShape:{points:clean},mountedOn:undefined}:v);
 if(!from||!to||from.id===to.id)return {items:next,message:'Đã uốn ống. Để nối: kéo từ cổng RA của bình nguồn đến cổng VÀO của bình đích.'};
 const result=connectObjects(next,from.id,to.id);
 if(result.error)return {items:next,message:'Đã uốn ống. '+result.error};
 return {items:result.items.map(v=>v.id===id?{...v,tubeShape:{points:clean,from:from!.id,to:to!.id}}:v),message:'Đã nối ống theo đường bạn kéo. Gắn nút vào bình nguồn để dẫn khí.'};
}
