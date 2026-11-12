import { portPosition } from './connectionLogic';
import type { Vessel,TubeShape } from './equipment';
export type Point={x:number;y:number};
/** Keep the first/last anchors and simplify only sub-pixel hand jitter. */
export function simplifyTube(points:Point[],tolerance=3):Point[]{
 const clean=points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));if(clean.length<3)return clean;
 const a=clean[0],b=clean.at(-1)!,dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
 let index=0,max=0;for(let i=1;i<clean.length-1;i++){const p=clean[i],t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;const d=Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);if(d>max){max=d;index=i}}
 return max>tolerance?[...simplifyTube(clean.slice(0,index+1),tolerance).slice(0,-1),...simplifyTube(clean.slice(index),tolerance)]:[a,b];
}
/** Distribute endpoint displacement along the hose, avoiding a jump at either port. */
export function anchoredTube(shape:TubeShape,items:Vessel[]):Point[]{
 const points=shape.points;if(points.length<2)return points;
 const first=points[0],last=points.at(-1)!,source=items.find(v=>v.id===shape.from),target=items.find(v=>v.id===shape.to);
 const a=source?portPosition(source,'out'):first,b=target?portPosition(target,'in'):last;
 const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
 const length=distances.at(-1)||1;
 return points.map((p,i)=>{const t=distances[i]/length;return {x:p.x+(a.x-first.x)*(1-t)+(b.x-last.x)*t,y:p.y+(a.y-first.y)*(1-t)+(b.y-last.y)*t}});
}
export function moveTubeBend(items:Vessel[],tubeId:string,index:number,point:Point){return items.map(v=>{if(v.id!==tubeId||!v.tubeShape||index<=0||index>=v.tubeShape.points.length-1)return v;const points=anchoredTube(v.tubeShape,items);points[index]=point;return {...v,tubeShape:{...v.tubeShape,points}}})}
