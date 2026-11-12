import {describe,it,expect,vi} from 'vitest';
import {generateReactionDraft} from "./geminiPlugin";
import {draftFromRule} from "../src/engine/reactionAuthoring";
import {reactionRules} from "../src/engine/reactionRules";
const config={GEMINI_API_KEY:'test-only-secret',GEMINI_MODEL:'configured-model'};
describe('Gemini draft adapter',()=>{
 it('sends structured instructions and only returns validated whitelisted fields',async()=>{
  const draft={...draftFromRule(reactionRules[2]),title:'Test',source:'https://chem.example.edu/reaction',untrusted:'drop this'};
  const mock=vi.fn().mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(draft)}]}}]})));
  const result=await generateReactionDraft('Soạn bài kết tủa xanh',config,mock);
  expect(result).not.toHaveProperty('untrusted');expect(JSON.stringify(result)).not.toContain('test-only-secret');
  expect(mock.mock.calls[0][0]).toContain('configured-model:generateContent');
  expect(JSON.parse(mock.mock.calls[0][1].body).generationConfig.responseMimeType).toBe('application/json');
 });
 it('reports missing config, quotas and malformed chemistry',async()=>{
  await expect(generateReactionDraft('Test request',{})).rejects.toThrow('Chưa cấu hình');
  await expect(generateReactionDraft('Test request',config,vi.fn().mockResolvedValue(new Response('',{status:429})))).rejects.toThrow('giới hạn');
  await expect(generateReactionDraft('Test request',config,vi.fn().mockResolvedValue(new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'{}'}]}}]}))))).rejects.toThrow('Bản nháp Gemini cần sửa');
 });
});
