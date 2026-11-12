import { describe,expect,it } from 'vitest';
import type { Vessel } from "./equipment";
import { react } from "./simulationEngine";
import { ANIMATION_MS,estimateNeutralizationTemperature,estimatePH,visualContents,visualProgress } from "./visualModel";
describe('Mô hình quan sát',()=>{
 it('pH axit dư dùng tổng thể tích sau trộn',()=>{const r=react({HCl:.01,NaOH:.005});expect(estimatePH(r.contents,15)).toBeCloseTo(-Math.log10(.005/.015),8)});
 it('pH trung tính và bazơ dư ở 25°C',()=>{expect(estimatePH({NaCl:.01,H2O:.01},20)).toBeCloseTo(7,8);expect(estimatePH({NaOH:.001},10)).toBeCloseTo(13,8)});
 it('xét tự điện li của nước cho dung dịch rất loãng',()=>{const ph=estimatePH({HCl:1e-10},1000)!;expect(ph).toBeLessThan(7);expect(ph).toBeGreaterThan(6.99)});
 it('không suy diễn pH của hệ có đồng hoặc muối kẽm',()=>{expect(estimatePH({CuSO4:.01},20)).toBeUndefined();expect(estimatePH({ZnCl2:.01},20)).toBeUndefined();expect(estimatePH({},0)).toBeUndefined()});
 it('trung hòa tỏa nhiệt theo giả thiết cách nhiệt',()=>{expect(estimateNeutralizationTemperature(.01,20)).toBeCloseTo(31.854,2);expect(estimateNeutralizationTemperature(0,20)).toBe(25)});
 it('diễn họa chuyển dần lượng kẽm thành sản phẩm, dừng đúng thời hạn',()=>{const v:Vessel={id:'v',type:'flask',x:150,y:390,capacity:250,volume:20,ports:[],connections:[],contents:{Zn:0,HCl:0,H2:.01,ZnCl2:.01},animation:{startedAt:1000,before:{Zn:.01,HCl:.02},ruleId:'hydrogen',extent:.01}};expect(visualProgress(v,1000)).toBe(0);const middle=visualContents(v,.5);expect(middle.Zn).toBeCloseTo(.005);expect(middle.H2).toBeCloseTo(.005);expect(visualProgress(v,1000+ANIMATION_MS)).toBe(1);expect(visualProgress(v,99999)).toBe(1)});
});
