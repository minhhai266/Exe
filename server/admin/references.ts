import type {AdminDatabase} from './database';
import {ApiError} from './security';

type LinkedResource='chemicals'|'apparatus'|'reactions'|'experiments';
const fields={chemicals:'chemicalIds',apparatus:'apparatusIds',reactions:'reactionIds'} as const;

export function requireContentReference(store:AdminDatabase,resource:LinkedResource,id:string,published:boolean){
 const table=resource==='experiments'?'experiment_catalog':resource;
 const row=store.get(`SELECT status FROM ${table} WHERE id=?`,id);
 if(!row)throw new ApiError(400,'Liên kết kiến thức hoặc thí nghiệm không tồn tại.');
 if(published&&row.status!=='published')throw new ApiError(400,'Chỉ liên kết nội dung và thí nghiệm đã xuất bản khi phát hành E-book.');
}

export function protectBookReferences(store:AdminDatabase,resource:LinkedResource,id:string){
 const query=resource==='experiments'
  ? "JOIN lesson_experiment_links r ON r.lesson_id=l.id WHERE e.status='published' AND r.experiment_id=?"
  : `JOIN json_each(l.data,'$.${fields[resource]}') r WHERE e.status='published' AND r.value=?`;
 const book=store.get(`SELECT e.name FROM ebooks e JOIN ebook_chapters c ON c.ebook_id=e.id JOIN ebook_lessons l ON l.chapter_id=c.id ${query} LIMIT 1`,id);
 if(book)throw new ApiError(409,`Nội dung đang được E-book “${book.name}” đã xuất bản sử dụng. Cập nhật hoặc thu hồi sách trước khi thu hồi nội dung liên kết.`);
}
