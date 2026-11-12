import { definition,isContainer,type Vessel } from './equipment';
export const HEAT_RADIUS=160;
const hasMaterial=(v:Vessel)=>v.volume>0||Object.values(v.contents).some(n=>n!>1e-9);
export const inHeatRange=(burner:Vessel,v:Vessel)=>isContainer(v)&&hasMaterial(v)&&!!definition(v.type).heatSafe&&Math.hypot(v.x-burner.x,v.y-burner.y)<=HEAT_RADIUS;
export const burnerTarget=(burner:Vessel,items:Vessel[])=>items.filter(v=>inHeatRange(burner,v)).sort((a,b)=>Math.hypot(a.x-burner.x,a.y-burner.y)-Math.hypot(b.x-burner.x,b.y-burner.y))[0];
export function waterBathOf(v:Vessel,items:Vessel[]){return items.find(b=>b.id===v.mountedOn&&b.type==='waterBath'&&b.volume>0&&!Object.entries(b.contents).some(([id,n])=>id!=='H2O'&&n!>1e-9))}
export function ignitionError(burner:Vessel,items:Vessel[]){
 const target=burnerTarget(burner,items);if(!target)return 'Đưa dụng cụ chịu nhiệt có chất vào vùng nhiệt 2 ô quanh đèn rồi bật lửa.';
 if(!definition(target.type).heatSafe)return 'Dụng cụ này không được dùng để đun.';
 if(items.some(v=>inHeatRange(burner,v)&&Math.abs(v.rotation||0)>45))return 'Đưa dụng cụ trong vùng nhiệt về góc thẳng phù hợp trước khi đun.';
 if(items.some(v=>inHeatRange(burner,v)&&v.sealed&&!v.connections.length))return 'Không đun bình kín không có đường thoát khí.';
 if(items.some(v=>Math.hypot(v.x-burner.x,v.y-burner.y)<350&&((v.contents.H2||0)>0||(v.contents.Zn||0)>0&&(v.contents.HCl||0)>0||v.reaction?.ruleId==='hydrogen')))return 'Không bật lửa gần hệ tạo hoặc chứa hiđro. Di chuyển đèn và dùng thí nghiệm khác để khảo sát nhiệt.';
 if(items.some(v=>inHeatRange(burner,v)&&((v.contents.C2H5OH||0)>0||(v.contents.CH3COOC2H5||0)>0)&&!waterBathOf(v,items)))return 'Hỗn hợp ancol / este cần đặt trong bể cách thủy trước khi gia nhiệt.';
 return undefined;
}
export const isBurner=(v:Vessel)=>v.type==='burner'||v.type==='alcoholBurner';
export function heatStep(v:Vessel,items:Vessel[],dt:number){
 const t=v.temperature??25,bath=waterBathOf(v,items);
 if(bath)return Math.max(20,Math.min(98,t+((bath.temperature??25)-t)*Math.min(1,dt*.7)));
 const powered=items.filter(b=>isBurner(b)&&b.burning&&!ignitionError(b,items)&&inHeatRange(b,v));
 const dry=v.volume<=0&&hasMaterial(v),gain=powered.reduce((s,b)=>s+(b.power||.5)*(dry?45:5),0);
 return Math.max(20,Math.min(dry?450:98,t+(gain-(t-25)*.018)*dt));
}