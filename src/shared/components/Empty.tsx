import { ArrowRight,FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Empty({text='Chưa có dữ liệu',description,to='/experiments',button='Khám phá thí nghiệm'}:{text?:string;description?:string;to?:string;button?:string}){return <div className="empty"><FlaskConical size={34} aria-hidden="true"/><h3>{text}</h3>{description&&<p>{description}</p>}<Link className="btn primary" to={to}>{button}<ArrowRight size={16}/></Link></div>}
