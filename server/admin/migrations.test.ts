import {expect,it} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync,rmdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {migrations} from './migrations';
import {AdminDatabase} from './database';

it('upgrades a populated v3 database without changing accounts or session history',()=>{
 const folder=mkdtempSync(join(tmpdir(),'lab-migration-')),path=join(folder,'old.sqlite');
 let raw:DatabaseSync|undefined,upgraded:AdminDatabase|undefined;
 try{
  raw=new DatabaseSync(path);raw.exec('PRAGMA foreign_keys=ON; CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)');
  for(const migration of migrations.filter(m=>m.version<=3)){raw.exec(migration.sql);raw.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(migration.version,'2026-01-01T00:00:00.000Z')}
  raw.exec(`INSERT INTO schools VALUES('old-school','old-school','Existing school','active','{}',1,'2026-01-01','2026-01-01');
   INSERT INTO users VALUES('old-user','existing@example.test','Existing teacher','TEACHER','old-school','invited',NULL,2,'2026-01-01','2026-01-01');
   INSERT INTO learning_sessions VALUES('old-session','old-user','old-school','hydrogen','completed','2026-01-01T10:00:00.000Z','2026-01-02T10:00:00.000Z');
   INSERT INTO sessions VALUES('existing-session-token','old-user','2099-01-01','2026-01-01');
   INSERT INTO school_classes VALUES('old-class','old-school','old-user','Existing class','2026-01-01','2026-01-01');`);
  raw.close();raw=undefined;
  upgraded=new AdminDatabase(path);
  expect(upgraded.get('SELECT name,version FROM users WHERE id=?','old-user')).toMatchObject({name:'Existing teacher',version:2});
  expect(upgraded.get('SELECT created_at,completed_at FROM learning_sessions WHERE id=?','old-session')).toMatchObject({created_at:'2026-01-01T10:00:00.000Z',completed_at:'2026-01-02T10:00:00.000Z'});
  expect(upgraded.get('SELECT COUNT(*) n FROM schema_migrations').n).toBe(migrations.length);
  expect(upgraded.get('SELECT user_id FROM sessions WHERE token_hash=?','existing-session-token').user_id).toBe('old-user');
  expect(upgraded.all('PRAGMA foreign_key_check')).toEqual([]);
  expect(upgraded.get('PRAGMA foreign_keys').foreign_keys).toBe(1);
  expect(upgraded.get('SELECT name,teacher_id,join_code FROM school_classes WHERE id=?','old-class')).toMatchObject({name:'Existing class',teacher_id:'old-user',join_code:expect.stringMatching(/^[A-F0-9]{8}$/)});
  upgraded.close();upgraded=undefined;upgraded=new AdminDatabase(path);
  expect(upgraded.get('SELECT COUNT(*) n FROM learning_sessions').n).toBe(1);
 }finally{raw?.close();upgraded?.close();for(const suffix of ['','-wal','-shm'])if(existsSync(path+suffix))rmSync(path+suffix);rmdirSync(folder)}
});
