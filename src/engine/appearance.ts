import { chemicals,type ChemicalId,type Contents } from "./chemicals";
import { estimatePH } from "./visualModel";
export interface AppearanceTag {id:string;label:string;color:string;kind:'liquid'|'solid'|'gas';detail:string}
export function mixtureAppearance(contents:Contents,volume:number){
 const copper=(contents.CuSO4||0)/Math.max(.001,volume/1000);
 const ph=estimatePH(contents,volume);
 const pink=(contents.indicator||0)>0&&ph!==undefined&&ph>8.2;
 const blue=Math.min(1,copper/.5);
 const iron=(contents.FeSO4||0)/Math.max(.001,volume/1000);
 const liquidColor=blue>1e-6?`rgba(14,135,223,${(.32+blue*.5).toFixed(3)})`:pink?`rgba(232,53,151,${Math.min(.66,.3+(ph!-8.2)*.15).toFixed(3)})`:iron>1e-6?'rgba(122,172,135,0.38)':(contents.soap||0)>1e-9?'rgba(222,220,191,0.58)':(contents.fat||0)>1e-9?'rgba(214,184,91,0.48)':'rgba(194,217,231,0.18)';
 const tags:AppearanceTag[]=[];
 if(volume>0)tags.push({id:'liquid',label:blue>1e-6?'Dung dịch xanh lam':pink?'Dung dịch hồng chỉ thị':iron>1e-6?'Dung dịch xanh lục nhạt':(contents.soap||0)>1e-9?'Hệ chứa xà phòng':(contents.fat||0)>1e-9?'Dầu chất béo':'Dung dịch không màu',color:blue>1e-6?'#168cde':pink?'#e83597':'#edf4f8',kind:'liquid',detail:blue>1e-6?'Cu²⁺ còn trong dung dịch.':pink?'Phenolphthalein đổi màu trong môi trường bazơ.':'Nét xanh xám rất nhạt chỉ để nhìn mặt chất lỏng và kính.'});
 const solids:{id:ChemicalId;label:string;color:string;detail:string}[]=[{id:'Zn',label:'Kẽm xám bạc',color:'#8b99a5',detail:'Hạt kim loại giảm dần khi phản ứng.'},{id:'Cu(OH)2',label:'Kết tủa xanh lam',color:'#56b8eb',detail:'Chất rắn dạng đám đục, dần lắng xuống đáy.'},{id:'MnO2',label:'MnO₂ nâu đen',color:'#4b403a',detail:'Xúc tác rắn còn lại trong phản ứng H₂O₂.'},{id:'CaCO3',label:'CaCO₃ trắng',color:'#f4f1e9',detail:'Đá vôi trắng hoặc kết tủa tạo bởi CO₂ với nước vôi trong.'}];
 for(const id of ['Fe','Cu','KMnO4','K2MnO4','CuO','Ag','AgCl'] as ChemicalId[])solids.push({id,label:chemicals[id].name,color:chemicals[id].color,detail:chemicals[id].phase==='kết tủa'?'Chất rắn ít tan trong dung dịch.':'Chất rắn trong dụng cụ.'});
 for(const s of solids)if((contents[s.id]||0)>1e-9)tags.push({...s,kind:'solid'});
 return {liquidColor,blue,pink,tags};
}
