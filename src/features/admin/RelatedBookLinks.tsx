import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useServerCatalog } from './catalogStore';
export function RelatedBookLinks({experimentId}:{experimentId:string}){const books=useServerCatalog(s=>s.ebooks);const links=books.flatMap(b=>b.data.chapters.flatMap((c:any)=>c.lessons.filter((l:any)=>l.experimentId===experimentId).map((l:any)=>({book:b.id,lesson:l.id,title:l.title})))).slice(0,3);return links.length?<details className="property-section related-book-links"><summary><BookOpen size={14}/>Kiến thức liên quan</summary>{links.map(l=><Link key={l.lesson} className="text-link" to={`/ebooks/${l.book}?lesson=${l.lesson}`} target="_blank" rel="noopener noreferrer">{l.title}</Link>)}</details>:null}
