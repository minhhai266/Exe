import { describe,expect,it } from 'vitest';
import { experiments } from "../features/experiments/data";
import { mixtureAppearance } from "./appearance";
import { createEquipment } from "./equipment";
import { prepareCollector,quickSetup } from "./quickSetup";
describe('Màu chất và chuẩn bị nhanh',()=>{
 it('dung dịch đồng xanh, kết tủa là pha rắn riêng',()=>{expect(mixtureAppearance({CuSO4:.01},100).blue).toBeGreaterThan(0);const precip=mixtureAppearance({'Cu(OH)2':.01,Na2SO4:.01},100);expect(precip.blue).toBe(0);expect(precip.tags.find(t=>t.id==='Cu(OH)2')?.kind).toBe('solid');expect(precip.tags.find(t=>t.id==='liquid')?.label).toContain('không màu')});
 it('không tô hồng NaOH nếu không có chỉ thị',()=>{expect(mixtureAppearance({NaOH:.01},100).pink).toBe(false);expect(mixtureAppearance({NaOH:.01,indicator:1e-7},100).pink).toBe(true);expect(mixtureAppearance({HCl:.01,indicator:1e-7},100).pink).toBe(false)});
 it('phân biệt kẽm, MnO2 và CaCO3 bằng dạng và màu rắn',()=>{const tags=mixtureAppearance({Zn:.001,MnO2:.001,CaCO3:.001},0).tags;expect(tags).toHaveLength(3);expect(tags.every(t=>t.kind==='solid')).toBe(true);expect(new Set(tags.map(t=>t.color)).size).toBe(3)});
 it('bộ thu gợi ý chuẩn bị đầy nước và nút, để người học tự bấm nối',()=>{let i=0;const kit=quickSetup(experiments.find(e=>e.id==='hydrogen')!,()=>String(++i));const source=kit.items.find(v=>v.id===kit.sourceId)!;expect(source.sealed).toBe(true);expect(source.contents.Zn).toBeCloseTo(.01);expect(source.contents.HCl).toBeCloseTo(.02);expect(source.connections).toEqual([]);const receiver=kit.items.find(v=>v.type==='gasJar')!;expect(receiver.prepared).toBe(true);expect(receiver.rotation).toBe(180)});
 it('bài trung hòa chuẩn bị bazơ với chỉ thị để thấy hồng trước khi thêm axit',()=>{const kit=quickSetup(experiments.find(e=>e.id==='neutralization')!);const source=kit.items.find(v=>v.id===kit.sourceId)!;expect(source.contents.HCl||0).toBe(0);expect(source.contents.NaOH).toBeCloseTo(.04);expect(mixtureAppearance(source.contents,source.volume).pink).toBe(true)});
 it('chuẩn bị bình thu giữ nguyên tâm và không lật lại khi bấm lần nữa',()=>{const v=createEquipment('gasJar','v',500,440);const first=prepareCollector(v),second=prepareCollector(first);expect(first.rotation).toBe(180);expect(first.volume).toBe(250);expect(second.y).toBeCloseTo(first.y);expect(second.x).toBeCloseTo(first.x)});
 it('không bỏ qua cấu hình dụng cụ giáo viên',()=>{const e={...experiments.find(e=>e.id==='hydrogen')!,demo:false,equipment:['tube' as const]};expect(quickSetup(e).items).toHaveLength(0)});
});
