import { useId } from 'react';
import type { ActivityArt } from '../../features/experiments/documentActivities';
import { LabArt } from './LabArt';

interface Props {art:ActivityArt;label:string;progress?:number;active?:boolean;litmusTested?:{acid:boolean;base:boolean};baseExcess?:boolean;copperExcess?:boolean;precipitateFraction?:number}
export function ReactionArt({art,label,progress=1,active=false,litmusTested={acid:true,base:true},baseExcess=false,copperExcess=false,precipitateFraction=1}:Props){
  const uid=useId().replace(/:/g,'');
  const p=Math.max(0,Math.min(1,progress));
  if(art==='hydrogen')return <LabArt variant="hydrogen" small active={active||p>0}/>;
  const ink='#567f91', glass='#8bafbc', clear='#dceef0', white='#f8faf6';
  const beaker=(x:number,y:number,color:string,children?:React.ReactNode)=><g transform={`translate(${x} ${y})`}><path d="M-60-120H60L55-112V0Q55 12 43 12H-43Q-55 12-55 0V-112Z" fill="#ffffff66" stroke={glass} strokeWidth="2"/><path d="M-52-65H52V0Q52 9 42 9H-42Q-52 9-52 0Z" fill={color}/><ellipse cy="-65" rx="52" ry="5" fill={color} stroke={glass} strokeWidth=".6"/>{children}<path d="M28-98h15m-10 20h10m-15 20h15m-10 20h10" stroke={ink} opacity=".5"/><path d="M-47-104v99" stroke="white" strokeWidth="3" opacity=".65"/></g>;
  const tube=(x:number,y:number,color:string,children?:React.ReactNode)=><g transform={`translate(${x} ${y})`}><path d="M-20-130H20V-8a20 20 0 0 1-40 0Z" fill="#ffffff66" stroke={glass} strokeWidth="2"/><path d="M-17-60H17V-8a17 17 0 0 1-34 0Z" fill={color}/>{children}<path d="M-13-118v105" stroke="white" strokeWidth="3" opacity=".6"/></g>;
  const bubbles=(x:number,y:number)=><g className={active?'document-bubbles':''} opacity={p}>{[0,1,2,3,4].map(n=><circle key={n} cx={x+(n%2)*13} cy={y-n*16} r={3+n%2} fill="white" stroke="#8db7bc" style={{animationDelay:`${n*.2}s`}}/>)}</g>;
  const flame=(x:number,y:number)=><g transform={`translate(${x} ${y})`}><rect x="-20" y="12" width="40" height="24" rx="9" fill="#91b4b1"/><path d="M-5 12v-9h10v9" fill="#597a7b"/><path d="M0 1C-21-11 4-28 0-40C28-16 17 2 0 1" fill="#e6aa70"/><path d="M0 0C-10-7 1-16 3-24C13-9 10-1 0 0" fill="#f4d896"/></g>;
  const caption=(text:string)=><text x="240" y="287" textAnchor="middle" fill={ink} fontSize="12">{text}</text>;
  const powder=(color:string)=><path d="M-50 0q12-15 25-5t25-3 25 4 25-1v5q0 9-10 9h-80q-10 0-10-9Z" fill={color} opacity={p*precipitateFraction}/>;
  return <svg className={`lab-art document-reaction-art ${active?'reaction-active':''}`} viewBox="0 0 480 310" role="img" aria-label={label}>
    <defs><pattern id={uid} width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#92b4b8" opacity=".22"/></pattern><linearGradient id={`${uid}-silver`}><stop stopColor="#83949f"/><stop offset=".45" stopColor="#fff"/><stop offset=".7" stopColor="#9eaeb8"/><stop offset="1" stopColor="#edf4f5"/></linearGradient></defs>
    <rect width="480" height="310" fill={`url(#${uid})`}/><ellipse cx="240" cy="262" rx="170" ry="10" fill="#466b6c" opacity=".08"/><path d="M55 260H425" stroke="#abc3c9"/>
    {art==='litmus'&&<>
      {beaker(150,244,clear)}{beaker(330,244,clear)}
      <g transform="rotate(-12 150 140)"><rect x="140" y="77" width="16" height="120" rx="3" fill="#b399c8"/><rect x="140" y="152" width="16" height="45" rx="2" fill={litmusTested.acid?'#d77d8e':'#b399c8'}/></g>
      <g transform="rotate(12 330 140)"><rect x="324" y="77" width="16" height="120" rx="3" fill="#b399c8"/><rect x="324" y="152" width="16" height="45" rx="2" fill={litmusTested.base?'#70a4cc':'#b399c8'}/></g>
      <text x="150" y="220" textAnchor="middle" fill={ink} fontSize="15">HCl</text><text x="330" y="220" textAnchor="middle" fill={ink} fontSize="15">NaOH</text>{caption('Quỳ tím: axit → đỏ · bazơ → xanh')}
    </>}
    {(art==='neutralization'||art==='silver-chloride')&&<>
      <g transform="rotate(27 135 100)">{tube(135,161,clear)}</g><text x="80" y="45" fill={ink} fontSize="14">{art==='neutralization'?'HCl':'AgNO₃'}</text><path d="M170 144q12 20 0 23q-12-3 0-23Z" fill="#a7d4df"/>
      {beaker(273,244,art==='neutralization'?(baseExcess||p<1?`rgba(220,137,178,${.45*(1-p)+.12})`:clear):p>0?'#eef1e7':clear,art==='silver-chloride'?powder(white):undefined)}
      <text x="273" y="220" textAnchor="middle" fill={ink} fontSize="14">{art==='neutralization'?'NaCl + H₂O':'AgCl ↓'}</text><text x="355" y="128" fill={ink} fontSize="14">{art==='neutralization'?'NaOH':'NaCl'}</text>{caption(art==='neutralization'?'HCl + NaOH → NaCl + H₂O':'Kết tủa trắng bạc clorua')}
    </>}
    {art==='iron'&&<>
      {beaker(242,244,p===0||copperExcess?'#8bc6df':'#c9ddcc',<g transform="rotate(16)"><path d="M-8-172h24v7H8v140H-2v-140H-8Z" fill="#98a5ab"/><path d="M-2-60H8v35H-2Z" fill="#bb805d" opacity={p}/></g>)}<text x="242" y="48" textAnchor="middle" fill={ink} fontSize="14">Fe</text><text x="325" y="153" fill={ink} fontSize="14">CuSO₄</text><path d="m317 196-63 19" stroke="#a77e64"/><text x="328" y="197" fill="#a77e64" fontSize="13">Cu bám</text>{caption('Lớp đồng nâu đỏ trên đinh sắt')}
    </>}
    {(art==='carbonate'||art==='limewater')&&<>
      {tube(130,244,clear,<g fill="#e4dfcf" stroke="#c0bda9"><path d="m-10-9 8-9 9 11-6 8Z"/><path d="m2-25 10-6 3 10-9 4Z"/></g>)}
      <rect x="109" y="109" width="42" height="13" rx="3" fill="#779592"/><path d="M130 110V84q0-12 12-12h132q16 0 16 16v134" fill="none" stroke="#94b5bb" strokeWidth="7"/><path d="M130 110V84q0-12 12-12h132q16 0 16 16v134" fill="none" stroke="white" strokeWidth="2"/>
      {beaker(321,244,art==='limewater'&&p*precipitateFraction>0?'#e9eee5':clear,art==='limewater'?powder(white):undefined)}{bubbles(125,212)}{bubbles(294,222)}
      <text x="86" y="51" fill={ink} fontSize="13">CaCO₃ + HCl</text><text x="214" y="53" fill={ink} fontSize="15">CO₂ →</text><text x="321" y="158" textAnchor="middle" fill={ink} fontSize="13">{art==='limewater'?'Ca(OH)₂':'CO₂'}</text>{caption(art==='limewater'?'Nước vôi trong hóa đục':'Đá vôi + axit → khí CO₂')}
    </>}
    {art==='oxygen-heat'&&<>
      <g transform="rotate(62 180 130)">{tube(180,165,'#95769e',<path d="M-15-12h30v12q-15 21-30 0Z" fill={p>0?'#69624d':'#80598b'}/>)}</g>
      <path d="M264 85V67q0-12 12-12h66q16 0 16 16v155" fill="none" stroke="#94b5bb" strokeWidth="6"/>{tube(358,244,'#e0eef0')}{bubbles(356,222)}{flame(132,215)}<text x="87" y="65" fill={ink} fontSize="14">KMnO₄</text><text x="390" y="100" fill={ink} fontSize="18">O₂ ↑</text>{caption('Phân hủy KMnO₄ bằng nhiệt')}
    </>}
    {art==='copper'&&<>
      <path d="M106 120h72" stroke="#7a9698" strokeWidth="8"/><path d="m175 100 150-16 6 50-151 16Z" fill="#b77a59" stroke="#966747"/><path d="m175 100 150-16 6 50-151 16Z" fill="#3f4546" opacity={p}/>{flame(250,212)}<text x="240" y="61" textAnchor="middle" fill={ink} fontSize="15">Cu + O₂</text><text x="345" y="145" fill={ink} fontSize="14">CuO đen</text>{caption('Đun nóng: đồng đỏ nâu → lớp oxit đen')}
    </>}
    {(art==='ester'||art==='silver-mirror')&&<>
      {beaker(235,244,'#c9e0e5')}{tube(235,201,art==='ester'?'#f1dfa8':clear,art==='silver-mirror'?<path d="M-16-85V-8a16 16 0 0 0 32 0V-85" fill="none" stroke={`url(#${uid}-silver)`} strokeWidth="8" opacity={p}/>:undefined)}
      <text x="235" y="46" textAnchor="middle" fill={ink} fontSize="13">{art==='ester'?'CH₃COOH + C₂H₅OH':'Glucozơ + Tollens'}</text><text x="335" y="186" fill={ink} fontSize="13">Bể nước</text>
      {art==='ester'?<g opacity={p}><circle cx="333" cy="85" r="13" fill="#d4bb8f"/><circle cx="363" cy="99" r="9" fill="#afc6b1"/><path d="m345 91 10 5" stroke={ink} strokeWidth="3"/><text x="330" y="128" fill={ink} fontSize="12">Este</text></g>:<g opacity={p} fill="#8da2ae"><path d="m325 95 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z"/><text x="313" y="145" fill={ink} fontSize="13">Lớp Ag sáng</text></g>}{caption(art==='ester'?'Xúc tác H₂SO₄ · làm ấm bằng bể nước':'Glucozơ khử Ag(I) thành bạc kim loại')}
    </>}
    {art==='soap'&&<>
      {beaker(218,244,p>0?'#e5ddba':'#ead69b')}<path d="m240 74-33 147" stroke="#819e9a" strokeWidth="6"/><text x="204" y="65" textAnchor="middle" fill={ink} fontSize="14">Chất béo + NaOH</text>
      <g opacity={p}><rect x="320" y="190" width="69" height="37" rx="12" fill="#c9dbbc" stroke="#a2b498"/><text x="354" y="213" textAnchor="middle" fill={ink} fontSize="12">Xà phòng</text><text x="354" y="245" textAnchor="middle" fill={ink} fontSize="12">+ glixerol</text></g>{caption('Thủy phân chất béo trong môi trường kiềm')}
    </>}
  </svg>;
}
