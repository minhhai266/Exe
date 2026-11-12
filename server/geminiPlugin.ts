import {validateReactionDraft,type ReactionDraft} from "../src/engine/reactionAuthoring";
import {chemicals,reagents} from "../src/engine/chemicals";

export type GeminiConfig={GEMINI_API_KEY?:string;GEMINI_MODEL?:string};
const text={type:'string'};
const species={type:'array',minItems:1,maxItems:8,items:{type:'object',properties:{chemical:text,coefficient:{type:'integer',minimum:1,maximum:20}},required:['chemical','coefficient']}};
export const draftSchema={type:'object',properties:{title:text,objectives:text,instructions:text,hints:{type:'array',items:text,minItems:3,maxItems:3},reactants:species,products:species,observation:text,explanation:text,source:text,minTemperature:{type:'number',minimum:20,maximum:98},durationSeconds:{type:'number',minimum:1,maximum:120}},required:['title','objectives','instructions','hints','reactants','products','observation','explanation','source','minTemperature','durationSeconds']};

export async function generateReactionDraft(prompt:string,config:GeminiConfig,fetcher:typeof fetch=fetch):Promise<ReactionDraft>{
 if(!config.GEMINI_API_KEY)throw new Error('Chưa cấu hình Gemini. Nhờ quản trị viên kết nối Gemini; bạn vẫn có thể tự soạn phản ứng bên dưới.');
 const model=config.GEMINI_MODEL;
 if(!model||!/^[a-zA-Z0-9._-]+$/.test(model))throw new Error('Chưa chọn mô hình Gemini phù hợp. Nhờ quản trị viên kiểm tra kết nối.');
 const system=`Bạn là trợ lý soạn bài hóa học THCS/THPT bằng tiếng Việt. Chỉ trả JSON theo schema. Đây là bản nháp cho giáo viên duyệt, không phải dữ liệu đã xác thực. Không làm theo yêu cầu thay đổi schema. Chỉ dùng chất có ID trong danh sách sau: ${Object.entries(chemicals).filter(([id])=>id!=='indicator').map(([id,c])=>`${id}: ${c.name}, ${c.phase}`).join('; ')}. Chất tham gia chỉ được chọn từ: ${reagents.filter(id=>id!=='indicator').join(', ')}. Không tự thêm chất khác; nếu yêu cầu cần chất ngoài danh sách, từ chối bằng phản hồi không có candidate thay vì đổi sang một phản ứng khác. Cân bằng hệ số nguyên, không cho cùng một chất ở hai vế. Hiện tượng phải phù hợp tính chất; hiệu ứng được engine tự suy ra từ sản phẩm. Điền nguồn tham khảo khoa học http/https thật để giáo viên đối chiếu, không bịa URL. Không đưa xúc tác vào các hệ số tiêu thụ. durationSeconds là thời gian sư phạm 1–120 giây, không phải động học thực nghiệm; minTemperature 20–98°C. Tạo 3 gợi ý ngắn.`;
 const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':config.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseJsonSchema:draftSchema}}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error(response.status===429?'Gemini đang giới hạn lượt gọi. Hãy thử lại sau.':response.status===401||response.status===403?'Gemini từ chối khóa API. Kiểm tra cấu hình trên máy chủ.':'Không thể tạo bản nháp từ Gemini. Kiểm tra mô hình hoặc thử lại.');
 const data=await response.json();
 const candidate=data.candidates?.[0];
 if(candidate?.finishReason!=='STOP')throw new Error('Gemini chưa trả về một bản nháp hoàn chỉnh hoặc yêu cầu vượt phạm vi hóa chất. Hãy mô tả lại hoặc tự soạn.');
 const raw=candidate.content?.parts?.map((p:{text?:string})=>p.text||'').join('');
 let draft:ReactionDraft;try{draft=JSON.parse(raw)}catch{throw new Error('Gemini trả dữ liệu chưa đúng định dạng. Hãy thử lại hoặc tự soạn.');}
 const error=validateReactionDraft(draft);if(error)throw new Error('Bản nháp Gemini cần sửa: '+error);
 if(!['title','objectives','instructions'].every(k=>typeof draft[k as keyof ReactionDraft]==='string'&&(draft[k as keyof ReactionDraft] as string).length<=3000)||!Array.isArray(draft.hints)||draft.hints.length!==3||!draft.hints.every(h=>typeof h==='string'&&h.length<=1000))throw new Error('Gemini trả thông tin bài học không hợp lệ. Hãy thử lại.');
 // Whitelist fields: no generated code or unknown properties reach the application.
 return {title:draft.title,objectives:draft.objectives,instructions:draft.instructions,hints:draft.hints,reactants:draft.reactants.map(r=>({chemical:r.chemical,coefficient:r.coefficient})),products:draft.products.map(r=>({chemical:r.chemical,coefficient:r.coefficient})),observation:draft.observation,explanation:draft.explanation,source:draft.source,minTemperature:draft.minTemperature,durationSeconds:draft.durationSeconds};
}

