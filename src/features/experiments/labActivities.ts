import type { Experiment } from './data';
import { documentActivities } from './documentActivities';
import { documentReactionRules } from '../../engine/documentReactionRules';
import { reactionRules } from '../../engine/reactionRules';
import type { ChemicalId } from '../../engine/chemicals';
import type { ReactionRule } from '../../engine/reactionRules';

const specs:Record<string,{reagents:ChemicalId[];product:ChemicalId;rule?:string}>={
 'acid-base-identification':{reagents:['HCl','NaOH'],product:'NaCl'},
 neutralization:{reagents:['HCl','NaOH','indicator'],product:'NaCl',rule:'neutralization'},
 'zinc-acid':{reagents:['Zn','HCl'],product:'H2',rule:'hydrogen'},
 'iron-copper':{reagents:['Fe','CuSO4'],product:'Cu',rule:'iron-copper'},
 'limestone-acid':{reagents:['CaCO3','HCl'],product:'CO2',rule:'limestone-acid'},
 'carbon-dioxide-test':{reagents:['CaCO3','HCl','Ca(OH)2'],product:'CaCO3',rule:'limestone-acid'},
 oxygen:{reagents:['KMnO4'],product:'O2',rule:'oxygen-permanganate'},
 'copper-oxidation':{reagents:['Cu'],product:'CuO',rule:'copper-oxidation'},
 'silver-chloride':{reagents:['AgNO3','NaCl'],product:'AgCl',rule:'silver-chloride'},
 esterification:{reagents:['CH3COOH','C2H5OH','H2SO4'],product:'CH3COOC2H5',rule:'esterification'},
 'silver-mirror':{reagents:['glucose','Tollens'],product:'Ag',rule:'silver-mirror'},
 saponification:{reagents:['fat','NaOH'],product:'soap',rule:'saponification'},
};

export const documentLabExperiments:Experiment[]=documentActivities.map(a=>{
 const spec=specs[a.id],rule=spec.rule?reactionRules.find(r=>r.id===spec.rule):undefined;
 const litmus=a.art==='litmus';
 return {id:a.id,title:a.title,subtitle:a.subtitle,grade:a.grade,topic:a.topic,minutes:a.minutes,difficulty:a.difficulty,access:'free',demo:true,
  reagents:spec.reagents,equipment:['beaker','flask','tube','waterBath','litmusPaper','alcoholBurner','stand','rod'],product:spec.product,
  customReaction:rule,goals:litmus?['observe']:['product','observe','equation'],amount:10,
  objectives:a.explanation,instructions:litmus?'Cho HCl và NaOH vào hai cốc riêng. Thêm quỳ tím từ Tiện ích, kéo từng mẩu vào từng cốc để thử.':a.id==='carbon-dioxide-test'?'Lắp bình CaCO₃ + HCl có nút, nối cổng RA đến cốc nước vôi trong. Chạy phản ứng tại bình nguồn và quan sát ở cốc đích.':a.art==='ester'||a.art==='silver-mirror'?'Thêm nước vào bể cách thủy. Kéo ống nghiệm chứa hỗn hợp vào bể, đặt đèn gần bể và bật đèn. Khi đủ nhiệt, chọn ống nghiệm và bắt đầu phản ứng.':a.steps.join(' '),
  hints:litmus?['Dùng hai cốc và hai mẩu quỳ riêng.','Chọn cốc rồi nhấn Thử quỳ tím, hoặc kéo giấy vào cốc.','HCl làm quỳ đỏ; NaOH làm quỳ xanh.']:[a.steps[0],a.condition||a.steps[1],rule?.equation||a.equation]};
});

export function rulesForExperiment(experiment:Experiment):ReactionRule[]{
 if(experiment.id==='carbon-dioxide-test')return documentReactionRules.filter(r=>['limestone-acid','limewater','carbonate-redissolution'].includes(r.id));
 return experiment.customReaction?[experiment.customReaction]:reactionRules;
}
