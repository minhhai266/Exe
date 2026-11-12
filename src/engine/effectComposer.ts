import type {Vessel} from './equipment';
import {chemicals,type ChemicalId} from './chemicals';
import {mixtureAppearance} from './appearance';
import {visualContents,visualProgress} from './visualModel';

export const visualEffectRegistry=[
 {code:'GAS_BUBBLES',name:'Bọt khí',supported:true,target:'reaction_container'},
 {code:'PRECIPITATE_FORMATION',name:'Tạo kết tủa',supported:true,target:'liquid_region'},
 {code:'COLOR_TRANSITION',name:'Đổi màu dung dịch',supported:true,target:'liquid_region'},
 {code:'SOLID_DISSOLUTION',name:'Chất rắn tan dần',supported:true,target:'solid_region'},
 {code:'GAS_FLOW',name:'Dẫn khí theo kết nối hợp lệ',supported:true,target:'connected_tube'},
 {code:'HEATING',name:'Gia nhiệt theo mô hình',supported:true,target:'heating_zone'},
 {code:'LIQUID_MIXING',name:'Trộn chất lỏng',supported:true,target:'liquid_region'},
 {code:'EVAPORATION',name:'Bay hơi',supported:false,target:'liquid_surface'},
 {code:'CONDENSATION',name:'Ngưng tụ',supported:false,target:'container_surface'},
 {code:'CRYSTALLIZATION',name:'Kết tinh',supported:false,target:'liquid_region'},
] as const;
/** Read-only projection: rendering never creates or consumes chemical amounts. */
export function composeVesselEffects(vessel:Vessel,now:number){
 const progress=visualProgress(vessel,now),contents=visualContents(vessel,progress),running=vessel.reaction?.status==='running';
 const rule=vessel.reaction?.rule;
 const gasProducts=Object.entries(rule?.products||{}).filter(([id])=>chemicals[id as ChemicalId]?.phase==='khí');
 const generated=gasProducts.reduce((sum,[id])=>sum+(vessel.produced?.[id as ChemicalId]||0),0);
 const gasRate=running&&generated>0?gasProducts.reduce((sum,[,n])=>sum+n!,0)*(vessel.reaction?.target||0)*(vessel.reaction?.rate||1)/(rule?.durationSeconds||10):0;
 const legacyBubbles=!vessel.reaction&&!!vessel.animation&&progress<1&&vessel.effect==='bubbles';
 const gasActive=!!vessel.gasReceiving||gasRate>0||legacyBubbles;
 const originZinc=vessel.reaction?.before.Zn||vessel.animation?.before.Zn||contents.Zn||0;
 const precipitates=(['Cu(OH)2','AgCl','CaCO3'] as ChemicalId[]).filter(id=>(contents[id]||0)>1e-9&&(id!=='CaCO3'||(vessel.produced?.CaCO3||0)>0)).map(id=>({id,amount:contents[id]!,color:chemicals[id].color}));
 return {progress,contents,gasActive,gasRate,bubbleCount:gasActive?Math.max(4,Math.min(24,Math.round(4+gasRate*12000))):0,precipitateAmount:contents['Cu(OH)2']||0,precipitates,zincScale:originZinc?Math.sqrt(Math.max(0,(contents.Zn||0)/originZinc)):0,liquid:mixtureAppearance(contents,vessel.volume),temperature:vessel.temperature||25};
}
