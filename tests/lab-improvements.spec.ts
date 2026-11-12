import { test,expect,type Page } from '@playwright/test';
import { labSession } from './lab-session';
import { defaultAssignmentConfig } from '../src/engine/assignmentLab';
import { experiments } from '../src/features/experiments/data';
import { createEquipment } from '../src/engine/equipment';
import { startReaction } from '../src/engine/timeSimulation';
import { createSession } from '../src/engine/labSession';

async function saved(page:Page,key='precipitate'){return page.evaluate(key=>JSON.parse(localStorage.getItem('virtual-lab-v1')||'{}').state?.draftLabs['lab-tester:'+key],key)}
test.beforeEach(async({page})=>labSession(page));
async function labTool(page:Page,name:string){if(await page.locator('.lab-actions-menu').getAttribute('open')===null)await page.locator('.lab-actions-menu>summary').click();await page.getByRole('button',{name,exact:true}).click()}


test('fits the complete table and toolbar at required desktop and tablet sizes',async({page})=>{
 for(const size of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:1024,height:768}]){
  await page.setViewportSize(size);await page.goto('/lab/precipitate');await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();
  const viewport=await page.locator('.bench-viewport').boundingBox(),canvas=await page.locator('.bench-viewport canvas').boundingBox(),toolbar=await page.locator('.assembly-toolbar').boundingBox();
  expect(viewport!.height).toBeGreaterThan(200);expect(canvas!.height).toBeLessThanOrEqual(viewport!.height+1);expect(toolbar!.y+toolbar!.height).toBeLessThanOrEqual(size.height+1);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(size.width<=1100){await expect(page.locator('.inventory')).toBeHidden();await page.getByRole('button',{name:'Thông tin / Quan sát'}).click();await expect(page.getByRole('dialog',{name:'Thông tin và quan sát'})).toBeVisible();await page.keyboard.press('Escape')}
  await page.screenshot({path:`artifacts/lab-viewport-${size.width}.png`});
 }
});

test('zooms, pans, resizes and restores without changing model coordinates; supports undo and redo',async({page})=>{
 await page.goto('/lab/precipitate');await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();await expect.poll(()=>saved(page)).toBeTruthy();const before=(await saved(page)).vessels;
 await page.getByRole('button',{name:'Phóng to bàn',exact:true}).click();await page.getByRole('button',{name:'Dịch phải',exact:true}).click();await page.setViewportSize({width:1280,height:720});
 expect((await saved(page)).vessels.map((v:any)=>[v.id,v.x,v.y])).toEqual(before.map((v:any)=>[v.id,v.x,v.y]));await page.getByRole('button',{name:'Đặt lại góc nhìn'}).click();
 await page.getByRole('button',{name:'Dụng cụ',exact:true}).click();await page.locator('.inventory-item').filter({hasText:'Cốc thủy tinh'}).click();await expect.poll(async()=> (await saved(page)).vessels.length).toBe(before.length+1);
 await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();await expect.poll(async()=> (await saved(page)).vessels.length).toBe(before.length);
 await page.getByRole('button',{name:'Làm lại thao tác'}).click();await expect.poll(async()=> (await saved(page)).vessels.length).toBe(before.length+1);await page.reload();await expect(page.locator('.bench-viewport canvas')).toBeVisible();await expect.poll(async()=>(await saved(page)).vessels.length).toBe(before.length+1);
});

test('equation is requested after an actual reaction and absent from notes and lens',async({page})=>{
 await page.goto('/lab/precipitate');await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();await expect(page.locator('.readout-equation')).toHaveCount(0);
 await expect(page.locator('.lab-readiness,.experiment-status,.lab-timer')).toHaveCount(0);
 await page.getByRole('button',{name:'Bắt đầu phản ứng',exact:true}).click();await expect(page.getByRole('button',{name:'Giải thích hiện tượng',exact:true})).toBeVisible();await expect(page.locator('.readout-equation')).toHaveCount(0);
 await page.getByRole('button',{name:'Giải thích hiện tượng',exact:true}).click();await expect(page.locator('.readout-equation')).toContainText('CuSO');
 await labTool(page,'Ghi chép');await expect(page.locator('.modal .equation-block')).toHaveCount(0);await page.getByRole('button',{name:'Đóng',exact:true}).click();
 await page.getByRole('button',{name:'Phóng to dụng cụ'}).click();await expect(page.locator('.lens-equation')).toHaveCount(0);await page.getByRole('button',{name:'Đóng kính quan sát'}).click();
});

