export interface Log {time:string;message:string}
export const logAction=(message:string):Log=>({time:new Date().toISOString(),message});
