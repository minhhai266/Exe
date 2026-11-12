import {test,expect} from '@playwright/test';
import {labSession} from './lab-session';

test('teacher workspace sidebar, creator review and draft preview preserve data',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('virtual-lab-session',JSON.stringify({id:'teacher-qa',name:'Giáo viên QA',email:'qa@example.com',role:'teacher'})));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/teacher/dashboard');await expect(page.getByRole('heading',{level:1})).toContainText('Giáo viên QA');
 await expect(page.locator('.dashboard-metrics .stat')).toHaveCount(4);
 await page.getByRole('button',{name:'Thu gọn thanh bên'}).click();await expect(page.locator('.workspace')).toHaveClass(/sidebar-collapsed/);
 await page.getByRole('button',{name:'Mở rộng thanh bên'}).click();
 await page.goto('/teacher/experiments/new');await expect(page.locator('.workspace-sidebar nav a.active')).toHaveCount(1);
 await page.getByLabel('Tên bài thực hành').fill('Bài kiểm tra quy trình mới');
 await page.getByRole('button',{name:'2. Hóa chất & dụng cụ',exact:true}).click();
 await page.getByRole('button',{name:'1. Thông tin',exact:true}).click();await expect(page.getByLabel('Tên bài thực hành')).toHaveValue('Bài kiểm tra quy trình mới');
 await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();await expect(page.getByRole('status')).toContainText('Đã lưu bản nháp');
 await page.getByRole('button',{name:'Xem trước & kiểm tra',exact:true}).click();
 await expect(page.locator('.builder-preview')).toBeVisible();
 await page.getByRole('button',{name:'Lưu & mở bản xem thử',exact:true}).click();
 await expect(page).toHaveURL(/preview=1/);await expect(page.locator('canvas')).toHaveCount(1);
 const template=await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')!).state.templates[0]);expect(template.status).toBe('draft');
 await page.goto('/experiments');await expect(page.locator('.experiment-card')).toHaveCount(4);
 expect(errors).toEqual([]);
});

test('workspace responsive routes and chemistry lab keep usable layouts',async({page})=>{
 await labSession(page);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [375,390,768,1024,1366,1440,1920]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/student/dashboard','/experiments','/materials','/materials?grade=9','/lab/precipitate?new=1']){
   await page.goto(route);await expect(page.locator('main')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} at ${width}`).toBe(true);
  }
  await expect(page.getByRole('button',{name:'Bắt đầu phản ứng',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Nộp bài',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();
  await expect(page.getByRole('button',{name:'Bắt đầu phản ứng',exact:true})).toBeEnabled();
  if(width>=1366){await page.getByRole('button',{name:'Thu gọn kho dụng cụ',exact:true}).click();await expect(page.locator('#lab-inventory')).toBeHidden();await page.getByRole('button',{name:'Mở kho dụng cụ',exact:true}).click();await expect(page.locator('#lab-inventory')).toBeVisible()}
  await page.screenshot({path:`artifacts/product-lab-${width}.png`,fullPage:true});
 }
 expect(errors).toEqual([]);
});

test('AI failure gives retry and requires teacher review',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('virtual-lab-session',JSON.stringify({id:'teacher-qa',name:'Giáo viên QA',email:'qa@example.com',role:'teacher'})));
 await page.route('**/api/reaction-draft',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Chưa cấu hình Gemini trên máy chủ.'})}));
 await page.goto('/teacher/experiments/new');await page.getByRole('button',{name:'Tạo với AI · Gemini',exact:true}).click();
 await page.getByLabel('Yêu cầu cho Gemini').fill('Soạn bài lớp 9 về phản ứng tạo kết tủa xanh.');
 await page.getByRole('button',{name:'Tạo với Gemini',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Chưa cấu hình');
 await expect(page.getByRole('button',{name:'Thử lại với Gemini'})).toBeEnabled();
 await expect(page.locator('.ai-caution')).toContainText('AI có thể sai');
});

test('teacher reports filter real assignments and CSV scope; representative page screenshots',async({page})=>{
 await page.addInitScript(()=>{
  sessionStorage.setItem('virtual-lab-session',JSON.stringify({id:'teacher-audit',name:'Giáo viên kiểm thử',email:'audit@example.com',role:'teacher'}));
  if(!localStorage.getItem('virtual-lab-classrooms-v1')){
   const now=new Date().toISOString();
   localStorage.setItem('virtual-lab-classrooms-v1',JSON.stringify({state:{classes:[{id:'qa-class',name:'Lớp kiểm thử giao diện',code:'QA234567',teacherId:'teacher-audit',teacherName:'Giáo viên kiểm thử',members:[{id:'qa-student',name:'Học sinh kiểm thử',joinedAt:now}],createdAt:now}],assignments:[{id:'qa-assignment',classId:'qa-class',experimentId:'precipitate',title:'Bài kiểm thử kết tủa',instructions:'Quan sát màu kết tủa.',dueAt:'',createdAt:now}],submissions:[],materials:[]},version:0}));
  }
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1000});
  const routes=['/teacher/dashboard','/teacher/classes','/teacher/classes/qa-class','/teacher/experiments/new','/teacher/reports','/experiments','/experiments/precipitate','/materials','/materials?grade=9'];
  for(const [i,route] of routes.entries()){
   await page.goto(route);await expect(page.locator('h1')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} at ${width}`).toBe(true);
   await page.screenshot({path:`artifacts/product-page-${i}-${width}.png`,fullPage:true});
  }
  await page.locator('.folder-card').first().click();await page.screenshot({path:`artifacts/product-chapter-${width}.png`,fullPage:true});
  await page.locator('.folder-lesson a').first().click();await page.screenshot({path:`artifacts/product-lesson-${width}.png`,fullPage:true});
 }
 await page.goto('/teacher/reports');await expect(page.locator('tbody tr')).toHaveCount(1);
 await page.getByLabel('Trạng thái bài nộp').selectOption('pending');await expect(page.locator('tbody tr')).toHaveCount(0);
 await page.getByLabel('Trạng thái bài nộp').selectOption('missing');await expect(page.locator('tbody tr')).toHaveCount(1);
 const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất báo cáo CSV'}).click();
 expect((await downloading).suggestedFilename()).toBe('bao-cao-lop-hoc.csv');
 expect(errors).toEqual([]);
});
