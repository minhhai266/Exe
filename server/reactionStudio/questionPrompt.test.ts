import {describe,it,expect,vi} from 'vitest';
import {GeminiReactionProvider,questionSystemPrompt} from './provider';
import type {ReactionDefinition} from '../../src/engine/reactionDefinition';

const definition:ReactionDefinition={schemaVersion:1,name:'Trung hòa',reactants:[{formula:'HCl',coefficient:1,state:'aqueous'},{formula:'NaOH',coefficient:1,state:'aqueous'}],products:[{formula:'NaCl',coefficient:1,state:'aqueous'},{formula:'H2O',coefficient:1,state:'liquid'}],conditions:{contactRequired:true,heatingRequired:false,minTemperature:20,catalysts:[]},observation:'Không tự đổi màu khi chưa có chỉ thị.',explanation:'Ion H⁺ và OH⁻ tạo nước.',source:'',durationSeconds:10,learning:{grade:9,purpose:'Hiểu phản ứng trung hòa',mode:'guided',explanationLevel:'detailed',objectives:'Quan sát và giải thích phản ứng',instructions:'Trộn hai dung dịch trong mô phỏng.'},questions:[]};
const generated=['observation','explanation','equation'].map((type,i)=>({id:'q'+i,type,prompt:'Câu hỏi '+(i+1),choices:[],answer:'Đáp án cho giáo viên.',reviewed:true,difficulty:i===0?'easy':'medium',objective:'Giải thích phản ứng trung hòa',points:1}));
const response=(value:unknown)=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]}));
describe('Question generation prompt and structured output',()=>{
 it('sends grade and reaction context with the question schema and keeps teacher review mandatory',async()=>{
  const fetcher=vi.fn().mockResolvedValue(response(generated));
  const provider=new GeminiReactionProvider({GEMINI_API_KEY:'test-private-key',GEMINI_MODEL:'test-model'},fetcher);
  const result=await provider.questions(definition),request=JSON.parse(fetcher.mock.calls[0][1].body);
  expect(request.systemInstruction.parts[0].text).toBe(questionSystemPrompt);
  expect(request.generationConfig.responseJsonSchema.type).toBe('array');
  const input=JSON.parse(request.contents[0].parts[0].text);expect(input.learning.grade).toBe(9);expect(input.reactants).toEqual(definition.reactants);expect(input.questions).toEqual([]);
  expect(JSON.stringify(request)).not.toContain('test-private-key');expect(result).toHaveLength(3);expect(result.every(q=>q.reviewed===false)).toBe(true);
 });
 it('rejects malformed question output instead of importing it into the lesson',async()=>{
  const fetcher=vi.fn().mockResolvedValue(response([{...generated[0],type:'unsupported-kind'}]));
  const provider=new GeminiReactionProvider({GEMINI_API_KEY:'test-key',GEMINI_MODEL:'test-model'},fetcher);
  await expect(provider.questions(definition)).rejects.toThrow('câu hỏi không hợp lệ');
 });
});
