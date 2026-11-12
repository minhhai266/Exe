import {memo,useId,useMemo} from 'react';
import {definition,type EquipmentType} from '../../../engine/equipment';
import {apparatusMaterial as material,glassGeometry,liquidGeometry,pointPath,volumeMarkings} from '../visuals/apparatus';
import {utilityGeometry} from '../visuals/utilityGeometry';
export {outlines} from '../visuals/apparatus';

/** Shared layered SVG for inventory, educational previews and catalog views. */
export const GlasswareLayers=memo(function GlasswareLayers({type,capacity,volume=0,color='rgba(188,216,229,.4)',rotation=0,markings=true}:{type:EquipmentType;capacity:number;volume?:number;color?:string;rotation?:number;markings?:boolean}){
 const id=useId().replace(/:/g,'');const g=glassGeometry[type]||glassGeometry.beaker!;
 const liquid=useMemo(()=>liquidGeometry(g,volume,capacity,rotation),[g,volume,capacity,rotation]);
 const marks=useMemo(()=>volumeMarkings(g,capacity),[g,capacity]);
 return <g pointerEvents="none" data-apparatus={type}>
  <defs>
   <linearGradient id={`${id}-glass`}>{material.glassStops.filter((_,i)=>i%2===0).map((offset,i)=><stop key={i} offset={offset as number} stopColor={material.glassStops[i*2+1] as string}/>)}</linearGradient>
   <linearGradient id={`${id}-sheen`}><stop stopColor="#ffffff" stopOpacity=".1"/><stop offset=".16" stopColor="#ffffff" stopOpacity=".5"/><stop offset=".3" stopColor="#ffffff" stopOpacity="0"/><stop offset=".88" stopColor="#ffffff" stopOpacity=".05"/><stop offset="1" stopColor="#98bdcc" stopOpacity=".25"/></linearGradient>
   <clipPath id={`${id}-inside`}><path d={pointPath(g.inner)}/></clipPath>
  </defs>
  <ellipse cy="6" rx={g.half+9} ry="5" fill={material.shadow} opacity=".1"/>
  {type==='cylinder'&&<path d="M-40 -3L-29 7H29L40 -3L27 -11H-27Z" fill="#bfd7e0" stroke={material.glassStroke} strokeWidth="1.2"/>}
  <path d={g.path} fill={`url(#${id}-glass)`} stroke={material.glassStroke} strokeWidth="1.4"/>
  <ellipse cy={-g.height} rx={g.rim} ry="3.8" fill="#d3e8f044" stroke={material.glassStroke} strokeWidth="1.2"/>
  <g clipPath={`url(#${id}-inside)`}>
   {volume>0&&<><path d={pointPath(liquid.points)} fill={color}/>{liquid.surface.length===2&&<path d={`M${liquid.surface.map(p=>`${p.x} ${p.y}`).join('L')}`} stroke={material.surface} strokeWidth="1.2"/>}</>}
   <path d={g.path} fill={`url(#${id}-sheen)`}/>
   <path d={g.highlight} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" opacity={material.highlightIntensity}/>
   <path d={g.highlight} transform="translate(7 0)" fill="none" stroke="white" strokeWidth="1" opacity=".4"/>
  </g>
  <path d={g.path} fill="none" stroke={material.glassStroke} strokeWidth="1.2"/>
  <ellipse cy={-g.height+.6} rx={g.rim-1} ry="2.5" stroke="#f4fdff" strokeWidth="1.1" fill="none"/>
  {markings&&marks.map(m=><g key={m.value}><path d={`M${m.edge-(m.major?12:6)} ${m.y}H${m.edge-3}`} stroke={material.marking} strokeWidth={m.major?1:.6}/>{m.major&&type!=='tube'&&<text x={m.edge-15} y={m.y+2.5} textAnchor="end" fill={material.marking} fontSize="7.5" fontFamily="sans-serif">{Math.round(m.value)}</text>}</g>)}
  {markings&&type!=='tube'&&<g textAnchor="middle" fill={material.marking} fontFamily="sans-serif"><text y={type==='flask'?-96:type==='roundFlask'?-86:-g.height+28} fontSize="11" fontWeight="600">{capacity} mL</text><text y={type==='flask'?-111:type==='roundFlask'?-101:-g.height+14} fontSize="6" letterSpacing="1">{type==='cylinder'?'mL':'BORO 3.3'}</text></g>}
 </g>;
});
export const EquipmentIllustration=memo(function EquipmentIllustration({type}:{type:EquipmentType}){
 const id=useId().replace(/:/g,'');const utility=utilityGeometry[type];const g=glassGeometry[type];
 const h=utility?.height||g?.height||193,half=utility?.half||g?.half||69;
 return <svg viewBox={`${-Math.max(half+12,h*.48)} ${-h-12} ${Math.max((half+12)*2,h*.96)} ${h+29}`} className="equipment-sketch" aria-hidden="true" focusable="false" style={{overflow:'visible',pointerEvents:'none'}}>
  <defs><linearGradient id={`${id}-metal`}><stop stopColor="#4c626e"/><stop offset=".25" stopColor="#c4d0d7"/><stop offset=".45" stopColor="#f5f9fb"/><stop offset=".6" stopColor="#91a5b0"/><stop offset="1" stopColor="#435c6a"/></linearGradient><linearGradient id={`${id}-rubber`}><stop stopColor="#27333b"/><stop offset=".35" stopColor="#626e75"/><stop offset="1" stopColor="#273039"/></linearGradient><linearGradient id={`${id}-wood`} x2="0" y2="1"><stop stopColor="#cbb89d"/><stop offset="1" stopColor="#927e63"/></linearGradient><linearGradient id={`${id}-glass`}><stop stopColor="#b3d0dc99"/><stop offset=".3" stopColor="#ffffff88"/><stop offset="1" stopColor="#8cabbc88"/></linearGradient></defs>
  {utility?<><ellipse cy="6" rx={half} ry="4" fill={material.shadow} opacity=".12"/>{utility.paths.map((p,i)=><path key={i} d={p.d} fill={p.fill||(p.material?`url(#${id}-${p.material})`:'none')} stroke={p.stroke||(p.material?material.glassStroke:undefined)} strokeWidth={p.width??1.1} opacity={p.opacity} strokeLinecap="round" strokeLinejoin="round"/>)}</>:<GlasswareLayers type={type} capacity={definition(type).capacity}/>}
 </svg>;
});
