import { FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Logo(){return <Link className="logo" to="/"><span className="logo-mark"><FlaskConical size={24}/></span><span>virtual<span className="logo-light">lab</span><sup>2D</sup></span></Link>}
