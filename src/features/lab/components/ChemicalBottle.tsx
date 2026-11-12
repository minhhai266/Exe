import {useId} from 'react';
import { mixtureAppearance } from "../../../engine/appearance";
import { chemicals,type ChemicalId } from "../../../engine/chemicals";

/** Bottle label accents identify categories; the sample itself keeps its real appearance. */
export function ChemicalBottle({id}:{id:ChemicalId}){
 const uid=useId().replace(/:/g,'');
 const c=chemicals[id],solid=['rắn','kết tủa'].includes(c.phase);
 const accent=solid?'#f59e0b':id==='CuSO4'?'#2586ee':id==='NaOH'?'#8b5cf6':id==='indicator'?'#ec4899':'#0aa7b5';
 const color=solid?c.color:mixtureAppearance({[id]:.01},10).liquidColor;
 return <svg className="cute-bottle" viewBox="0 0 64 84" aria-hidden="true">
  <defs><linearGradient id={uid+'-glass'}><stop stopColor="#9fb9c988"/><stop offset=".18" stopColor="#ffffffbb"/><stop offset=".48" stopColor="#f6fbff44"/><stop offset="1" stopColor="#91b4c588"/></linearGradient><linearGradient id={uid+'-cap'}><stop stopColor="#334957"/><stop offset=".4" stopColor="#899ca5"/><stop offset="1" stopColor="#2e4351"/></linearGradient></defs>
  <ellipse cx="32" cy="78" rx="24" ry="4" fill={accent} opacity=".12"/>
  <rect x="22" y="5" width="20" height="12" rx="2" fill={"url(#"+uid+"-cap)"}/>
  <path d="M25 17H39V24Q51 27 51 38V68Q51 75 44 75H20Q13 75 13 68V38Q13 27 25 24Z" fill={"url(#"+uid+"-glass)"} stroke="#597585" strokeWidth="1.1"/>
  <path d="M16 45H48V67Q48 72 43 72H21Q16 72 16 67Z" fill={color}/>
  {solid&&[22,29,36,43,25,34,40].map((x,i)=><circle key={i} cx={x} cy={66-i%3*4} r="2.2" fill={c.color} stroke="#73859a" strokeWidth=".35"/>)}
  <path d="M20 36V45" stroke="white" strokeWidth="4" strokeLinecap="round"/>
  <rect x="10" y="39" width="44" height="20" rx="6" fill="white" stroke={accent} strokeWidth="1"/>
  <text x="32" y="52" fontFamily="sans-serif" fontSize={c.formula.length>6?8:10} fontWeight="700" textAnchor="middle" fill={accent}>{c.formula}</text>
  <path d="M19 60V66Q19 69 22 69" stroke="#ffffff" strokeWidth="2" opacity=".7" fill="none"/>
  <path d="M24 9H40M24 12H40" stroke="#c4d1d8" strokeWidth=".6" opacity=".6"/>
 </svg>;
}
