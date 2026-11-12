import { BookOpen } from 'lucide-react';
export function ContextEmpty({title,description,action,label}:{title:string;description:string;action?:()=>void;label?:string}){return <div className="empty"><BookOpen size={30} aria-hidden="true"/><h3>{title}</h3><p>{description}</p>{action&&label&&<button className="btn white" onClick={action}>{label}</button>}</div>}
