import {checkEquation,parseFormula,plainFormula} from '../features/admin/domain';
import type {ChemicalStock,RubricCriterion} from './assignmentLab';
import type {EquipmentType} from './equipment';
import type {ExplanationPolicy} from './learningPolicy';

export type PhysicalState='solid'|'liquid'|'aqueous'|'gas';
export interface DefinitionSpecies{formula:string;coefficient:number;state:PhysicalState}
export interface AssessmentQuestion{id:string;type:'multiple-choice'|'true-false'|'equation'|'observation'|'explanation'|'calculation'|'application';prompt:string;choices:string[];answer:string;reviewed:boolean;difficulty?:'easy'|'medium'|'hard';objective?:string;points?:number}
export interface ReactionSimulation{stock:ChemicalStock[];equipment:EquipmentType[];minutes:number;hintsAllowed:boolean;explanation:ExplanationPolicy;rubric:RubricCriterion[];hints:string[];difficulty:string}
export interface ReactionDefinition{
 schemaVersion:1;name:string;reactants:DefinitionSpecies[];products:DefinitionSpecies[];
 conditions:{contactRequired:boolean;heatingRequired:boolean;minTemperature:number;catalysts:string[]};
 observation:string;explanation:string;source:string;durationSeconds:number;
 learning:{grade:number;purpose:string;mode:'guided'|'exploration';explanationLevel:'brief'|'detailed';objectives:string;instructions:string};
 questions:AssessmentQuestion[];
 simulation?:ReactionSimulation;
}
export interface DefinitionChemical{id:string;formula:string;phase:string;status?:string;molarMass?:number}
export const phaseToState=(phase:string):PhysicalState=>phase==='khí'?'gas':['rắn','kết tủa'].includes(phase)?'solid':phase==='dung dịch'?'aqueous':'liquid';
export function definitionEquation(definition:Pick<ReactionDefinition,'reactants'|'products'>){
 return [definition.reactants,definition.products].map(side=>side.map(p=>`${p.coefficient===1?'':p.coefficient}${p.formula}`).join(' + ')).join(' → ');
}
function splitSpecies(side:string){
 const rows:string[]=[];let start=0;
 for(let i=0;i<side.length;i++)if(side[i]==='+'&&!/\^\d*$/.test(side.slice(start,i))){rows.push(side.slice(start,i));start=i+1}
 rows.push(side.slice(start));return rows;
}
/** Parses data only. Coefficients are checked, never silently rebalanced. */
export function parseReactionEquation(input:string,catalog:DefinitionChemical[]):Pick<ReactionDefinition,'reactants'|'products'>{
 if(typeof input!=='string'||input.length>2000)throw new Error('Phương trình tối đa 2.000 ký tự.');
 const sides=input.replace(/⇌|⟶|⟹|=>|->|=/g,'→').split('→');
 if(sides.length!==2)throw new Error('Nhập đúng hai vế, ngăn bằng → hoặc ->.');
 const parse=(side:string)=>{
  const tokens=splitSpecies(side);if(!tokens.length||tokens.length>12)throw new Error('Mỗi vế cần 1–12 chất.');
  return tokens.map(token=>{
   let value=token.trim().replace(/[↑↓]/g,'');const state=value.match(/\((aq|s|l|g)\)\s*$/i);
   if(state)value=value.slice(0,state.index).trim();
   const coefficient=value.match(/^(\d+)\s*/);const n=coefficient?Number(coefficient[1]):1;
   if(!Number.isInteger(n)||n<1||n>100)throw new Error('Hệ số phải là số nguyên 1–100.');
   if(coefficient)value=value.slice(coefficient[0].length);
   const formula=plainFormula(value);parseFormula(formula);
   const chemical=catalog.find(c=>plainFormula(c.formula)===formula);
   const phase=state?({s:'solid',l:'liquid',aq:'aqueous',g:'gas'} as const)[state[1].toLowerCase() as 's'|'l'|'aq'|'g']:chemical?phaseToState(chemical.phase):'aqueous';
   return {formula,coefficient:n,state:phase};
  });
 };
 return {reactants:parse(sides[0]),products:parse(sides[1])};
}
export function checkDefinitionBalance(definition:Pick<ReactionDefinition,'reactants'|'products'>){
 const catalog=Object.fromEntries([...definition.reactants,...definition.products].map(p=>[p.formula,{formula:p.formula}]));
 return checkEquation(definition.reactants.map(p=>({chemical:p.formula,coefficient:p.coefficient})),definition.products.map(p=>({chemical:p.formula,coefficient:p.coefficient})),catalog);
}

const string={type:'string',maxLength:3000};
const species={type:'array',minItems:1,maxItems:12,items:{type:'object',additionalProperties:false,properties:{formula:{type:'string',maxLength:100},coefficient:{type:'integer',minimum:1,maximum:100},state:{type:'string',enum:['solid','liquid','aqueous','gas']}},required:['formula','coefficient','state']}};
export const reactionDefinitionSchema={type:'object',additionalProperties:false,properties:{schemaVersion:{type:'integer',enum:[1]},name:string,reactants:species,products:species,conditions:{type:'object',additionalProperties:false,properties:{contactRequired:{type:'boolean'},heatingRequired:{type:'boolean'},minTemperature:{type:'number',minimum:20,maximum:98},catalysts:{type:'array',maxItems:4,items:{type:'string',maxLength:100}}},required:['contactRequired','heatingRequired','minTemperature','catalysts']},observation:string,explanation:string,source:{type:'string',maxLength:1000},durationSeconds:{type:'number',minimum:1,maximum:120},learning:{type:'object',additionalProperties:false,properties:{grade:{type:'integer',minimum:8,maximum:12},purpose:string,mode:{type:'string',enum:['guided','exploration']},explanationLevel:{type:'string',enum:['brief','detailed']},objectives:string,instructions:string},required:['grade','purpose','mode','explanationLevel','objectives','instructions']},questions:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{id:{type:'string',maxLength:100},type:{type:'string',enum:['multiple-choice','true-false','equation','observation','explanation','calculation','application']},prompt:string,choices:{type:'array',maxItems:6,items:{type:'string',maxLength:1000}},answer:string,reviewed:{type:'boolean'},difficulty:{type:'string',enum:['easy','medium','hard']},objective:{type:'string',maxLength:1000},points:{type:'number',minimum:0,maximum:10}},required:['id','type','prompt','choices','answer','reviewed','difficulty','objective','points']}}},required:['schemaVersion','name','reactants','products','conditions','observation','explanation','source','durationSeconds','learning','questions']} as const;
