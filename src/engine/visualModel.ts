import type { Contents } from "./chemicals";
import type { Vessel } from "./equipment";
export const ANIMATION_MS=6500;
export function visualProgress(v:Vessel,now=Date.now()) {if(v.reaction)return Math.min(1,v.reaction.extent/Math.max(1e-12,v.reaction.target));return v.animation?Math.min(1,Math.max(0,(now-v.animation.startedAt)/ANIMATION_MS)):1;}
export function visualContents(v:Vessel,progress:number):Contents {
 if(v.reaction||!v.animation)return v.contents;
 const before=v.animation.before;const out:Contents={};
 for(const id of new Set([...Object.keys(before),...Object.keys(v.contents)])){
  const key=id as keyof Contents;out[key]=(before[key]||0)*(1-progress)+(v.contents[key]||0)*progress;
 }return out;
}
export function estimatePH(contents:Contents,volumeML:number):number|undefined {
 if(volumeML<=0||Object.entries(contents).some(([id,n])=>n!>1e-9&&!['HCl','NaOH','NaCl','H2O','indicator'].includes(id)))return undefined;
 const excess=((contents.HCl||0)-(contents.NaOH||0))/(volumeML/1000);
 const root=Math.sqrt(excess*excess+4e-14);
 const hydrogen=excess>=0?(excess+root)/2:2e-14/(root-excess);
 return -Math.log10(hydrogen);
}
export function estimateNeutralizationTemperature(extent:number,volumeML:number){return volumeML>0?25+57300*extent/(volumeML*4.18):25;}
