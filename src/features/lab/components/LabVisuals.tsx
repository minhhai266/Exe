import { memo,useEffect,useMemo,useState } from 'react';
import { Ellipse,Group,Line,Path,Rect,Shape,Text } from 'react-konva';
import {ReactionEffectLayers} from './ReactionEffectLayers';
import { mixtureAppearance } from '../../../engine/appearance';
import { definition,type Vessel } from '../../../engine/equipment';
import { visualContents,visualProgress } from '../../../engine/visualModel';
import {benchPlanes} from '../visuals/workbenchDepth';
import {apparatusMaterial as material,glassGeometry,liquidGeometry,pointPath,volumeMarkings} from '../visuals/apparatus';
export function useLabPalette(){return useMemo(()=>{const styles=getComputedStyle(document.documentElement);const token=(key:string)=>styles.getPropertyValue(key).trim();return {wall:token('--lab-wall'),wallBottom:token('--lab-wall-bottom'),grid:token('--lab-grid'),bench:token('--lab-bench'),benchFront:token('--lab-bench-front'),edge:token('--lab-bench-edge'),primary:token('--brand-primary'),primaryDark:token('--brand-primary-active'),selected:token('--bg-selected'),surface:token('--bg-surface'),border:token('--border-default'),primaryLight:token('--brand-primary-light'),muted:token('--text-secondary')}},[])}

