import { useServerCatalog } from '../../admin/catalogStore';
import { useAuth } from "../../auth/authStore";
import { inClass,useClassrooms } from "../../classrooms/classroomStore";
import { useStore } from "../../lab/labStore";
import { experiments } from "../data";
export function useExperiments(includeOwnDrafts=false){const published=useServerCatalog(s=>s.experiments);const library=[...experiments,...published.filter(e=>!experiments.some(base=>base.id===e.id))];const templates=useStore(s=>s.templates);const user=useAuth(s=>s.user);const classes=useClassrooms(s=>s.classes);const assignments=useClassrooms(s=>s.assignments);return [...library,...templates.filter(t=>!!user&&((includeOwnDrafts&&t.ownerId===user.id)||t.status==='published'&&(t.ownerId===user.id||assignments.some(a=>a.experimentId===t.id&&classes.some(c=>c.id===a.classId&&inClass(c,user.id))))))];}
