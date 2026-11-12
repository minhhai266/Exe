export const migrations:{version:number;sql:string;foreignKeysOff?:boolean}[]=[{version:1,sql:`
 CREATE TABLE schools(id TEXT PRIMARY KEY, code TEXT NOT NULL COLLATE NOCASE UNIQUE, name TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','suspended','archived')), data TEXT NOT NULL CHECK(json_valid(data)), version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT NOT NULL COLLATE NOCASE UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('SYSTEM_ADMIN','SCHOOL_ADMIN','TEACHER','STUDENT')),school_id TEXT REFERENCES schools(id),status TEXT NOT NULL CHECK(status IN ('active','invited','locked','archived')),password_hash TEXT,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,CHECK(role='SYSTEM_ADMIN' OR school_id IS NOT NULL));
 CREATE INDEX users_school_role ON users(school_id,role,status);
 CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE INDEX sessions_expiry ON sessions(expires_at);
 CREATE TABLE account_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE chemicals(id TEXT PRIMARY KEY,code TEXT NOT NULL COLLATE NOCASE UNIQUE,name TEXT NOT NULL,formula TEXT NOT NULL UNIQUE,status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),data TEXT NOT NULL CHECK(json_valid(data)),version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE reagent_preparations(id TEXT PRIMARY KEY,chemical_id TEXT NOT NULL REFERENCES chemicals(id),name TEXT NOT NULL,concentration REAL CHECK(concentration>0 AND concentration<=2),unit TEXT NOT NULL CHECK(unit IN ('M','pure')),version INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE apparatus(id TEXT PRIMARY KEY,code TEXT NOT NULL COLLATE NOCASE UNIQUE,name TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),data TEXT NOT NULL CHECK(json_valid(data)),version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE apparatus_ports(id TEXT NOT NULL,apparatus_id TEXT NOT NULL REFERENCES apparatus(id),data TEXT NOT NULL CHECK(json_valid(data)),PRIMARY KEY(apparatus_id,id));
 CREATE TABLE apparatus_behaviors(apparatus_id TEXT NOT NULL REFERENCES apparatus(id),behavior TEXT NOT NULL,PRIMARY KEY(apparatus_id,behavior));
 CREATE TABLE reactions(id TEXT PRIMARY KEY,code TEXT NOT NULL COLLATE NOCASE UNIQUE,name TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),data TEXT NOT NULL CHECK(json_valid(data)),version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE reaction_participants(reaction_id TEXT NOT NULL REFERENCES reactions(id),chemical_id TEXT NOT NULL REFERENCES chemicals(id),side TEXT NOT NULL CHECK(side IN ('reactants','products')),coefficient INTEGER NOT NULL CHECK(coefficient>0),PRIMARY KEY(reaction_id,side,chemical_id));
 CREATE INDEX reaction_chemical ON reaction_participants(chemical_id);
 CREATE TABLE reaction_conditions(reaction_id TEXT PRIMARY KEY REFERENCES reactions(id),data TEXT NOT NULL CHECK(json_valid(data)));
 CREATE TABLE visual_effect_templates(code TEXT PRIMARY KEY,data TEXT NOT NULL CHECK(json_valid(data)));
 CREATE TABLE reaction_effect_configs(reaction_id TEXT PRIMARY KEY REFERENCES reactions(id),effect_code TEXT NOT NULL REFERENCES visual_effect_templates(code),data TEXT NOT NULL CHECK(json_valid(data)));
 CREATE TABLE ebooks(id TEXT PRIMARY KEY,code TEXT NOT NULL COLLATE NOCASE UNIQUE,name TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),data TEXT NOT NULL CHECK(json_valid(data)),version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE ebook_chapters(id TEXT PRIMARY KEY,ebook_id TEXT NOT NULL REFERENCES ebooks(id),title TEXT NOT NULL,position INTEGER NOT NULL);
 CREATE TABLE ebook_lessons(id TEXT PRIMARY KEY,chapter_id TEXT NOT NULL REFERENCES ebook_chapters(id) ON DELETE CASCADE,title TEXT NOT NULL,position INTEGER NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)));
 CREATE TABLE lesson_experiment_links(lesson_id TEXT NOT NULL REFERENCES ebook_lessons(id) ON DELETE CASCADE,experiment_id TEXT NOT NULL,PRIMARY KEY(lesson_id,experiment_id));
 CREATE TABLE assets(id TEXT PRIMARY KEY,name TEXT NOT NULL,mime TEXT NOT NULL,bytes BLOB NOT NULL,size INTEGER NOT NULL,created_by TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL);
 CREATE TABLE ebook_resources(ebook_id TEXT NOT NULL REFERENCES ebooks(id),asset_id TEXT NOT NULL REFERENCES assets(id),PRIMARY KEY(ebook_id,asset_id));
 CREATE TABLE content_versions(id INTEGER PRIMARY KEY,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,version INTEGER NOT NULL,data TEXT NOT NULL,actor_id TEXT REFERENCES users(id),created_at TEXT NOT NULL,UNIQUE(entity_type,entity_id,version));
 CREATE TABLE admin_audit_logs(id TEXT PRIMARY KEY,actor_id TEXT REFERENCES users(id),school_id TEXT REFERENCES schools(id),action TEXT NOT NULL,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,label TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE INDEX audit_school_date ON admin_audit_logs(school_id,created_at);
 CREATE TABLE learning_sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),school_id TEXT REFERENCES schools(id),experiment_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('started','completed')),created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE INDEX learning_school_date ON learning_sessions(school_id,created_at);
 CREATE TABLE experiment_catalog(id TEXT PRIMARY KEY,name TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)));
 CREATE TABLE experiment_dependencies(experiment_id TEXT NOT NULL REFERENCES experiment_catalog(id),entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,PRIMARY KEY(experiment_id,entity_type,entity_id));
 `},{version:2,sql:`
 ALTER TABLE experiment_catalog ADD COLUMN status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','archived'));
 CREATE TABLE school_classes(id TEXT PRIMARY KEY,school_id TEXT NOT NULL REFERENCES schools(id),teacher_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE INDEX school_classes_school ON school_classes(school_id,teacher_id);
 `},{version:3,sql:`
 INSERT OR IGNORE INTO experiment_dependencies(experiment_id,entity_type,entity_id)
 SELECT e.id,'reactions',r.id FROM experiment_catalog e JOIN reactions r ON e.id=r.id;
 UPDATE apparatus_ports SET data=json_set(data,'$.y',CASE apparatus_id WHEN 'flask' THEN -193 WHEN 'roundFlask' THEN -190 WHEN 'tube' THEN -181 WHEN 'cylinder' THEN -190 WHEN 'gasJar' THEN -175 ELSE -164 END)
 WHERE apparatus_id IN (SELECT id FROM apparatus WHERE version=1 AND json_extract(data,'$.builtin')=1);
 UPDATE apparatus SET data=json_set(data,'$.ports',json((SELECT json_group_array(json(p.data)) FROM apparatus_ports p WHERE p.apparatus_id=apparatus.id)))
 WHERE version=1 AND json_extract(data,'$.builtin')=1;
 UPDATE chemicals SET data=json_set(data,'$.englishName',CASE id WHEN 'Zn' THEN 'Zinc' WHEN 'HCl' THEN 'Hydrochloric acid' WHEN 'CuSO4' THEN 'Copper(II) sulfate' WHEN 'NaOH' THEN 'Sodium hydroxide' WHEN 'ZnCl2' THEN 'Zinc chloride' WHEN 'H2' THEN 'Hydrogen' WHEN 'Cu(OH)2' THEN 'Copper(II) hydroxide' WHEN 'Na2SO4' THEN 'Sodium sulfate' WHEN 'NaCl' THEN 'Sodium chloride' WHEN 'H2O' THEN 'Water' WHEN 'H2O2' THEN 'Hydrogen peroxide' WHEN 'O2' THEN 'Oxygen' WHEN 'MnO2' THEN 'Manganese(IV) oxide' WHEN 'CaCO3' THEN 'Calcium carbonate' ELSE 'Phenolphthalein' END)
 WHERE version=1 AND json_extract(data,'$.builtin')=1;
 `},{version:4,sql:`
 ALTER TABLE learning_sessions ADD COLUMN completed_at TEXT;
 UPDATE learning_sessions SET completed_at=updated_at WHERE status='completed';
 CREATE INDEX learning_school_completion ON learning_sessions(school_id,completed_at);
 CREATE INDEX learning_completion ON learning_sessions(completed_at);
 `},{version:5,sql:`
 CREATE TABLE ai_reaction_drafts(
  id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),school_id TEXT REFERENCES schools(id),
  schema_version INTEGER NOT NULL CHECK(schema_version=1),status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),
  data TEXT NOT NULL CHECK(json_valid(data)),validation TEXT NOT NULL CHECK(json_valid(validation)),
  provenance TEXT NOT NULL CHECK(json_valid(provenance)),review TEXT CHECK(review IS NULL OR json_valid(review)),
  published_reaction_id TEXT REFERENCES reactions(id),version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
 );
 CREATE INDEX ai_drafts_owner ON ai_reaction_drafts(owner_id,updated_at);
 CREATE INDEX ai_drafts_school ON ai_reaction_drafts(school_id,status);
 CREATE TABLE ai_reaction_draft_versions(draft_id TEXT NOT NULL REFERENCES ai_reaction_drafts(id),version INTEGER NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)),actor_id TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL,PRIMARY KEY(draft_id,version));
 CREATE TABLE ai_generation_requests(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL CHECK(kind IN ('reaction','questions')),created_at TEXT NOT NULL);
 CREATE INDEX ai_requests_user_date ON ai_generation_requests(user_id,created_at);
 `},{version:6,foreignKeysOff:true,sql:`
 CREATE TABLE users_google_upgrade(id TEXT PRIMARY KEY,email TEXT NOT NULL COLLATE NOCASE UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('SYSTEM_ADMIN','SCHOOL_ADMIN','TEACHER','STUDENT')),school_id TEXT REFERENCES schools(id),status TEXT NOT NULL CHECK(status IN ('active','invited','locked','archived')),password_hash TEXT,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,CHECK(role!='SCHOOL_ADMIN' OR school_id IS NOT NULL));
 INSERT INTO users_google_upgrade SELECT * FROM users;
 DROP TABLE users;
 ALTER TABLE users_google_upgrade RENAME TO users;
 CREATE INDEX users_school_role ON users(school_id,role,status);
 CREATE TABLE google_identities(subject TEXT PRIMARY KEY,user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,created_at TEXT NOT NULL);
 CREATE TABLE google_login_challenges(nonce_hash TEXT PRIMARY KEY,role TEXT NOT NULL CHECK(role IN ('STUDENT','TEACHER')),expires_at TEXT NOT NULL);
 `},{version:7,foreignKeysOff:true,sql:`
 CREATE TABLE school_classes_upgrade(id TEXT PRIMARY KEY,school_id TEXT REFERENCES schools(id),teacher_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,join_code TEXT NOT NULL UNIQUE);
 INSERT INTO school_classes_upgrade SELECT *,upper(substr(hex(randomblob(8)),1,8)) FROM school_classes;
 DROP TABLE school_classes;
 ALTER TABLE school_classes_upgrade RENAME TO school_classes;
 CREATE INDEX school_classes_school ON school_classes(school_id,teacher_id);
 CREATE TABLE class_members(class_id TEXT NOT NULL REFERENCES school_classes(id),user_id TEXT NOT NULL REFERENCES users(id),joined_at TEXT NOT NULL,PRIMARY KEY(class_id,user_id));
 CREATE TABLE learning_assignments(id TEXT PRIMARY KEY,class_id TEXT NOT NULL REFERENCES school_classes(id),teacher_id TEXT NOT NULL REFERENCES users(id),draft_id TEXT REFERENCES ai_reaction_drafts(id),draft_version INTEGER,title TEXT NOT NULL,instructions TEXT NOT NULL,due_at TEXT NOT NULL,config TEXT NOT NULL CHECK(json_valid(config)),created_at TEXT NOT NULL);
 CREATE TABLE learning_submissions(id TEXT PRIMARY KEY,assignment_id TEXT NOT NULL REFERENCES learning_assignments(id),student_id TEXT NOT NULL REFERENCES users(id),attempt_id TEXT NOT NULL,attempt TEXT NOT NULL CHECK(json_valid(attempt)),submitted_at TEXT NOT NULL,feedback TEXT NOT NULL DEFAULT '',grade REAL,criterion_grades TEXT,reviewed_at TEXT,UNIQUE(assignment_id,student_id,attempt_id));
 CREATE TABLE learning_materials(id TEXT PRIMARY KEY,class_id TEXT NOT NULL REFERENCES school_classes(id),title TEXT NOT NULL,body TEXT NOT NULL,url TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE studio_experiment_templates(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),draft_id TEXT NOT NULL REFERENCES ai_reaction_drafts(id),draft_version INTEGER NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)),updated_at TEXT NOT NULL);
 CREATE TABLE studio_trials(id TEXT PRIMARY KEY,draft_id TEXT NOT NULL REFERENCES ai_reaction_drafts(id),draft_version INTEGER NOT NULL,teacher_id TEXT NOT NULL REFERENCES users(id),data TEXT NOT NULL CHECK(json_valid(data)),created_at TEXT NOT NULL);
 CREATE INDEX assignments_class ON learning_assignments(class_id,created_at);
 CREATE INDEX submissions_assignment ON learning_submissions(assignment_id,student_id);
 `}];
