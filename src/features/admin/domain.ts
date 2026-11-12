export const adminModules=[
 {key:'dashboard',label:'Dashboard',group:'TỔNG QUAN',path:'/admin'},
 {key:'chemicals',label:'Hóa chất',group:'THƯ VIỆN HÓA HỌC',path:'/admin/chemicals'},
 {key:'apparatus',label:'Dụng cụ thí nghiệm',group:'THƯ VIỆN HÓA HỌC',path:'/admin/apparatus'},
 {key:'reactions',label:'Phản ứng & hiệu ứng',group:'THƯ VIỆN HÓA HỌC',path:'/admin/reactions'},
 {key:'ebooks',label:'E-book',group:'THƯ VIỆN HÓA HỌC',path:'/admin/ebooks'},
 {key:'schools',label:'Nhà trường',group:'QUẢN LÝ HỆ THỐNG',path:'/admin/schools'},
 {key:'users',label:'Tài khoản & phân quyền',group:'QUẢN LÝ HỆ THỐNG',path:'/admin/users'},
] as const;
export type Resource='chemicals'|'apparatus'|'reactions'|'ebooks'|'schools'|'users';
export type AdminRole='SYSTEM_ADMIN'|'SCHOOL_ADMIN'|'TEACHER'|'STUDENT';
export interface ServerUser{id:string;name:string;email:string;role:AdminRole;schoolId:string|null;schoolName?:string;status:string;createdAt:string;version:number}
export type ContentStatus='draft'|'published'|'archived';
export interface AdminRecord{id:string;code:string;name:string;status:string;createdAt:string;updatedAt:string;version:number;data:Record<string,any>;schoolId?:string|null;[key:string]:any}
export interface PageResult<T=AdminRecord>{items:T[];total:number;page:number;pageSize:number}
export interface ContentBlock{id:string;type:'heading'|'paragraph'|'image'|'table'|'formula'|'equation'|'callout'|'video'|'link'|'experiment';text:string;url?:string;rows?:string[][]}
export interface BookLesson{id:string;title:string;blocks:ContentBlock[];experimentId?:string;chemicalIds?:string[];reactionIds?:string[];apparatusIds?:string[]}
export interface BookChapter{id:string;title:string;lessons:BookLesson[]}
export interface EquationParticipant{chemical:string;coefficient:number}
const subs='₀₁₂₃₄₅₆₇₈₉';
export function plainFormula(value:string){return value.replace(/[₀-₉]/g,c=>String(subs.indexOf(c))).replace(/\s/g,'')}
const elements=new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' '));
/** Formula grammar with nested parentheses, hydrate groups and explicit ionic charge. */
export function parseFormula(input:string):{atoms:Record<string,number>;charge:number}{
 let value=plainFormula(input),charge=0;
 const ion=value.match(/\^(\d*)([+-])$/);if(ion){charge=(Number(ion[1]||1))*(ion[2]==='+'?1:-1);value=value.slice(0,ion.index)}
 if(!value||value.length>100||/[^A-Za-z0-9()·.]/.test(value))throw new Error('Công thức chưa đúng cú pháp. Điện tích dùng dạng ^2+ hoặc ^-.');
 const total:Record<string,number>={};
 for(const part of value.split(/[·.]/)){
  let pos=0;const leading=part.match(/^\d+/);const multiplier=leading?Number(leading[0]):1;if(leading)pos=leading[0].length;
  const number=()=>{const m=part.slice(pos).match(/^\d+/);if(!m)return 1;pos+=m[0].length;const n=Number(m[0]);if(n<1||n>1000)throw new Error('Chỉ số nguyên tử nằm ngoài phạm vi.');return n};
  const group=(nested=false):Record<string,number>=>{const atoms:Record<string,number>={};let count=0;while(pos<part.length&&part[pos]!==')'){let child:Record<string,number>;if(part[pos]==='('){pos++;child=group(true);if(part[pos++]!==')')throw new Error('Thiếu dấu ngoặc đóng.')}else{const match=part.slice(pos).match(/^[A-Z][a-z]?/);if(!match||!elements.has(match[0]))throw new Error('Ký hiệu nguyên tố không hợp lệ.');pos+=match[0].length;child={[match[0]]:1}}const n=number();for(const [e,k] of Object.entries(child))atoms[e]=(atoms[e]||0)+k*n;count++}if(!count||!nested&&pos!==part.length)throw new Error('Nhóm công thức không hợp lệ.');return atoms};
  if(!Number.isFinite(multiplier)||multiplier<1||multiplier>1000)throw new Error('Hệ số nhóm không hợp lệ.');for(const [e,n] of Object.entries(group()))total[e]=(total[e]||0)+n*multiplier;
 }
 return {atoms:total,charge};
}
export function checkEquation(reactants:EquationParticipant[],products:EquationParticipant[],catalog:Record<string,{formula:string}>){
 const sum=(rows:EquationParticipant[])=>{if(!rows.length||rows.length>12)throw new Error('Mỗi vế cần 1–12 chất.');const atoms:Record<string,number>={};let charge=0;const seen=new Set<string>();for(const r of rows){if(seen.has(r.chemical))throw new Error('Chất bị trùng trên cùng một vế.');seen.add(r.chemical);if(!Number.isInteger(r.coefficient)||r.coefficient<1||r.coefficient>100)throw new Error('Hệ số phải là số nguyên 1–100.');const c=catalog[r.chemical];if(!c)throw new Error('Chất không tồn tại trong thư viện.');const parsed=parseFormula(c.formula);charge+=parsed.charge*r.coefficient;for(const [e,n] of Object.entries(parsed.atoms))atoms[e]=(atoms[e]||0)+n*r.coefficient}return {atoms,charge}};
 const a=sum(reactants),b=sum(products);if(a.charge!==b.charge)throw new Error('Phương trình chưa cân bằng điện tích.');if([...new Set([...Object.keys(a.atoms),...Object.keys(b.atoms)])].some(e=>(a.atoms[e]||0)!==(b.atoms[e]||0)))throw new Error('Phương trình chưa cân bằng nguyên tố.');
 if(reactants.some(a=>products.some(b=>a.chemical===b.chemical)))throw new Error('Không lặp chất ở hai vế; khai báo xúc tác trong điều kiện.');return true;
}
export const effectTemplates=[
 {code:'bubbles',name:'Bọt khí',description:'Hạt khí sinh ra từ phản ứng có sản phẩm khí.',parameters:['durationSeconds'],requires:'gas'},
 {code:'precipitate',name:'Tạo kết tủa',description:'Pha rắn xuất hiện trong dung dịch.',parameters:['durationSeconds'],requires:'precipitate'},
 {code:'neutral',name:'Trung hòa / chỉ thị',description:'Màu chỉ thị tính từ hệ HCl/NaOH đã hỗ trợ.',parameters:['durationSeconds'],requires:'neutralization'},
 {code:'none',name:'Không có hiệu ứng bổ sung',description:'Chỉ tính lượng chất theo quy tắc đã kiểm chứng.',parameters:['durationSeconds'],requires:'any'},
] as const;
export function safeUrl(value:string,allowRelative=false){if(!value)return '';if(allowRelative&&/^\/api\/admin\/assets\/[a-zA-Z0-9-]+$/.test(value))return value;const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error('Liên kết cần dùng http/https hợp lệ.');return u.href}
