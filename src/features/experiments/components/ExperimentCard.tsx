import { ArrowUpRight,Clock3,GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LabArt } from '../../../shared/components/LabArt';
import { ReactionArt } from '../../../shared/components/ReactionArt';
import type { DocumentActivity } from '../documentActivities';
import type { Experiment } from '../data';
export function ExperimentCard({e,index=0,learningStatus,practice=false}:{e:Experiment|DocumentActivity;index?:number;learningStatus?:string;practice?:boolean}) {
 const product='product' in e?e.product:undefined;
 const access='access' in e?e.access:'free';const ownerId='ownerId' in e?e.ownerId:undefined;
 const variant=product==='H2'?'hydrogen':product==='NaCl'?'neutralization':product==='O2'?'oxygen':product==='Cu(OH)2'?'precipitate':undefined;
 return <Link to={(practice?'/practice/':'/experiments/')+e.id} className={'experiment-card variant-'+index%4}><div className="experiment-visual"><span className={'tag grade '+(!practice&&access==='premium'?'paid':'')}>{practice?'Tự do · Miễn phí':ownerId?'Bài của lớp':access==='premium'?'Trả phí':'Miễn phí'}</span>{'art' in e?<ReactionArt art={e.art} label={e.title}/>:variant?<LabArt variant={variant} small/>:<div className="custom-experiment-art"><GraduationCap size={48}/><span>Bài thực hành tùy chỉnh</span></div>}<span className="visual-number">{'code' in e?e.code:practice&&e.id==='hydrogen'?'01':practice&&e.id==='precipitate'?'02':String(index+1).padStart(2,'0')}</span></div><div className="experiment-body"><div className="eyebrow">{e.topic}</div><h3>{e.title}</h3><p>{e.subtitle}</p><div className="card-meta"><span><GraduationCap size={15}/>Lớp {e.grade}</span><span><Clock3 size={15}/>{e.minutes} phút</span><span>{e.difficulty}</span></div>{learningStatus&&<div className="learning-status">{learningStatus}</div>}<div className="card-start">{practice?'Thử phản ứng ngay':'Khám phá thí nghiệm'} <ArrowUpRight size={18}/></div></div></Link>;
}

