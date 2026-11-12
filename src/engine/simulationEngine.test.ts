import { describe,expect,it } from 'vitest';
import { react } from "./simulationEngine";
describe('Tính phản ứng theo chất giới hạn',()=>{
 it('Zn + HCl: axit giới hạn và kẽm dư',()=>{const r=react({Zn:0.02,HCl:0.02});expect(r.contents.H2).toBeCloseTo(0.01);expect(r.contents.Zn).toBeCloseTo(0.01);expect(r.contents.HCl).toBe(0);});
 it('CuSO4 + NaOH: bảo toàn tỉ lệ kết tủa',()=>{const r=react({CuSO4:0.01,NaOH:0.03});expect(r.contents['Cu(OH)2']).toBeCloseTo(0.01);expect(r.contents.NaOH).toBeCloseTo(0.01);expect(r.contents.Na2SO4).toBeCloseTo(0.01);});
 it('HCl + NaOH: trung hòa và chất dư',()=>{const r=react({HCl:0.02,NaOH:0.01});expect(r.contents.NaCl).toBeCloseTo(0.01);expect(r.contents.HCl).toBeCloseTo(0.01);expect(r.contents.H2O).toBeCloseTo(0.01);});
 it('Không suy diễn tổ hợp chưa hỗ trợ',()=>{const r=react({Zn:0.01,NaOH:0.02});expect(r.error).toBe('Chưa hỗ trợ mô phỏng phản ứng này');expect(r.contents).toEqual({Zn:0.01,NaOH:0.02});});
 it('Không phản ứng lặp lại sau khi chất giới hạn hết',()=>{const r=react({HCl:0.01,NaOH:0.01});expect(react(r.contents).extent).toBe(0);});
});
