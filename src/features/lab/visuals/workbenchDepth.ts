import type {Vessel} from '../../../engine/equipment';
import {glassGeometry} from './apparatus';
import {utilityGeometry} from './utilityGeometry';

/** Drawing planes only. Neither placement nor camera/model coordinates depend on these. */
export const benchPlanes={back:405,front:495,thickness:16} as const;

/** Project a contact ellipse in world space, outside the object's rotated group. */
export function apparatusContact(v:Vessel){
 const angle=(v.rotation||0)*Math.PI/180;
 if(v.mountedOn||v.type==='tubing'||v.type==='gasJar'&&v.prepared&&Math.cos(angle)<-.8)return null;
 const glass=glassGeometry[v.type],utility=utilityGeometry[v.type];
 if(!glass&&!utility)return null;
 const half=v.type==='alcoholBurner'?39:utility?.half||glass!.half;
 const height=glass?.height||utility!.height;
 const points=glass?.inner||[{x:-half,y:0},{x:half,y:0},{x:half,y:-height},{x:-half,y:-height}];
 const projected=points.map(p=>({x:p.x*Math.cos(angle)-p.y*Math.sin(angle),y:p.x*Math.sin(angle)+p.y*Math.cos(angle)}));
 const bottom=Math.max(...projected.map(p=>p.y));
 const foot=projected.filter(p=>p.y>=bottom-8);
 const x=foot.reduce((sum,p)=>sum+p.x,0)/foot.length;
 const width=Math.max(...foot.map(p=>p.x))-Math.min(...foot.map(p=>p.x));
 return {x:v.x+x,y:v.y+bottom+(glass?7:4),radiusX:Math.max(10,Math.min(half+5,width*.5+5)),radiusY:3};
}
