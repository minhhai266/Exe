import { ChartNoAxesCombined } from 'lucide-react';
export function Stat({label,value,icon:Icon=ChartNoAxesCombined}:{label:string;value:string;icon?:typeof ChartNoAxesCombined}){return <div className="stat"><span className="stat-icon"><Icon size={20}/></span><div><small>{label}</small><strong>{value}</strong></div></div>}
