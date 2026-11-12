import type { Vessel } from "./equipment";
// Relative teaching rates. These are intentionally not experimental constants.
export function catalystFactor(v:Vessel,ruleId:string){return ruleId==='oxygen'&&(v.contents.MnO2||0)>1e-9?6:1}
export function reactionRate(v:Vessel,ruleId:string){return Math.min(12,Math.pow(1.5,((v.temperature??25)-25)/15))*catalystFactor(v,ruleId)*(v.stirred?1.3:1)}
