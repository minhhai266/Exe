from pathlib import Path
def edit(path,before,after):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if before not in s:raise RuntimeError('Missing '+path+': '+before[:90])
 p.write_text(s.replace(before,after),encoding='utf-8')

p='server/admin/database.ts'
edit(p,"r.id==='oxygen'?60:10", "r.id==='oxygen'?60:r.id==='precipitate'?7:r.id==='neutralization'?6:10")
edit(p,"INSERT INTO experiment_catalog VALUES(?,?,?)", "INSERT INTO experiment_catalog(id,name,data) VALUES(?,?,?)")
p='server/admin/service.ts'
edit(p,"import { plainFormula,type Resource,type ServerUser }", "import { plainFormula,type Resource,type ServerUser }")
edit(p,"import { validateContent,text,numeric,source }", "import { reactionRules } from '../../src/engine/reactionRules';\nimport { equipmentLibrary } from '../../src/engine/equipment';\nimport { validateContent,text,numeric,source }")
needle="this.store.run('INSERT INTO reaction_effect_configs VALUES(?,?,?) ON CONFLICT(reaction_id) DO UPDATE SET effect_code=excluded.effect_code,data=excluded.data',id,data.effect,JSON.stringify({durationSeconds:data.durationSeconds}))"
addition=''';if(data.experimentConfig?.enabled){const c=data.experimentConfig;const canonical=reactionRules.find(r=>['reactants','products'].every(side=>Object.keys((r as any)[side]).length===data[side].length&&data[side].every((p:any)=>(r as any)[side][p.chemical]===p.coefficient)));const customReaction={id:canonical?.id||'admin:'+id,reactants:Object.fromEntries(data.reactants.map((p:any)=>[p.chemical,p.coefficient])),products:Object.fromEntries(data.products.map((p:any)=>[p.chemical,p.coefficient])),equation:data.reactants.map((p:any)=>`${p.coefficient===1?'':p.coefficient}${JSON.parse(this.store.get('SELECT data FROM chemicals WHERE id=?',p.chemical).data).formula}`).join(' + ')+' → '+data.products.map((p:any)=>`${p.coefficient===1?'':p.coefficient}${JSON.parse(this.store.get('SELECT data FROM chemicals WHERE id=?',p.chemical).data).formula}`).join(' + '),effect:data.effect,observation:data.observation,explanation:data.explanation,source:data.source,minTemperature:data.minTemperature,durationSeconds:data.durationSeconds,teacherReviewed:true};const products=[...data.products].sort((a,b)=>{const phase=(p:any)=>JSON.parse(this.store.get('SELECT data FROM chemicals WHERE id=?',p.chemical).data).phase;return Number(['khí','kết tủa'].includes(phase(b)))-Number(['khí','kết tủa'].includes(phase(a)))});const experiment={id:'catalog-'+id,title:c.title,subtitle:data.observation,grade:c.grade,topic:data.type||'Phản ứng đã kiểm chứng',minutes:c.minutes,difficulty:'Cơ bản',reagents:data.reactants.map((p:any)=>p.chemical),equipment:equipmentLibrary.map(e=>e.type),product:products[0]?.chemical,goals:['product','observe','equation'],objectives:c.objectives,instructions:c.instructions,hints:[],amount:1,status:'published',access:'free',demo:false,customReaction};const status=this.store.get('SELECT status FROM reactions WHERE id=?',id).status==='published'?'published':'archived';this.store.run('INSERT INTO experiment_catalog(id,name,data,status) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,data=excluded.data,status=excluded.status',experiment.id,experiment.title,JSON.stringify(experiment),status);this.store.run('DELETE FROM experiment_dependencies WHERE experiment_id=?',experiment.id);for(const chemicalId of experiment.reagents)this.store.run('INSERT INTO experiment_dependencies VALUES(?,?,?)',experiment.id,'chemicals',chemicalId)}else this.store.run("UPDATE experiment_catalog SET status='archived' WHERE id=?",'catalog-'+id)'''
edit(p,needle,needle+addition)
edit(p,"classes:[],classesNotice:'Lớp học hiện lưu tại trình duyệt, chưa có bảng lớp đa thiết bị trên máy chủ.'", "classes:this.store.all('SELECT c.id,c.name,c.created_at,u.name teacher_name FROM school_classes c JOIN users u ON u.id=c.teacher_id WHERE c.school_id=? ORDER BY c.created_at DESC',id),classesNotice:'Hiển thị thông tin lớp được giáo viên có tài khoản máy chủ đồng bộ. Bài giao, bài nộp và chấm điểm của luồng cũ vẫn lưu tại trình duyệt.'")
edit(p,"publicCatalog(){return {chemicals:", "publicCatalog(){return {experiments:this.store.all(\"SELECT data FROM experiment_catalog WHERE status='published'\").map(e=>JSON.parse(e.data)),chemicals:")
p='server/admin/validation.ts'
edit(p,"const ports=d.ports||[];", "if(existing?.data.builtin&&engineType!==existing.data.engineType)throw new ApiError(409,'Không đổi mẫu hình học của dụng cụ chuẩn đang được dùng.');const requiredBehaviors=supportedBehaviors(engineType);if(behaviors.length!==requiredBehaviors.length||requiredBehaviors.some(b=>!behaviors.includes(b)))throw new ApiError(400,'Mẫu engine dùng trọn bộ hành vi đã kiểm chứng; chưa hỗ trợ bật/tắt từng hành vi riêng.');const ports=d.ports||[];")
edit(p,"builtin:!!existing?.data.builtin};\n  if(published&&(!data.reviewed", "builtin:!!existing?.data.builtin,experimentConfig:d.experimentConfig?.enabled?{enabled:true,title:text(d.experimentConfig.title,'Tên bài thực hành mẫu',180),grade:numeric(d.experimentConfig.grade,'Lớp',8,12),minutes:numeric(d.experimentConfig.minutes,'Thời lượng bài',1,120),objectives:text(d.experimentConfig.objectives,'Mục tiêu học tập',3000),instructions:text(d.experimentConfig.instructions,'Hướng dẫn thực hành',3000)}:{enabled:false}};\n  if(published&&(!data.reviewed")
# Water and indicator do not have a quantitative reactant model in the current engine.
edit(p,"const effect=d.effect||'none';", "if(reactants.some(p=>['H2O','indicator'].includes(p.chemical))){support='partial';reasons.push('Engine chưa tính lượng nước dung môi hoặc chỉ thị như chất tham gia định lượng.')}const effect=d.effect||'none';")
p='server/admin/plugin.ts'
edit(p,"const match=path.match(/^\\/api\\/learning\\/sessions", "if(path==='/api/learning/classes'){if(user.role!=='TEACHER')throw new ApiError(403,'Chỉ giáo viên tạo lớp.');const id=text(data.id,'Class ID',100),name=text(data.name,'Tên lớp',180),old=store.get('SELECT teacher_id FROM school_classes WHERE id=?',id);if(old&&old.teacher_id!==user.id)throw new ApiError(404,'Không tìm thấy lớp.');const now=new Date().toISOString();store.run('INSERT INTO school_classes VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,updated_at=excluded.updated_at',id,user.schoolId,user.id,name,now,now);return send(200,{id})}const match=path.match(/^\\/api\\/learning\\/sessions")
edit(p,"chemicals:store.all(\"SELECT id,name,formula,status FROM chemicals WHERE status!='archived'\"),schools:", "chemicals:store.all(\"SELECT id,name,formula,status FROM chemicals WHERE status!='archived'\"),reactions:store.all(\"SELECT id,name FROM reactions WHERE status!='archived'\"),apparatus:store.all(\"SELECT id,name FROM apparatus WHERE status!='archived'\"),schools:")
p='src/features/admin/catalogStore.ts'
edit(p,'name:record.name,formula:d.formula,phase:', 'name:record.name,phase:')
p='src/app/App.tsx'
edit(p,"import { lazy,Suspense,useEffect }", "import { refreshServerCatalog } from '../features/admin/catalogStore';\nimport { lazy,Suspense,useEffect }")
edit(p,'function App(){const location=useLocation();', 'function App(){const location=useLocation();useEffect(()=>{void refreshServerCatalog()},[]);')
p='src/features/experiments/hooks/useExperiments.ts'
edit(p,"import { useAuth }", "import { useServerCatalog } from '../../admin/catalogStore';\nimport { useAuth }")
edit(p,"export function useExperiments(includeOwnDrafts=false){", "export function useExperiments(includeOwnDrafts=false){const published=useServerCatalog(s=>s.experiments);const library=[...experiments,...published.filter(e=>!experiments.some(base=>base.id===e.id))];")
edit(p,'return [...experiments,...templates.filter', 'return [...library,...templates.filter')
p='src/features/experiments/ExperimentAccess.tsx'
edit(p,"import { type ReactNode }", "import { useServerCatalog } from '../admin/catalogStore';\nimport { type ReactNode }")
edit(p,"const user=useAuth(s=>s.user);", "const published=useServerCatalog(s=>s.experiments);const user=useAuth(s=>s.user);")
edit(p,'[...experiments,...templates].find', '[...experiments,...published,...templates].find')
p='src/features/classrooms/Classrooms.tsx'
edit(p,"import { AssignmentConfigEditor }", "import { useServerCatalog } from '../admin/catalogStore';\nimport { AssignmentConfigEditor }")
edit(p,"const {classId}=useParams();const user=useAuth", "const published=useServerCatalog(s=>s.experiments);const {classId}=useParams();const user=useAuth")
edit(p,'const available=[...experiments,...templates.filter','const available=[...experiments,...published.filter(e=>!experiments.some(b=>b.id===e.id)),...templates.filter')
p='src/features/classrooms/classroomStore.ts'
edit(p,"import { defaultAssignmentConfig", "import { useServerCatalog } from '../admin/catalogStore';\nimport { defaultAssignmentConfig")
edit(p,'[...experiments,...useStore.getState().templates]', '[...experiments,...useServerCatalog.getState().experiments,...useStore.getState().templates]')
needle="}]}));return id},\n joinClass:"
replacement="}]}));void fetch('/api/learning/classes',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-virtual-lab':'1'},body:JSON.stringify({id,name:name.trim()})}).catch(()=>{});return id},\n joinClass:"
edit(p,needle,replacement)
p='src/features/lab/LabPage.tsx'
edit(p,"import { consumeStock", "import { publishedApparatus,syncLearningSession,useServerCatalog } from '../admin/catalogStore';\nimport { RelatedBookLinks } from '../admin/RelatedBookLinks';\nimport { consumeStock")
edit(p,'const actionMenu=useRef', 'const catalogApparatus=useServerCatalog(s=>s.apparatus);\n const actionMenu=useRef')
edit(p,'const availableEquipment=config?', 'const baseEquipment=config?')
needle=' const availableChemicals=config?'
replacement=" const additionalApparatus=catalogApparatus.filter(r=>!equipmentLibrary.some(e=>e.type===r.id)&&(!config||config.catalogApparatusIds?.includes(r.id))).map(publishedApparatus).filter(Boolean) as NonNullable<ReturnType<typeof publishedApparatus>>[];\n const availableEquipment=[...baseEquipment.map(e=>({...e,id:e.type,ports:catalogApparatus.find(r=>r.id===e.type)?.data.ports,assetUrl:''})),...additionalApparatus];\n"+needle
edit(p,needle,replacement)
edit(p,'function addEquipment(type:EquipmentType,x?:number,y?:number){','function addEquipment(type:EquipmentType,x?:number,y?:number,catalogId?:string){')
edit(p,"commit([...ref.current,item],'Đã thêm '+definition(type).name", "const catalogItem=catalogId?availableEquipment.find(e=>e.id===catalogId):undefined;if(catalogItem){item.capacity=catalogItem.capacity;item.catalogId=catalogItem.id;item.catalogName=catalogItem.name;item.catalogDescription=catalogItem.description;item.catalogPorts=catalogItem.ports}commit([...ref.current,item],'Đã thêm '+(item.catalogName||definition(type).name)")
edit(p,'key={e.type}><button className="inventory-item"','key={e.id}><button className="inventory-item"')
edit(p,"event.dataTransfer.setData('lab-item',e.type)","event.dataTransfer.setData('lab-item','apparatus:'+e.id)")
edit(p,'onClick={()=>addEquipment(e.type)}','onClick={()=>addEquipment(e.type,undefined,undefined,e.id)}')
edit(p,'<EquipmentIllustration type={e.type}/></span>', '<EquipmentIllustration type={e.type}/></span>')
edit(p,"else if(availableEquipment.some(e=>e.type===kind))addEquipment(kind as EquipmentType,x,y)","else if(kind.startsWith('apparatus:')){const e=availableEquipment.find(e=>e.id===kind.slice(10));if(e)addEquipment(e.type,x,y,e.id)}else if(availableEquipment.some(e=>e.type===kind))addEquipment(kind as EquipmentType,x,y)")
edit(p,'<h3>{definition(selectedVessel.type).name}</h3>', '<h3>{selectedVessel.catalogName||definition(selectedVessel.type).name}</h3>')
edit(p,'<VesselDetails v={selectedVessel}', '<RelatedBookLinks experimentId={experiment.id}/><VesselDetails v={selectedVessel}')
edit(p,"const latest=useRef({vessels", "useEffect(()=>{if(id)void syncLearningSession(sessionRef.current.id,id)},[id,labKey]);\n const latest=useRef({vessels")
edit(p,"saveAttempt(a);navigate('/results/'+a.id)","saveAttempt(a);void syncLearningSession(sessionRef.current.id,experiment!.id,true);navigate('/results/'+a.id)")
p='src/engine/equipment.ts'
edit(p,'export interface Vessel{','export interface Vessel{catalogId?:string;catalogName?:string;catalogDescription?:string;catalogPorts?:{id:string;type:string;x:number;y:number;direction:number;compatible:string[];occupancy:number}[];')
p='src/engine/connectionLogic.ts'
edit(p,"const x=port==='out'?14:-14,y=-heightOf(v.type),r=", "const custom=v.catalogPorts?.find(p=>p.type===(port==='out'?'gas-out':'gas-in'));const x=custom?.x??(port==='out'?14:-14),y=custom?.y??-heightOf(v.type),r=")
p='src/features/lab/components/LabDetails.tsx'
edit(p,'<p>{eq.description}</p>', '<p>{v.catalogDescription||eq.description}</p>')
p='src/engine/assignmentLab.ts'
edit(p,'export interface AssignmentConfig{', 'export interface AssignmentConfig{catalogApparatusIds?:string[];')
