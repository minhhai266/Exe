import {phenomenonTemplates} from '../../engine/phenomena';
import './phenomenon-badges.css';
export function PhenomenonBadges({codes}:{codes?:string[]}){
 const items=phenomenonTemplates.filter(item=>codes?.includes(item.code));
 if(!items.length)return null;
 return <div className="reaction-phenomenon-badges" aria-label="Hiện tượng cần quan sát">{items.map(item=><span key={item.code} title={item.constraint}>{item.name}</span>)}</div>;
}
