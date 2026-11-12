import type { ReactionRule } from './reactionRules';
import type { Vessel } from './equipment';
import { waterBathOf } from './heatingLogic';

export function reactionConditionError(v:Vessel,rule:ReactionRule,items:Vessel[]=[]){
  if(rule.catalysts?.some(id=>(v.contents[id]||0)<=1e-9))return 'Thêm chất xúc tác theo điều kiện của phản ứng trước khi bắt đầu.';
  if(rule.requiresWater&&v.volume<=0)return 'Phản ứng này cần nước làm dung môi.';
  if(rule.requiresStirring&&!v.stirred)return 'Thêm đũa thủy tinh và khuấy hỗn hợp trước khi bắt đầu.';
  if(rule.heating==='direct'&&(rule.minTemperature||0)>100&&v.volume>0)return 'Bài này cần mẫu rắn khô; không thêm nước hoặc dung dịch vào mẫu đang đun.';
  if(rule.heating==='water-bath'&&!waterBathOf(v,items))return 'Đặt ống nghiệm trong bể cách thủy có nước để làm ấm gián tiếp.';
  if(rule.ambientOxygen&&v.sealed)return 'Mở dụng cụ để đồng tiếp xúc với oxi trong không khí.';
  if((v.temperature??25)<(rule.minTemperature??20))return `Cần đun đến ít nhất ${rule.minTemperature}°C để bắt đầu phản ứng.`;
  return undefined;
}
