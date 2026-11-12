import { describe,expect,it } from 'vitest';
import { connectObjects,gasDestination,placeObject,portPosition } from "./connectionLogic";
import { createEquipment,type Vessel } from "./equipment";
import { evaluateGoals } from "./experimentGoals";
import { ignitionError } from "./heatingLogic";
import { addSubstance,startReaction,stepSimulation,summarize,reactionLifecycle } from "./timeSimulation";
import {reactionRules} from './reactionRules';
const run=(items:Vessel[],seconds:number)=>{for(let i=0;i<seconds*10;i++)items=stepSimulation(items,.1).items;return items};
function hydrogen(sealed=false){const v=createEquipment('flask','source',250,350);v.contents={Zn:.01,HCl:.02};v.volume=20;v.sealed=sealed;return v}
function collector(){const v=createEquipment('gasJar','dest',750,265);v.prepared=true;v.volume=250;v.rotation=180;return v}
describe('Tính phản ứng theo thời gian',()=>{
 it('derives lifecycle from chemistry without relying on the animation clock',()=>{
  const empty=createEquipment('beaker','lifecycle',100,400);expect(reactionLifecycle(empty)).toBe('IDLE');
  empty.contents={CuSO4:.005};expect(reactionLifecycle(empty)).toBe('BLOCKED');
  empty.contents.NaOH=.01;empty.volume=15;expect(reactionLifecycle(empty)).toBe('READY');
  const started=startReaction(empty,0).v;expect(reactionLifecycle(started)).toBe('RUNNING');
  expect(reactionLifecycle(started)).toBe('RUNNING');
  const completed=run([started],10)[0];expect(reactionLifecycle(completed)).toBe('COMPLETED');
 });
 it('enforces an explicitly required catalyst across starting, running and resuming',()=>{
  const rule={...reactionRules.find(rule=>rule.id==='oxygen')!,catalysts:['MnO2' as const]};
  const vessel=createEquipment('flask','oxygen-required',200,350);vessel.contents={H2O2:.02};vessel.volume=40;
  expect(startReaction(vessel,1,[rule]).error).toContain('xúc tác');vessel.contents.MnO2=.001;
  let current=stepSimulation([startReaction(vessel,1,[rule]).v],.2).items[0];expect(current.contents.MnO2).toBe(.001);
  delete current.contents.MnO2;current=stepSimulation([current],.2).items[0];expect(current.reaction?.status).toBe('paused');
  expect(startReaction(current,1,[rule]).error).toContain('xúc tác');current.contents.MnO2=.001;expect(startReaction(current,1,[rule]).v.reaction?.status).toBe('running');
 });
 it('không chuyển ngay toàn bộ chất ban đầu thành sản phẩm',()=>{const v=startReaction(hydrogen()).v;expect(v.contents.Zn).toBe(.01);expect(v.produced?.H2).toBeUndefined();const after=stepSimulation([v],.2).items[0];expect(after.contents.Zn).toBeLessThan(.01);expect(after.contents.Zn).toBeGreaterThan(0);expect(after.produced?.H2).toBeGreaterThan(0)});
 it('bảo toàn tỉ lệ mol và ghi nhận khí thoát ở hệ hở',()=>{const v=run([startReaction(hydrogen()).v],15)[0];expect(v.contents.Zn).toBeCloseTo(0);expect(v.produced?.H2).toBeCloseTo(.01);expect(v.escaped?.H2).toBeCloseTo(.01);expect(v.contents.H2||0).toBe(0);expect(v.reaction?.status).toBe('complete')});
 it('nút một lỗ chưa nối ống vẫn cho phản ứng và khí thoát qua lỗ',()=>{const result=startReaction(hydrogen(true));expect(result.error).toBeUndefined();const v=run([result.v],15)[0];expect(v.escaped?.H2).toBeCloseTo(.01)});
 it('tiếp tục phản ứng đang tạm dừng giữ nguyên mức tiến triển',()=>{const v=run([startReaction(hydrogen()).v],2)[0];v.reaction!.status='paused';const resumed=startReaction(v).v;expect(resumed.reaction!.extent).toBe(v.reaction!.extent);expect(resumed.reaction!.target).toBe(v.reaction!.target);expect(run([resumed],15)[0].produced?.H2).toBeCloseTo(.01)});
 it('chỉ thu khi hệ kín, nối đúng và bình thu đã đảo đầy nước',()=>{const source=hydrogen(true);source.connections=['dest'];const result=run([startReaction(source).v,collector()],15);expect(result[1].collected?.H2).toBeCloseTo(.01);expect(result[1].gasVolume).toBeCloseTo(245);expect(result[1].volume).toBeCloseTo(5);expect(result[0].escaped?.H2||0).toBeCloseTo(0)});
 it('tháo ống giữa chừng làm phần khí sau đó thất thoát, không hồi thu khí cũ',()=>{const source=hydrogen(true);source.connections=['dest'];let items=run([startReaction(source).v,collector()],3);const captured=items[1].collected?.H2||0;items[0].sealed=false;items[0].connections=[];items=run(items,15);expect(items[1].collected?.H2).toBeCloseTo(captured);expect((items[0].escaped?.H2||0)+captured).toBeCloseTo(.01)});
 it('không tràn bình thu nhỏ, khí dư được ghi là thoát ra',()=>{const s=hydrogen(true);s.connections=['dest'];const dest=collector();dest.capacity=100;dest.volume=100;const r=run([startReaction(s).v,dest],15);expect(r[1].gasVolume).toBeCloseTo(100);expect((r[1].collected?.H2||0)+(r[0].escaped?.H2||0)).toBeCloseTo(.01)});
 it('đúng tỉ lệ kết tủa và lượng NaOH còn dư',()=>{const v=createEquipment('beaker','v',200,400);v.contents={CuSO4:.01,NaOH:.03};v.volume=40;const r=run([startReaction(v).v],10)[0];expect(r.contents['Cu(OH)2']).toBeCloseTo(.01);expect(r.contents.NaOH).toBeCloseTo(.01)});
 it('trung hòa tỏa nhiệt dần, không tăng nhiệt ngay lúc bắt đầu',()=>{const v=createEquipment('beaker','v',200,400);v.contents={HCl:.01,NaOH:.01};v.volume=20;const started=startReaction(v).v;expect(started.temperature).toBe(25);const mid=run([started],2)[0];expect(mid.temperature).toBeGreaterThan(25);expect(mid.contents.NaCl).toBeLessThan(.01);expect(run([mid],10)[0].contents.NaCl).toBeCloseTo(.01)});
 it('MnO2 chỉ tăng tốc phản ứng oxy và không bị tiêu thụ',()=>{const v=createEquipment('flask','v',200,350);v.contents={H2O2:.02};v.volume=40;const slow=run([startReaction(v).v],3)[0];v.contents.MnO2=.001;const fast=run([startReaction(v).v],3)[0];expect(fast.produced!.O2!).toBeGreaterThan(slow.produced!.O2!);expect(fast.contents.MnO2).toBe(.001)});
 it('nhiệt và khuấy thay đổi tốc độ nhưng không đổi giới hạn sản phẩm',()=>{const v=createEquipment('flask','v',200,350);v.contents={H2O2:.02};v.volume=40;const slow=run([startReaction(v).v],2)[0];v.temperature=60;v.stirred=true;const fast=run([startReaction(v).v],2)[0];expect(fast.produced!.O2!).toBeGreaterThan(slow.produced!.O2!);expect(run([fast],100)[0].produced!.O2).toBeCloseTo(.01)});
 it('không suy đoán CaCO3 hoặc xúc tác sai hệ',()=>{const v=hydrogen();v.contents.CaCO3=.01;expect(startReaction(v).error).toBe('Chưa hỗ trợ mô phỏng phản ứng này');delete v.contents.CaCO3;v.contents.MnO2=.001;expect(startReaction(v).error).toBe('Chưa hỗ trợ mô phỏng phản ứng này')});
 it('tạm dừng không tiêu thụ chất, lưu/khôi phục tiếp tục đúng',()=>{const s=run([startReaction(hydrogen()).v],2)[0];s.reaction!.status='paused';expect(run([s],4)[0].contents.Zn).toBe(s.contents.Zn);s.reaction!.status='running';const restored=JSON.parse(JSON.stringify([s]));expect(run(restored,15)[0].produced?.H2).toBeCloseTo(.01)});
});
describe('Lắp ráp, gia nhiệt và mục tiêu',()=>{
 it('cổng không tự nối vào cùng một dụng cụ hoặc sai hướng',()=>{const s=hydrogen(),d=collector();expect(connectObjects([s,d],'source','source').error).toBeDefined();const connected=connectObjects([s,d],'source','dest');expect(connected.error).toBeUndefined();expect(connectObjects(connected.items,'source','dest').error).toBeDefined()});
 it('xoay dụng cụ làm đổi vị trí cổng',()=>{const v=collector();const a=portPosition(v,'in');v.rotation=0;expect(portPosition(v,'in').y).toBeLessThan(a.y)});
 it('giá ống nghiệm có ba vị trí riêng, không nhận bình',()=>{let items=[createEquipment('rack','rack',300,440),...Array.from({length:4},(_,i)=>createEquipment('tube','t'+i,50,440)),hydrogen()];for(let i=0;i<4;i++)items=placeObject(items,'t'+i,300,420).items;expect(items.filter(v=>v.mountedOn==='rack')).toHaveLength(3);expect(placeObject(items,'source',300,420).message).toContain('chỉ nhận ống nghiệm')});
 it('ống nghiệm cần giá trước khi thêm chất',()=>{const v=createEquipment('tube','t',100,400);expect(addSubstance(v,'HCl',10,1,'mL').error).toContain('giá');v.mountedOn='rack';expect(addSubstance(v,'HCl',10,.5,'mL').v.contents.HCl).toBeCloseTo(.005)});
 it('phân biệt nồng độ, thể tích và khối lượng',()=>{const v=createEquipment('beaker','v',100,400);expect(addSubstance(v,'HCl',20,.5,'mL').v.contents.HCl).toBeCloseTo(.01);expect(addSubstance(v,'Zn',65.38,1,'mg').v.contents.Zn).toBeCloseTo(.001);expect(addSubstance(v,'HCl',300,1,'mL').error).toContain('dung tích')});
 it('đèn cần bố trí phù hợp và chặn đun hệ hiđro',()=>{const b=createEquipment('burner','b',250,440),s=hydrogen();s.mountedOn='stand';expect(ignitionError(b,[b,s])).toContain('hiđro');delete s.contents.Zn;delete s.contents.HCl;expect(ignitionError(b,[b,s])).toBeUndefined();s.sealed=true;expect(ignitionError(b,[b,s])).toContain('kín')});
 it('đèn tăng nhiệt thực qua các bước và tự tắt khi bố trí sai',()=>{const b=createEquipment('burner','b',250,440);b.burning=true;const v=createEquipment('beaker','v',250,350);v.volume=50;v.mountedOn='tripod';const result=run([b,v],3);expect(result[1].temperature).toBeGreaterThan(25);result[0].x=800;expect(stepSimulation(result,.1).items[0].burning).toBe(false)});
 it('có khí nhưng không thu vẫn chỉ đạt một phần mục tiêu',()=>{const s=run([startReaction(hydrogen()).v],15);const totals=summarize(s);const goals=evaluateGoals(['product','collectGas'],'H2',totals.contents,'',false,totals.collected);expect(goals.score).toBe(50);expect(goals.success).toBe(false);expect(gasDestination(s[0],s).reason).toContain('chưa kín')});
});
