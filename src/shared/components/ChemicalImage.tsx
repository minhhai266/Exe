import {useState} from 'react';
import './chemical-image.css';

interface ChemicalImageProps{src?:string;name:string;caption?:string;credit?:string}
export function ChemicalImage(props:ChemicalImageProps){
 return props.src?<ImageContent key={props.src} {...props} src={props.src}/>:null;
}
function ImageContent({src,name,caption,credit}:ChemicalImageProps&{src:string}){
 const [failed,setFailed]=useState(false);
 if(failed)return <p className="chemical-image-unavailable">Chưa tải được ảnh mô tả {name}.</p>;
 return <figure className="chemical-reference-image">
  <img src={src} alt={caption||`Ảnh mô tả ${name}`} loading="lazy" onError={()=>setFailed(true)}/>
  <figcaption><strong>Hình ảnh nhận biết</strong>{caption&&<span>{caption}</span>}{credit&&<small>Nguồn ảnh: {credit}</small>}</figcaption>
 </figure>;
}