test('draws a hose, keeps anchors after moving the source, and disconnects it',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))errors.push(m.text())});
 await page.goto('/lab/hydrogen');await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();await labTool(page,'Vẽ ống dẫn');
 await expect.poll(async()=> (await saved(page,'hydrogen'))?.vessels.filter((v:any)=>v.type==='tubing').length).toBe(1);
 const items=(await saved(page,'hydrogen')).vessels,source=items.find((v:any)=>v.type==='flask'),target=items.find((v:any)=>v.type==='gasJar');
 const box=(await page.locator('.bench-viewport canvas').boundingBox())!,scale=Math.min(box.width/1000,box.height/485),ox=box.x+(box.width-1000*scale)/2,oy=box.y+(box.height-485*scale)/2-55*scale;
 const a={x:source.x+14,y:source.y-193},b={x:target.x+14,y:target.y+175};
 await page.mouse.move(ox+a.x*scale,oy+a.y*scale);await page.mouse.down();await page.mouse.move(ox+450*scale,oy+100*scale,{steps:12});await page.mouse.move(ox+b.x*scale,oy+b.y*scale,{steps:18});await page.mouse.up();
 await expect.poll(async()=> (await saved(page,'hydrogen')).vessels.find((v:any)=>v.id===source.id).connections).toEqual([target.id]);
 await expect(page.locator('.bench-viewport canvas')).toHaveCount(1);
 await labTool(page,'Chọn');if(await page.getByRole('button',{name:'Đóng thông báo'}).isVisible())await page.getByRole('button',{name:'Đóng thông báo'}).click();const movedBox=(await page.locator('.bench-viewport canvas').boundingBox())!,ms=Math.min(movedBox.width/1000,movedBox.height/485),mx=movedBox.x+(movedBox.width-1000*ms)/2,my=movedBox.y+(movedBox.height-485*ms)/2-55*ms;await page.mouse.move(mx+source.x*ms,my+(source.y-30)*ms);await page.mouse.down();await page.mouse.move(mx+(source.x+100)*ms,my+(source.y-30)*ms,{steps:10});await page.mouse.up();
 await expect.poll(async()=> (await saved(page,'hydrogen')).session.events.filter((e:any)=>e.type==='APPARATUS_MOVED').length).toBeGreaterThan(0);
 const after=(await saved(page,'hydrogen')).vessels;expect(after.find((v:any)=>v.type==='tubing').tubeShape.from).toBe(source.id);expect(after.find((v:any)=>v.id===source.id).connections).toEqual([target.id]);
 await page.getByRole('button',{name:'Thuộc tính',exact:true}).click();await page.getByRole('button',{name:'Tháo ống nối',exact:true}).click();await expect.poll(async()=> (await saved(page,'hydrogen')).vessels.find((v:any)=>v.id===source.id).connections).toEqual([]);
 await page.screenshot({path:'artifacts/lab-drawn-tube.png'});expect(errors).toEqual([]);
});

