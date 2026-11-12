/** Calendar dates in the reporting timezone, independent of the host/browser timezone. */
export const reportingTimeZone='Asia/Ho_Chi_Minh';
export function reportingDate(value:Date=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:reportingTimeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
 const part=(type:string)=>parts.find(item=>item.type===type)!.value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}
export function validReportingDate(value:string){
 return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
}
export function reportingRange(from:string,to:string){
 return [new Date(from+'T00:00:00+07:00').toISOString(),new Date(to+'T23:59:59.999+07:00').toISOString()];
}
