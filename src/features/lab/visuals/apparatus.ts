import type { EquipmentType } from '../../../engine/equipment';

/** Shared SVG / Canvas materials. Geometry retains existing attachment coordinates. */
export const apparatusMaterial = {
 glassStroke:'#7396A8', glassInner:'#a9c3ce', glassOpacity:.72,
 glassStops:[0,'#aac7d580',.08,'#f4fcffa8',.24,'#ffffff25',.64,'#d4e8ee12',.87,'#b3d0dc50',1,'#6e9dac80'] as (number|string)[],
 highlight:'#ffffff', highlightIntensity:.82, reflectionIntensity:.18,
 shadow:'#233f53', shadowBlur:7, metal:'#728492', metalDark:'#344550',
 rubber:'#343c43', marking:'#405f70', surface:'#6b9caa',
};
export type Point={x:number;y:number};
export interface GlassGeometry {path:string;inner:Point[];half:number;height:number;rim:number;highlight:string}
const profile=(rows:number[][]):Point[]=>[
 ...rows.map(([y,w])=>({x:-w,y})),...rows.slice().reverse().map(([y,w])=>({x:w,y})),
];
export const glassGeometry:Partial<Record<EquipmentType,GlassGeometry>>={
 flask:{path:'M-23 -193Q0 -198 23 -193L23 -126L67 -16Q75 0 55 0L-55 0Q-75 0 -67 -16L-23 -126Z',inner:profile([[-190,19],[-126,19],[-16,63],[-8,64],[-4,54]]),half:69,height:193,rim:25,highlight:'M-15 -180L-15 -127L-50 -35Q-57 -20 -51 -13'},
 beaker:{path:'M-61 -164L-52 -155L-52 -13Q-52 0 -39 0H39Q53 0 53 -13L53 -158L58 -164Q4 -171 -61 -164Z',inner:profile([[-161,48],[-15,48],[-5,40]]),half:55,height:164,rim:56,highlight:'M-43 -149V-25Q-43 -13 -35 -12'},
 tube:{path:'M-23 -181Q0 -186 23 -181V-25Q23 0 0 0Q-23 0 -23 -25Z',inner:profile([[-178,19],[-25,19],[-15,16],[-7,10],[-4,0]]),half:23,height:181,rim:25,highlight:'M-14 -167V-29Q-14 -16 -6 -12'},
 cylinder:{path:'M-24 -190Q0 -195 24 -190V-12Q24 -2 14 -2H-14Q-24 -2 -24 -12Z',inner:profile([[-187,20],[-13,20],[-6,14]]),half:25,height:190,rim:27,highlight:'M-15 -176V-21'},
 gasJar:{path:'M-48 -175Q0 -181 48 -175V-12Q48 0 36 0H-36Q-48 0 -48 -12Z',inner:profile([[-171,44],[-14,44],[-5,35]]),half:49,height:175,rim:50,highlight:'M-37 -159V-24Q-37 -12 -29 -11'},
 roundFlask:{path:'M-19 -190Q0 -195 19 -190V-126A64 64 0 1 1 -19 -126Z',inner:[{x:-15,y:-187},{x:15,y:-187},{x:15,y:-124},...Array.from({length:57},(_,i)=>{const a=-Math.acos(15/60)+i*(Math.PI+2*Math.acos(15/60))/56;return{x:Math.cos(a)*60,y:-65+Math.sin(a)*60}}),{x:-15,y:-124}],half:65,height:190,rim:22,highlight:'M-11 -178V-129M-34 -111Q-62 -80 -44 -42'},
};
glassGeometry.waterBath={...glassGeometry.beaker!,half:85,rim:85,path:'M-90 -140H90V-12Q90 0 78 0H-78Q-90 0 -90 -12Z',height:140,inner:[{x:-85,y:-136},{x:85,y:-136},{x:85,y:-5},{x:-85,y:-5}],highlight:'M-78 -126V-20'};
export const outlines=Object.fromEntries(Object.entries(glassGeometry).map(([key,value])=>[key,value!.path])) as Partial<Record<EquipmentType,string>>;
export function polygonArea(points:Point[]){return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y},0))/2}
function clipBelow(points:Point[],level:number):Point[]{
 const result:Point[]=[];
 points.forEach((p,i)=>{const q=points[(i+1)%points.length],a=p.y>=level,b=q.y>=level;if(a)result.push(p);if(a!==b){const f=(level-p.y)/(q.y-p.y);result.push({x:p.x+(q.x-p.x)*f,y:level})}});
 return result;
}
/** Read-only area projection, memoized by callers; it never changes stored volume. */
export function liquidGeometry(geometry:GlassGeometry,volume:number,capacity:number,rotation=0){
 const angle=rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const world=geometry.inner.map(p=>({x:p.x*c-p.y*s,y:p.x*s+p.y*c}));
 const min=Math.min(...world.map(p=>p.y)),max=Math.max(...world.map(p=>p.y));
 const ratio=capacity>0?Math.max(0,Math.min(1,volume/capacity)):0;
 const targetArea=polygonArea(world)*ratio;let lo=min,hi=max;
 for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(polygonArea(clipBelow(world,mid))>targetArea)lo=mid;else hi=mid}
 const level=(lo+hi)/2,worldFill=ratio>0?clipBelow(world,level):[];
 const toLocal=(p:Point)=>({x:p.x*c+p.y*s,y:-p.x*s+p.y*c});
 const surface=worldFill.filter(p=>Math.abs(p.y-level)<1e-5).sort((a,b)=>a.x-b.x);
 return {points:worldFill.map(toLocal),surface:surface.length>=2?[toLocal(surface[0]),toLocal(surface[surface.length-1])]:[],level,depth:max-level};
}
export const pointPath=(points:Point[])=>points.length?'M'+points.map(p=>`${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join('L')+'Z':'';
export function volumeMarkings(geometry:GlassGeometry,capacity:number){
 return Array.from({length:9},(_,i)=>{const fraction=(i+1)/10;const fill=liquidGeometry(geometry,fraction,1);const intersections=fill.surface;return {value:capacity*fraction,y:fill.level,edge:intersections.length?Math.max(...intersections.map(p=>p.x)):geometry.half-5,major:(i+1)%2===0}});
}