export function useReducedMotion(){
 const [reduced,setReduced]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 return reduced;
}
export function useAnimationClock(active=true){
 const [now,setNow]=useState(Date.now());const reduced=useReducedMotion();
 useEffect(()=>{setNow(Date.now());if(!active)return;let frame:number;let previous=0;const update=(time:number)=>{if(time-previous>(reduced?250:40)){setNow(Date.now());previous=time}frame=requestAnimationFrame(update)};frame=requestAnimationFrame(update);return ()=>cancelAnimationFrame(frame)},[active,reduced]);
 return now;
}
export function VesselDrawing({vessel:v,selected,number,onSelect,onMove,now,scale=1,interactive=true,showLabel=true,moving=false,hovered=false,showShadow=true}:{vessel:Vessel;selected:boolean;number:number;onSelect:()=>void;onMove:(x:number,y:number)=>void;now:number;scale?:number;interactive?:boolean;showLabel?:boolean;moving?:boolean;hovered?:boolean;showShadow?:boolean}){
 const colors=useLabPalette();const reduced=useReducedMotion();const g=glassGeometry[v.type]||glassGeometry.beaker!;
 const {half,height}=g;
 const p=visualProgress(v,now),contents=visualContents(v,p),active=!!v.gasReceiving||(v.reaction?v.reaction.status==='running':!!v.animation&&p<1);
 const slosh=moving&&!reduced?Math.sin(Date.now()/180)*1.2:0;
 const liquid=useMemo(()=>liquidGeometry(g,v.volume,v.capacity,(v.rotation||0)+slosh),[g,v.volume,v.capacity,v.rotation,slosh]);
 const markings=useMemo(()=>volumeMarkings(g,v.capacity),[g,v.capacity]);
 const upright=useMemo(()=>liquidGeometry(g,v.volume,v.capacity),[g,v.volume,v.capacity]);
 const liquidHeight=upright.depth,top=upright.level;
 const inverted=v.type==='gasJar'&&Math.cos((v.rotation||0)*Math.PI/180)<-.8;
 const {liquidColor}=mixtureAppearance(contents,v.volume);
 const added=!!v.lastAddition&&now-v.lastAddition.startedAt<1000&&v.volume>0;
 return <Group x={v.x} y={v.y} draggable={interactive} onClick={onSelect} onTap={onSelect} onDragStart={onSelect} dragBoundFunc={pos=>({x:Math.max(80*scale,Math.min(740*scale,pos.x)),y:Math.max(220*scale,Math.min(405*scale,pos.y))})} onDragEnd={event=>onMove(event.target.x(),event.target.y())}>
  <Path data={g.path} fill="#ffffff01"/>
  <Group listening={false}>
   {showShadow&&<Ellipse y={7} rotation={-(v.rotation||0)} radiusX={half+9} radiusY={5} fill={material.shadow} opacity={.12} shadowColor={material.shadow} shadowBlur={material.shadowBlur} shadowOpacity={.18}/>}
   {(selected||hovered)&&<Path data={g.path} stroke={colors.primary} strokeWidth={selected?3:2.5} opacity={selected?0.3:0.18} lineJoin="round"/>}
   {v.type==='cylinder'&&<><Path data="M-40 -3L-29 7H29L40 -3L27 -11H-27Z" fill="#b3ccd7" stroke={material.glassStroke} strokeWidth={1}/><Ellipse y={-5} radiusX={39} radiusY={7} fill="#e8f4f9bb" stroke={material.glassInner} strokeWidth={1}/></>}
   <Path data={g.path} fillLinearGradientStartPoint={{x:-half,y:0}} fillLinearGradientEndPoint={{x:half,y:0}} fillLinearGradientColorStops={material.glassStops} stroke={material.glassStroke} strokeWidth={1.25}/>
   <Ellipse y={-height} radiusX={g.rim} radiusY={3.8} fill="#c2d9e344" stroke={material.glassStroke} strokeWidth={1.1}/>
   <Group clipFunc={ctx=>{ctx.beginPath();g.inner.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath()}}>
    {v.volume>0&&<>
     <Path data={pointPath(liquid.points)} fill={liquidColor}/>
     <Path data={pointPath(liquid.points)} fillLinearGradientStartPoint={{x:-half,y:0}} fillLinearGradientEndPoint={{x:half,y:0}} fillLinearGradientColorStops={[0,'#194d7029',.22,'#ffffff28',.55,'#ffffff00',1,'#194d7038']}/>
     {liquid.surface.length===2&&<><Ellipse x={(liquid.surface[0].x+liquid.surface[1].x)/2} y={(liquid.surface[0].y+liquid.surface[1].y)/2} radiusX={Math.hypot(liquid.surface[1].x-liquid.surface[0].x,liquid.surface[1].y-liquid.surface[0].y)/2} radiusY={2} rotation={-(v.rotation||0)-slosh} fill={liquidColor} stroke={material.surface} strokeWidth={.65} opacity={.75}/><Line points={liquid.surface.flatMap(q=>[q.x,q.y-1.3])} stroke="#ffffff" strokeWidth={1.2} opacity={.75}/></>}
    </>}
    {(contents.Ag||0)>1e-9&&<Path data={g.path} strokeLinearGradientStartPoint={{x:-half,y:0}} strokeLinearGradientEndPoint={{x:half,y:0}} strokeLinearGradientColorStops={[0,'#667d89',.3,'#e8f0f3',.55,'#a2b6c1',.85,'#f7fbfc',1,'#7e929e']} strokeWidth={8} opacity={Math.min(.95,(contents.Ag||0)*150)} fill="#d5e0e722"/>}
    <Group clipFunc={v.volume>0?ctx=>{ctx.beginPath();liquid.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath()}:undefined}>
     <ReactionEffectLayers v={v} now={now} half={half} height={height} liquidHeight={liquidHeight} top={top} inverted={inverted} active={active} motion={!reduced}/>
    </Group>
    <Path data={g.path} fillLinearGradientStartPoint={{x:-half,y:0}} fillLinearGradientEndPoint={{x:half,y:0}} fillLinearGradientColorStops={[0,'#ffffff12',.12,'#ffffff60',.23,'#ffffff00',.8,'#ffffff00',.93,'#ffffff30',1,'#82afc020']}/>
    <Path data={g.highlight} stroke={material.highlight} strokeWidth={4} opacity={material.highlightIntensity} lineCap="round" lineJoin="round"/>
    <Path data={g.highlight} x={7} stroke={material.highlight} strokeWidth={1.1} opacity={.32} lineCap="round"/>
   </Group>
   <Path data={g.path} stroke={material.glassStroke} strokeWidth={1.15}/>
   <Ellipse y={-height+.7} radiusX={g.rim-1} radiusY={2.6} stroke="#f4fdff" strokeWidth={1.1} opacity={.9}/>
   {v.type!=='roundFlask'&&<Ellipse y={-4} radiusX={v.type==='tube'?11:v.type==='flask'?52:half-12} radiusY={2.3} stroke="#a5c1cc" strokeWidth={1} opacity={.7}/>}
   {markings.filter(m=>v.type!=='tube'||m.major).map(m=><Group key={m.value}><Line points={[m.edge-(m.major?12:6),m.y,m.edge-3,m.y]} stroke={material.marking} strokeWidth={m.major?1:.65} opacity={.8}/>{m.major&&v.type!=='tube'&&<Text x={m.edge-37} y={m.y-4} width={22} align="right" text={String(Math.round(m.value))} fontSize={7.5} fill={material.marking}/>}</Group>)}
   {v.type!=='tube'&&<><Text x={-half+8} y={v.type==='flask'?-96:v.type==='roundFlask'?-86:-height+28} width={half*2-16} text={`${v.capacity} mL`} align="center" fontSize={v.type==='cylinder'?8:11} fill={material.marking} fontStyle="bold"/><Text x={-half+8} y={v.type==='flask'?-111:v.type==='roundFlask'?-101:-height+14} width={half*2-16} text={v.type==='cylinder'?'mL':'BORO 3.3'} align="center" fontSize={6} letterSpacing={1} fill={material.marking} opacity={.7}/></>}
   {added&&<Group><Path data={`M0 ${-height-35}Q-5 ${-height-23} 0 ${-height-20}Q5 ${-height-23} 0 ${-height-35}`} fill={liquidColor} stroke="#7399aa" strokeWidth={.7}/></Group>}
   {showLabel&&<Group><Rect x={-half-8} y={15} width={half*2+16} height={31} cornerRadius={6} fill={selected?colors.selected:colors.surface} stroke={selected?colors.primaryLight:colors.border} strokeWidth={1}/><Text x={-half-5} y={23} width={half*2+10} text={`${number.toString().padStart(2,'0')} · ${definition(v.type).name.toUpperCase()}`} fontSize={half<30?7:8} align="center" fill={selected?colors.primaryDark:colors.muted} fontStyle="bold"/></Group>}
  </Group>
 </Group>;
}
export const BenchBackdrop=memo(function BenchBackdrop({width=1000,height=540,wallColor}:{width?:number;height?:number;wallColor?:string}){
 const colors=useLabPalette();const {back,front,thickness}=benchPlanes;
 return <Group listening={false}>
  <Rect x={-2000} y={-2000} width={width+4000} height={height+4000} fill={wallColor||colors.wall}/>
  <Shape sceneFunc={(ctx,shape)=>{ctx.beginPath();for(let y=20;y<back;y+=25)for(let x=20;x<width;x+=25){ctx.moveTo(x+1,y);ctx.arc(x,y,.65,0,Math.PI*2)}ctx.fillStrokeShape(shape)}} fill={colors.grid} opacity={.65}/>
  <Rect x={-2000} y={back} width={width+4000} height={front-back} fill={colors.bench}/>
  <Line points={[-2000,back,width+2000,back]} stroke={colors.edge} strokeWidth={.8} opacity={.55}/>
  <Line points={[-2000,back+1,width+2000,back+1]} stroke="#ffffff" strokeWidth={.8} opacity={.3}/>
  <Rect x={-2000} y={front} width={width+4000} height={thickness} fill={colors.benchFront}/>
  <Line points={[-2000,front,width+2000,front]} stroke="#f5f4ef" strokeWidth={1} opacity={.45}/>
  <Line points={[-2000,front+thickness,width+2000,front+thickness]} stroke="#7e786e" strokeWidth={1} opacity={.17}/>
  <Text x={25} y={443} text="Kéo để di chuyển · Chạm để kiểm tra" fontSize={8} fill={colors.muted} opacity={.8}/>
 </Group>;
});
