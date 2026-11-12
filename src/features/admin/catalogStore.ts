import { create } from 'zustand';
import type { AdminRecord } from './domain';
import type { Experiment } from '../experiments/data';
import { chemicals,type ChemicalId } from '../../engine/chemicals';
import { chemicalProfiles } from '../../engine/catalog';
import { equipmentLibrary,type EquipmentType } from '../../engine/equipment';
import { reactionRules,type ReactionRule } from '../../engine/reactionRules';

interface CatalogState{available:boolean;chemicals:AdminRecord[];apparatus:AdminRecord[];ebooks:AdminRecord[];experiments:Experiment[];loading:boolean}
export const useServerCatalog=create<CatalogState>(()=>({available:false,chemicals:[],apparatus:[],ebooks:[],experiments:[],loading:false}));
let request:Promise<void>|undefined;
const canonicalRules=structuredClone(reactionRules);
export function ruleFromCatalog(record:AdminRecord):ReactionRule{const d=record.data;const reactants=Object.fromEntries(d.reactants.map((p:any)=>[p.chemical,p.coefficient])),products=Object.fromEntries(d.products.map((p:any)=>[p.chemical,p.coefficient]));const canonical=canonicalRules.find(r=>['reactants','products'].every(side=>Object.keys((r as any)[side]).length===d[side].length&&d[side].every((p:any)=>(r as any)[side][p.chemical]===p.coefficient)));return {...canonical,id:canonical?.id||'admin:'+record.id,reactants,products,equation:d.reactants.map((p:any)=>`${p.coefficient===1?'':p.coefficient}${chemicals[p.chemical as ChemicalId]?.formula||p.chemical}`).join(' + ')+' → '+d.products.map((p:any)=>`${p.coefficient===1?'':p.coefficient}${chemicals[p.chemical as ChemicalId]?.formula||p.chemical}`).join(' + '),effect:d.effect,observation:d.observation,explanation:d.explanation,source:d.source,minTemperature:Math.max(d.minTemperature??20,canonical?.minTemperature??20),durationSeconds:d.durationSeconds,teacherReviewed:true,phenomena:d.phenomena,catalysts:canonical?.catalysts?.length?[...new Set([...canonical.catalysts,...(d.requiredCatalysts||[])])]:d.requiredCatalysts}}
export function refreshServerCatalog(force=false){if(request&&!force)return request;useServerCatalog.setState({loading:true});request=fetch('/api/catalog',{credentials:'same-origin'}).then(async response=>{if(!response.ok)throw new Error('Catalog unavailable');const catalog=await response.json();
 for(const record of catalog.chemicals as AdminRecord[]){const d=record.data;if(record.id in chemicals){const id=record.id as ChemicalId;Object.assign(chemicals[id],{name:record.name,phase:d.phase,color:d.color});Object.assign(chemicalProfiles[id],{category:d.category,appearance:d.appearance,description:d.description,hazard:d.safety,molarMass:d.molarMass,source:d.source})}}
 for(const record of catalog.apparatus as AdminRecord[]){const base=equipmentLibrary.find(e=>e.type===record.id);if(base)Object.assign(base,{name:record.name,description:record.data.description,technique:record.data.technique,capacity:record.data.capacity})}
 reactionRules.splice(0,reactionRules.length,...structuredClone(canonicalRules));
 for(const record of (catalog.reactions as AdminRecord[]).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt))){if(record.data.support&&record.data.support!=='supported')continue;const rule=ruleFromCatalog(record),index=reactionRules.findIndex(r=>r.id===rule.id);if(index>=0)reactionRules[index]=rule;else reactionRules.push(rule)}
 useServerCatalog.setState({available:true,chemicals:catalog.chemicals,apparatus:catalog.apparatus,ebooks:catalog.ebooks,experiments:catalog.experiments||[],loading:false});
 }).catch(()=>{useServerCatalog.setState({loading:false});request=undefined});return request}
export function publishedApparatus(record:AdminRecord){const template=equipmentLibrary.find(e=>e.type===record.data.engineType);return template?{...template,id:record.id,type:record.data.engineType as EquipmentType,name:record.name,description:record.data.description,technique:record.data.technique,capacity:record.data.capacity,ports:record.data.ports,assetUrl:record.data.assetUrl}:undefined}
/** Authenticated metrics only; legacy/local accounts are never imported as server accounts. */
export async function syncLearningSession(id:string,experimentId:string,complete=false){try{const headers={'content-type':'application/json','x-virtual-lab':'1'};const response=await fetch('/api/learning/sessions',{method:'POST',credentials:'same-origin',headers,body:JSON.stringify({id,experimentId})});if(response.ok&&complete)await fetch(`/api/learning/sessions/${id}/complete`,{method:'POST',credentials:'same-origin',headers,body:'{}'})}catch{/* Offline lab state remains in the existing store. */}}
