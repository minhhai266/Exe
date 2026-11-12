import {chemicals,type Contents,type ChemicalId} from './chemicals';
import {mixtureAppearance} from './appearance';

export const phenomenonTemplates=[
 {code:'gas',name:'Sinh khí',category:'Khí',description:'Bọt khí xuất hiện trong chất lỏng khi phản ứng tạo sản phẩm khí.',constraint:'Phải có sản phẩm khí được engine hỗ trợ.',example:'hydrogen'},
 {code:'precipitate',name:'Tạo kết tủa',category:'Chất rắn',description:'Chất rắn ít tan xuất hiện trong dung dịch và lắng xuống.',constraint:'Phải có sản phẩm ở pha kết tủa; màu theo chất tạo thành.',example:'precipitate'},
 {code:'solid-consumption',name:'Chất rắn tan dần',category:'Chất rắn',description:'Lượng chất rắn tham gia giảm dần trong quá trình phản ứng.',constraint:'Cần chất phản ứng rắn có hình thái đã được mô phỏng.',example:'hydrogen'},
 {code:'color-transition',name:'Thay đổi màu dung dịch',category:'Màu sắc',description:'Màu dung dịch thay đổi theo lượng chất còn lại và chất được tạo thành.',constraint:'Mô hình màu trước và sau phản ứng phải khác nhau.',example:'precipitate'},
 {code:'neutralization',name:'Trung hòa axit – bazơ',category:'Axit – bazơ',description:'pH thay đổi khi HCl và NaOH phản ứng tạo NaCl và nước.',constraint:'Áp dụng cho hệ HCl / NaOH / NaCl / H₂O đã hỗ trợ.',example:'neutralization'},
 {code:'heat-release',name:'Tỏa nhiệt',category:'Nhiệt',description:'Theo dõi nhiệt độ tăng trong phản ứng trung hòa được mô hình hóa.',constraint:'Hiện chỉ có mô hình nhiệt phản ứng trung hòa HCl với NaOH.',example:'neutralization'},
 {code:'gas-collection',name:'Dẫn và thu khí',category:'Khí',description:'Dẫn khí sang bình thu qua đường ống và thu bằng phương pháp đẩy nước.',constraint:'Cần sản phẩm khí, bình phản ứng có nút, ống nối và bình thu đầy nước úp ngược trong Lab.',example:'oxygen'},
] as const;
export type PhenomenonCode=typeof phenomenonTemplates[number]['code'];
export interface ReactionComposition{reactants:Contents;products:Contents}
export function compositionFromRows(data:any):ReactionComposition{
 const rows=(values:any)=>Object.fromEntries((Array.isArray(values)?values:[]).filter(p=>p?.chemical&&Number.isFinite(p.coefficient)).map(p=>[p.chemical,p.coefficient]));
 return {reactants:rows(data.reactants),products:rows(data.products)};
}
export function availablePhenomena({reactants,products}:ReactionComposition):PhenomenonCode[]{
 const result:PhenomenonCode[]=[];
 const ids=(contents:Contents)=>Object.keys(contents).filter(id=>(contents[id as ChemicalId]||0)>0) as ChemicalId[];
 const input=ids(reactants),output=ids(products);
 if(!input.length||!output.length||[...input,...output].some(id=>!chemicals[id]))return result;
 if(output.some(id=>chemicals[id].phase==='khí'))result.push('gas','gas-collection');
 if(output.some(id=>chemicals[id].phase==='kết tủa'))result.push('precipitate');
 if(input.includes('Zn')&&(products.Zn||0)<(reactants.Zn||0))result.push('solid-consumption');
 const scale=(contents:Contents)=>Object.fromEntries(Object.entries(contents).map(([id,n])=>[id,n!*.001])) as Contents;
 if(mixtureAppearance(scale(reactants),10).liquidColor!==mixtureAppearance(scale(products),10).liquidColor)result.push('color-transition');
 const exact=(value:Contents,expected:Contents)=>Object.keys(value).length===Object.keys(expected).length&&Object.entries(expected).every(([id,n])=>value[id as ChemicalId]===n);
 // The current heat and pH model uses the canonical neutralization rule.
 if(exact(reactants,{HCl:1,NaOH:1})&&exact(products,{NaCl:1,H2O:1}))result.push('neutralization','heat-release');
 return result;
}
export function suggestedEffect(composition:ReactionComposition){
 const supported=availablePhenomena(composition);
 return supported.includes('gas')?'bubbles':supported.includes('precipitate')?'precipitate':supported.includes('neutralization')?'neutral':'none';
}