test('assignment enforces finite stock, tracks events, restores and submits a historical report',async({page})=>{
 const config=defaultAssignmentConfig(experiments[1]);config.stock=[{id:'CuSO4',quantity:10,unit:'mL',concentration:1},{id:'NaOH',quantity:20,unit:'mL',concentration:1}];config.explanation='after-submit';config.hintsAllowed=false;
 await page.addInitScript(config=>{
  if(!localStorage.getItem('virtual-lab-classrooms-v1'))localStorage.setItem('virtual-lab-classrooms-v1',JSON.stringify({state:{classes:[{id:'class',teacherId:'teacher',teacherName:'Teacher',name:'9A',code:'ABCD1234',createdAt:new Date().toISOString(),members:[{id:'lab-tester',name:'Student',joinedAt:new Date().toISOString()}]}],assignments:[{id:'assigned',classId:'class',experimentId:'precipitate',title:'Bài được giao',instructions:'Quan sát',dueAt:'',createdAt:new Date().toISOString(),config}],materials:[],submissions:[]},version:0}));
 },config);
 await page.goto('/lab/precipitate?assignment=assigned');await expect(page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true})).toHaveCount(0);
 await page.locator('.inventory-item').filter({hasText:'Cốc thủy tinh'}).click();await page.getByRole('button',{name:'Hóa chất',exact:true}).click();await page.getByLabel('Lượng hóa chất').fill('10');await page.locator('.inventory-item').filter({hasText:'Đồng(II) sunfat'}).click();
 await expect.poll(async()=> (await saved(page,'precipitate@assigned'))?.stockUsed?.CuSO4).toBe(10);
 await page.locator('.inventory-item').filter({hasText:'Đồng(II) sunfat'}).click();await expect(page.getByRole('status')).toContainText('Không đủ');
 await page.getByLabel('Lượng hóa chất').fill('20');await page.locator('.inventory-item').filter({hasText:'Natri hiđroxit'}).click();await page.getByRole('button',{name:'Trộn & quan sát',exact:true}).click();
 await expect(page.getByRole('button',{name:'Giải thích hiện tượng',exact:true})).toBeDisabled();await page.locator('.lab-actions-menu>summary').click();await expect(page.getByRole('button',{name:'Gợi ý',exact:true})).toBeDisabled();await page.locator('.lab-actions-menu>summary').click();
 await page.reload();await expect.poll(async()=> (await saved(page,'precipitate@assigned'))?.stockUsed?.NaOH).toBe(20);await expect(page.locator('.readout-equation')).toHaveCount(0);
 await expect(page.locator('.reaction-status')).toContainText('Phản ứng hoàn tất',{timeout:15000});
 await labTool(page,'Ghi chép');await page.locator('.modal textarea').first().fill('Xuất hiện chất rắn xanh.');await page.getByRole('button',{name:'Lưu ghi chép',exact:true}).click();await page.getByRole('button',{name:'Nộp bài',exact:true}).click();
 await expect(page).toHaveURL(/results/);await expect(page.getByText('Rubric và bằng chứng mô hình')).toBeVisible();
 const submission=await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-classrooms-v1')!).state.submissions[0]);
 expect(submission.attempt.assignmentConfig.stock[0].quantity).toBe(10);expect(submission.attempt.stockUsed.CuSO4).toBe(10);
 const types=submission.attempt.session.events.map((e:any)=>e.type);expect(types).toContain('CHEMICAL_ADDED');expect(types).toContain('REACTION_COMPLETED');expect(types).toContain('ASSIGNMENT_SUBMITTED');expect(types).not.toContain('EXPLANATION_VIEWED');
 expect(new Set(submission.attempt.session.events.map((e:any)=>e.id)).size).toBe(submission.attempt.session.events.length);
});

test('an expired assignment pauses its reaction, survives refresh and remains submittable',async({page})=>{
 const config=defaultAssignmentConfig(experiments[1]);config.minutes=1;
 const beaker=createEquipment('beaker','timed-beaker',400,425);beaker.volume=30;beaker.contents={CuSO4:.01,NaOH:.02};const vessel=startReaction(beaker).v;
 const session=createSession('timed','lab-tester');session.startedAt=new Date(Date.now()-62000).toISOString();
 await page.addInitScript(({config,vessel,session})=>{
  const now=new Date().toISOString();localStorage.setItem('virtual-lab-classrooms-v1',JSON.stringify({state:{classes:[{id:'timed-class',name:'9A',teacherId:'teacher',teacherName:'Teacher',code:'TIMED123',createdAt:now,members:[{id:'lab-tester',name:'Student',joinedAt:now}]}],assignments:[{id:'timed',classId:'timed-class',experimentId:'precipitate',title:'Bài có giờ',instructions:'Quan sát',dueAt:'',createdAt:now,config}],materials:[],submissions:[]},version:0}));
  if(!localStorage.getItem('virtual-lab-v1'))localStorage.setItem('virtual-lab-v1',JSON.stringify({state:{templates:[],attempts:[],draftLabs:{'lab-tester:precipitate@timed':{vessels:[vessel],logs:[],notes:'',hints:0,equation:false,seconds:62,session,stockUsed:{CuSO4:10,NaOH:20},answers:{}}}},version:0}));
 },{config,vessel,session});
 await page.goto('/lab/precipitate?assignment=timed');await expect(page.locator('.lab-top .tag').filter({hasText:'Hết giờ'})).toBeVisible();await expect(page.locator('.reaction-status')).toContainText('tạm dừng');await expect(page.getByRole('button',{name:'Trộn & quan sát',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Nộp bài',exact:true})).toBeEnabled();
 await expect(page.getByLabel('Thời gian làm bài')).toBeVisible();
 await expect.poll(async()=> (await saved(page,'precipitate@timed')).session.events.filter((e:any)=>e.type==='TIME_LIMIT_REACHED').length).toBe(1);
 await page.reload();await expect(page.getByRole('button',{name:'Nộp bài',exact:true})).toBeEnabled();expect((await saved(page,'precipitate@timed')).session.events.filter((e:any)=>e.type==='TIME_LIMIT_REACHED')).toHaveLength(1);
 expect((await saved(page,'precipitate@timed')).vessels[0].reaction.extent).toBe(0);await page.getByRole('button',{name:'Nộp bài',exact:true}).click();await expect(page).toHaveURL(/results/);
});
