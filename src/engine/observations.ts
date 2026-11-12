import type { Log } from "./experimentLogger";
export const observation=(message:string):Log=>({message,time:new Date().toISOString()});
