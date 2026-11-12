import type {AssignmentConfig} from '../../../engine/assignmentLab';
export function AssignmentQuestions({config,answers,onChange}:{config:AssignmentConfig;answers:Record<string,string>;onChange:(id:string,value:string)=>void}){
 return <>{config.questions.filter(q=>q.trim()).map((prompt,index)=>{
  const question=config.experiment.assessmentQuestions?.find(q=>q.prompt+(q.choices.length?'\n'+q.choices.map((c,i)=>`${String.fromCharCode(65+i)}. ${c}`).join('\n'):'')===prompt);
  const id=question?.id||prompt,choices=question?.type==='true-false'?['Đúng','Sai']:question?.type==='multiple-choice'?question.choices:[];
  if(!choices.length)return <label key={id}>{question?.prompt||prompt}<textarea value={answers[id]||''} onChange={e=>onChange(id,e.target.value)}/></label>;
  return <fieldset className="lab-assessment-question" key={id}><legend>Câu {index+1}. {question?.prompt||prompt}</legend>{choices.map((choice,i)=><label className="checkbox-label" key={i}><input type="radio" name={'question-'+id} value={choice} checked={answers[id]===choice} onChange={()=>onChange(id,choice)}/>{choice}</label>)}</fieldset>;
 })}</>;
}
