import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { migrations } from './migrations';
import { chemicals } from '../../src/engine/chemicals';
import { chemicalProfiles,equipmentProfiles } from '../../src/engine/catalog';
import { heightOf } from '../../src/engine/connectionLogic';
import { equipmentLibrary } from '../../src/engine/equipment';
import { reactionRules } from '../../src/engine/reactionRules';
import { experiments } from '../../src/features/experiments/data';
import { lessons } from '../../src/features/materials/data';
import { effectTemplates,plainFormula } from '../../src/features/admin/domain';

const englishNames:Record<string,string>={Zn:'Zinc',HCl:'Hydrochloric acid',CuSO4:'Copper(II) sulfate',NaOH:'Sodium hydroxide',ZnCl2:'Zinc chloride',H2:'Hydrogen','Cu(OH)2':'Copper(II) hydroxide',Na2SO4:'Sodium sulfate',NaCl:'Sodium chloride',H2O:'Water',H2O2:'Hydrogen peroxide',O2:'Oxygen',MnO2:'Manganese(IV) oxide',CaCO3:'Calcium carbonate',indicator:'Phenolphthalein'};
export class AdminDatabase{
 readonly db:DatabaseSync;
 private transactionDepth=0;
 constructor(path=resolve('.data/virtual-lab.sqlite')){
  if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});
  this.db=new DatabaseSync(path);
  this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)');
  for(const m of migrations)if(!this.get('SELECT version FROM schema_migrations WHERE version=?',m.version)){
   if(m.foreignKeysOff)this.db.exec('PRAGMA foreign_keys=OFF');
   try{this.transaction(()=>{
    this.db.exec(m.sql);
    if(m.foreignKeysOff&&this.all('PRAGMA foreign_key_check').length)throw new Error('Migration would break foreign keys.');
    this.run('INSERT INTO schema_migrations VALUES(?,?)',m.version,new Date().toISOString());
   })}finally{if(m.foreignKeysOff)this.db.exec('PRAGMA foreign_keys=ON')}
  }
  this.seed();
 }
 get(sql:string,...params:any[]):any{return this.db.prepare(sql).get(...params)}
 all(sql:string,...params:any[]):any[]{return this.db.prepare(sql).all(...params)}
 run(sql:string,...params:any[]){return this.db.prepare(sql).run(...params)}
 transaction<T>(work:()=>T):T{
  const depth=this.transactionDepth++,savepoint='admin_nested_'+depth;let started=false;
  try{this.db.exec(depth?'SAVEPOINT '+savepoint:'BEGIN IMMEDIATE');started=true;const result=work();this.db.exec(depth?'RELEASE SAVEPOINT '+savepoint:'COMMIT');return result}
  catch(error){if(started){if(depth){this.db.exec('ROLLBACK TO SAVEPOINT '+savepoint);this.db.exec('RELEASE SAVEPOINT '+savepoint)}else this.db.exec('ROLLBACK')}throw error}
  finally{this.transactionDepth--}
 }
 close(){this.db.close()}
 private seed(){if(this.get('SELECT COUNT(*) n FROM chemicals').n)return;this.transaction(()=>{
  const now=new Date().toISOString();
  for(const effect of effectTemplates)this.run('INSERT INTO visual_effect_templates VALUES(?,?)',effect.code,JSON.stringify(effect));
  for(const [id,c] of Object.entries(chemicals)){const cp=chemicalProfiles[id as keyof typeof chemicalProfiles];const data={name:c.name,englishName:englishNames[id],formula:plainFormula(c.formula),molarMass:cp.molarMass,category:cp.category,phase:c.phase,appearance:cp.appearance,color:c.color,safety:cp.hazard,description:cp.description,source:cp.source,reviewed:true,engineKey:id,builtin:true};this.run('INSERT INTO chemicals VALUES(?,?,?,?,?,?,1,?,?)',id,id,c.name,data.formula,'published',JSON.stringify(data),now,now);if(c.concentration)this.run('INSERT INTO reagent_preparations VALUES(?,?,?,?,?,1)',randomUUID(),id,c.name+' '+c.concentration+' M',c.concentration,'M')}
  for(const e of equipmentLibrary){const behaviors=[...(e.capacity?['CONTAIN_LIQUID','CONTAIN_SOLID','POUR']:[]),...(e.heatSafe?['HEATABLE']:[]),...(['flask','roundFlask','tube'].includes(e.type)?['ATTACH_STOPPER','CONNECT_TUBE']:[]),...(['stand','clamp','rack','tripod'].includes(e.type)?['HOLD_APPARATUS']:[]),...(e.type==='dropper'?['DROP_LIQUID']:[])];const ports=e.capacity?[{id:'in',type:'gas-in',x:-14,y:-heightOf(e.type),direction:-90,compatible:['gas-out'],occupancy:1},...(['flask','roundFlask','tube'].includes(e.type)?[{id:'out',type:'gas-out',x:14,y:-heightOf(e.type),direction:-90,compatible:['gas-in'],occupancy:1}]:[])]:[];const data={...e,engineType:e.type,material:equipmentProfiles[e.type].material,behaviors,ports,builtin:true};this.run('INSERT INTO apparatus VALUES(?,?,?,?,?,1,?,?)',e.type,e.type,e.name,'published',JSON.stringify(data),now,now);for(const p of ports)this.run('INSERT INTO apparatus_ports VALUES(?,?,?)',p.id,e.type,JSON.stringify(p));for(const b of behaviors)this.run('INSERT INTO apparatus_behaviors VALUES(?,?)',e.type,b)}
  for(const r of reactionRules){const data={...r,name:r.id==='hydrogen'?'Điều chế hiđro':r.id==='precipitate'?'Tạo kết tủa Cu(OH)₂':r.id==='oxygen'?'Phân hủy hiđro peoxit':'Trung hòa axit–bazơ',reactants:Object.entries(r.reactants).map(([chemical,coefficient])=>({chemical,coefficient})),products:Object.entries(r.products).map(([chemical,coefficient])=>({chemical,coefficient})),minTemperature:r.minTemperature??20,durationSeconds:r.id==='oxygen'?60:r.id==='precipitate'?7:r.id==='neutralization'?6:10,source:r.source||'https://www2.chem.wisc.edu/deptfiles/genchem/lab/ccaold/main/naoh/page1.htm',reviewed:true,support:'supported',builtin:true};this.run('INSERT INTO reactions VALUES(?,?,?,?,?,1,?,?)',r.id,r.id,data.name,'published',JSON.stringify(data),now,now);for(const side of ['reactants','products'] as const)for(const p of data[side])this.run('INSERT INTO reaction_participants VALUES(?,?,?,?)',r.id,p.chemical,side,p.coefficient);this.run('INSERT INTO reaction_conditions VALUES(?,?)',r.id,JSON.stringify({minTemperature:r.minTemperature??20,heating:r.heating,requiresStirring:r.requiresStirring}));this.run('INSERT INTO reaction_effect_configs VALUES(?,?,?)',r.id,r.effect,JSON.stringify({durationSeconds:data.durationSeconds}))}
  for(const grade of [...new Set(lessons.map(l=>l.grade))]){const id='book-'+grade,rows=lessons.filter(l=>l.grade===grade);const chapters=[...new Set(rows.map(l=>l.chapter))].map((title,i)=>({id:`${id}-chapter-${i}`,title,lessons:rows.filter(l=>l.chapter===title).map(l=>({id:'book-lesson-'+l.id,title:l.title,experimentId:l.experiment,blocks:l.sections.flatMap((s,j)=>[{id:`${l.id}-${j}-h`,type:'heading',text:s.title},{id:`${l.id}-${j}-p`,type:'paragraph',text:s.text},...(s.formula?[{id:`${l.id}-${j}-f`,type:'formula',text:s.formula}]:[])]),chemicalIds:[],reactionIds:[],apparatusIds:[]}))}));const data={title:'Hóa học '+grade,name:'Hóa học '+grade,grade,subject:'Hóa học',author:'Virtual Lab',rights:'Nội dung học liệu hiện có của dự án; kiểm tra quyền phân phối trước khi phát hành tài liệu bên ngoài.',chapters,cover:'',pdf:'',builtin:true};this.run('INSERT INTO ebooks VALUES(?,?,?,?,?,1,?,?)',id,id,data.name,'published',JSON.stringify(data),now,now);for(const [i,c] of chapters.entries()){this.run('INSERT INTO ebook_chapters VALUES(?,?,?,?)',c.id,id,c.title,i);for(const [j,l] of c.lessons.entries()){this.run('INSERT INTO ebook_lessons VALUES(?,?,?,?,?)',l.id,c.id,l.title,j,JSON.stringify(l));if(l.experimentId)this.run('INSERT INTO lesson_experiment_links VALUES(?,?)',l.id,l.experimentId)}}}
  for(const e of experiments){this.run('INSERT INTO experiment_catalog(id,name,data) VALUES(?,?,?)',e.id,e.title,JSON.stringify(e));if(reactionRules.some(r=>r.id===e.id))this.run('INSERT INTO experiment_dependencies VALUES(?,?,?)',e.id,'reactions',e.id);for(const [type,ids] of [['chemicals',e.reagents],['apparatus',e.equipment]] as const)for(const id of ids)this.run('INSERT INTO experiment_dependencies VALUES(?,?,?)',e.id,type,id)}
 })}
}
