import {test,expect,type APIRequestContext,type Page} from '@playwright/test';

async function admin(request:APIRequestContext){
 const state=await (await request.get('/api/admin/auth/state')).json();
 const result=await request.post(state.setupRequired?'/api/admin/auth/setup':'/api/admin/auth/login',{headers:{'x-virtual-lab':'1'},data:{name:'Admin QA',email:'qa@example.test',password:'Testing-password-123!'}});expect(result.ok()).toBeTruthy();
}
const step=(page:Page,n:number)=>page.getByRole('navigation',{name:'Các bước tạo phản ứng'}).getByRole('button').nth(n-1).click();
async function savedPreview(page:Page){return page.evaluate(()=>Object.entries(JSON.parse(localStorage.getItem('virtual-lab-v1')||'{"state":{"draftLabs":{}}}').state.draftLabs).find(([key])=>key.includes('preview:'))?.[1] as any)}

test('an AI outage retains the input and existing draft and allows a manual retry',async({page,context})=>{
 await admin(context.request);
 await page.route('**/api/reaction-studio/config',async route=>{const result=await route.fetch();await route.fulfill({json:{...await result.json(),configured:true}})});
 await page.goto('/admin/reactions/studio');await page.getByRole('button',{name:'Phân tích phương trình',exact:true}).click();await expect(page).toHaveURL(/draft=/);const id=new URL(page.url()).searchParams.get('draft');
 await step(page,1);const description='Tạo thí nghiệm trộn dung dịch đồng(II) sunfat với natri hiđroxit.';
 await page.getByRole('textbox',{name:'Phương trình hoặc mô tả phản ứng',exact:true}).fill(description);
 await page.route('**/api/reaction-studio/analyze',route=>route.fulfill({status:503,json:{error:{message:'Gemini đang quá tải tạm thời. Vui lòng thử sau.'}}}));
 await page.getByRole('button',{name:'Phân tích bằng AI',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('quá tải');await expect(page.getByRole('textbox',{name:'Phương trình hoặc mô tả phản ứng',exact:true})).toHaveValue(description);await expect(page.getByRole('button',{name:'Phân tích bằng AI',exact:true})).toBeEnabled();
 expect((await (await context.request.get('/api/reaction-studio/drafts/'+id)).json()).validation.previewAllowed).toBe(true);
});

test('teacher creator uses the actual empty Lab, precipitates after manual mixing, saves a trial and publishes',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await admin(context.request);
 await page.goto('/admin/reactions/studio');await page.getByRole('button',{name:'Phân tích phương trình',exact:true}).click();
 await expect(page).toHaveURL(/draft=/);const draftId=new URL(page.url()).searchParams.get('draft')!;
 await expect(page.locator('.studio-support')).toHaveText('Được hỗ trợ');await expect(page.getByLabel('Tên phản ứng',{exact:true})).toBeVisible();
 await page.getByLabel('Tên phản ứng',{exact:true}).fill('Kết tủa từ AI Reaction Creator');await page.getByRole('button',{name:'Lưu bản nháp & kiểm tra',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Đã lưu bản nháp'})).toBeVisible();
 await step(page,3);await expect(page.getByRole('heading',{name:'Cấu hình bàn thực hành'})).toBeVisible();
 await step(page,4);await page.getByRole('link',{name:/Mở bàn Lab/}).click();
 await expect(page.locator('.bench-viewport canvas')).toBeVisible();
 await expect.poll(async()=>(await savedPreview(page))?.vessels.length).toBe(0);
 await page.locator('.inventory-item').filter({hasText:'Cốc thủy tinh'}).click();
 await page.getByRole('button',{name:'Hóa chất',exact:true}).click();await page.getByLabel('Đơn vị hóa chất').selectOption('mL');await page.getByLabel('Lượng hóa chất').fill('5');
 await page.locator('.inventory-item').filter({hasText:'Đồng(II) sunfat'}).click();
 await expect(page.getByRole('button',{name:'Trộn & quan sát',exact:true})).toBeDisabled();
 await page.getByLabel('Lượng hóa chất').fill('10');await page.locator('.inventory-item').filter({hasText:'Natri hiđroxit'}).click();await page.getByRole('button',{name:'Trộn & quan sát',exact:true}).click();
 await expect.poll(async()=>(await savedPreview(page))?.vessels[0]?.produced?.['Cu(OH)2']||0,{timeout:20000}).toBeGreaterThan(.0049);
 await expect.poll(async()=>(await savedPreview(page))?.vessels[0]?.reaction?.status).toBe('complete');
 const before=(await savedPreview(page)).vessels[0];
 const box=(await page.locator('.bench-viewport canvas').boundingBox())!,scale=Math.min(box.width/1000,box.height/485),ox=box.x+(box.width-1000*scale)/2,oy=box.y+(box.height-485*scale)/2-55*scale;
 await page.mouse.move(ox+before.x*scale,oy+(before.y-35)*scale);await page.mouse.down();await page.mouse.move(ox+(before.x+150)*scale,oy+(before.y-35)*scale,{steps:10});await page.mouse.up();
 await expect.poll(async()=>(await savedPreview(page))?.vessels[0]?.x).toBeGreaterThan(before.x+100);
 expect((await savedPreview(page)).vessels[0].produced['Cu(OH)2']).toBe(before.produced['Cu(OH)2']);
 await page.screenshot({path:'artifacts/creator-actual-precipitation.png',fullPage:true});
 await page.getByRole('button',{name:'Lưu lần chạy thử',exact:true}).click();await expect(page).toHaveURL(/admin\/reactions\/studio\?draft=/);
 await step(page,5);await page.getByLabel('Ghi chú kiểm chứng',{exact:true}).fill('Đối chiếu phương trình, pha và hiện tượng với nguồn thư viện.');await page.getByRole('checkbox',{name:/Tôi đã đối chiếu nội dung/}).check();await page.getByRole('button',{name:'Xác nhận kiểm chứng',exact:true}).click();
 await expect(page.locator('.studio-review-complete')).toBeVisible();await page.getByRole('button',{name:'Xuất bản vào thư viện',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Xác nhận',exact:true}).click();
 await expect(page.getByRole('link',{name:'Mở phản ứng đã xuất bản',exact:true})).toBeVisible();
 expect((await (await context.request.get('/api/reaction-studio/drafts/'+draftId)).json()).status).toBe('published');
 for(const width of [1440,390]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`artifacts/creator-wizard-${width}.png`,fullPage:true});}
 expect(errors).toEqual([]);
});

test('gas and unsupported equations retain validation and block false previews',async({page,context})=>{
 await admin(context.request);await page.goto('/admin/reactions/studio');
 await page.getByRole('textbox',{name:'Phương trình hoặc mô tả phản ứng',exact:true}).fill('Zn + 2HCl -> ZnCl2 + H2');await page.getByRole('button',{name:'Phân tích phương trình',exact:true}).click();await expect(page).toHaveURL(/draft=/);
 const id=new URL(page.url()).searchParams.get('draft');const preview=await (await context.request.get('/api/reaction-studio/drafts/'+id+'/preview')).json();expect(preview.validation.effects).toEqual(expect.arrayContaining(['GAS_BUBBLES','SOLID_DISSOLUTION','GAS_FLOW']));
 await step(page,1);await page.getByRole('textbox',{name:'Phương trình hoặc mô tả phản ứng',exact:true}).fill('AgNO3 + NaCl -> AgCl + NaNO3');await page.getByRole('button',{name:'Phân tích phương trình',exact:true}).click();await expect(page.locator('.studio-support')).toHaveText('Chưa hỗ trợ');await step(page,4);
 await expect(page.getByRole('link',{name:/Mở bàn Lab/})).toHaveCount(0);await expect(page.locator('.studio-preview')).toContainText('chưa đủ điều kiện');
});

test('a teacher creates a server class and assigns a pinned snapshot with reviewed questions',async({page,context,browser})=>{
 await admin(context.request);
 const write=async(path:string,data:any)=>{const response=await context.request.post(path,{headers:{'x-virtual-lab':'1'},data});expect(response.ok(),await response.text()).toBeTruthy();return response.json()};
 const school=await write('/api/admin/schools',{name:'Creator school',code:'creator-e2e',status:'active',data:{}});
 const invited=await write('/api/admin/users',{name:'Creator Teacher',status:'invited',data:{email:'creator-teacher@example.test',role:'TEACHER',schoolId:school.id}});
 const fresh=await browser.newContext({baseURL:'http://127.0.0.1:5176'}),teacherPage=await fresh.newPage();
 try{
  const token=new URL(invited.activationPath,'http://test').searchParams.get('token');await fresh.request.post('/api/admin/auth/activate',{headers:{'x-virtual-lab':'1'},data:{token,password:'Creator-password-123!'}});
  await teacherPage.goto('/login');await teacherPage.getByLabel('Email',{exact:true}).fill('creator-teacher@example.test');await teacherPage.getByLabel('Mật khẩu',{exact:true}).fill('Creator-password-123!');await teacherPage.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(teacherPage).toHaveURL(/teacher\/dashboard/);
  await teacherPage.goto('/teacher/classes');await teacherPage.getByRole('button',{name:'Tạo lớp',exact:true}).click();await teacherPage.getByLabel('Tên lớp',{exact:true}).fill('Lớp Creator 9A');await teacherPage.getByRole('dialog').getByRole('button',{name:'Tạo lớp',exact:true}).click();await expect(teacherPage).toHaveURL(/teacher\/classes\//);
  const classId=teacherPage.url().split('/').at(-1)!;
  await teacherPage.goto('/teacher/reaction-studio');await teacherPage.getByRole('button',{name:'Phân tích phương trình',exact:true}).click();await expect(teacherPage).toHaveURL(/draft=/);const draftId=new URL(teacherPage.url()).searchParams.get('draft')!;
  await step(teacherPage,5);await teacherPage.getByRole('button',{name:'Thêm câu hỏi thủ công',exact:true}).click();await teacherPage.getByLabel('Nội dung câu hỏi',{exact:true}).fill('Mô tả màu kết tủa.');await teacherPage.getByLabel('Đáp án / hướng dẫn chấm',{exact:true}).fill('Đáp án riêng: xanh lam.');await teacherPage.getByRole('checkbox',{name:'Tôi đã kiểm tra và duyệt câu hỏi này',exact:true}).check();await teacherPage.getByRole('button',{name:'Lưu thay đổi & kiểm tra',exact:true}).click();await expect(teacherPage.getByRole('status').filter({hasText:'Đã lưu bản nháp'})).toBeVisible();
  await teacherPage.getByLabel('Ghi chú kiểm chứng',{exact:true}).fill('Đã đối chiếu nguồn và câu hỏi.');await teacherPage.getByRole('checkbox',{name:/Tôi đã đối chiếu nội dung/}).check();await teacherPage.getByRole('button',{name:'Xác nhận kiểm chứng',exact:true}).click();await expect(teacherPage.locator('.studio-review-complete')).toBeVisible();
  await teacherPage.getByLabel('Chọn lớp',{exact:true}).selectOption(classId);await teacherPage.getByRole('button',{name:'Giao phiên bản này cho lớp',exact:true}).click();await expect(teacherPage).toHaveURL(/teacher\/classes\//);
  const state=await (await fresh.request.get('/api/learning/state')).json();expect(state.assignments).toHaveLength(1);expect(state.assignments[0].config.experiment.reactionDefinition.id).toBe(draftId);expect(state.assignments[0].config.questions).toEqual(['Mô tả màu kết tủa.']);expect(JSON.stringify(state.assignments)).not.toContain('Đáp án riêng');
  await teacherPage.evaluate(()=>localStorage.removeItem('virtual-lab-classrooms-v1'));await teacherPage.reload();await expect(teacherPage.getByRole('heading',{name:'Lớp Creator 9A',exact:true})).toBeVisible();await expect(teacherPage.locator('.class-assignment')).toHaveCount(1);
  const studentInvite=await write('/api/admin/users',{name:'Creator Student',status:'invited',data:{email:'creator-student@example.test',role:'STUDENT',schoolId:school.id}});
  const studentContext=await browser.newContext({baseURL:'http://127.0.0.1:5176'}),student=await studentContext.newPage();
  try{
   await studentContext.request.post('/api/admin/auth/activate',{headers:{'x-virtual-lab':'1'},data:{token:new URL(studentInvite.activationPath,'http://test').searchParams.get('token'),password:'Student-password-123!'}});
   await student.goto('/login');await student.getByLabel('Email',{exact:true}).fill('creator-student@example.test');await student.getByLabel('Mật khẩu',{exact:true}).fill('Student-password-123!');await student.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(student).toHaveURL(/student\/dashboard/);
   await student.goto('/student/classes');await student.getByRole('button',{name:'Tham gia lớp',exact:true}).click();await student.getByLabel('Mã tham gia',{exact:true}).fill(state.classes[0].code);await student.getByRole('dialog').getByRole('button',{name:'Tham gia lớp',exact:true}).click();await expect(student).toHaveURL(/student\/classes\//);
   await student.getByRole('link',{name:'Làm bài thực hành',exact:true}).click();await expect(student.locator('.bench-viewport canvas')).toBeVisible();
   await student.locator('.inventory-item').filter({hasText:'Cốc thủy tinh'}).click();await student.getByRole('button',{name:'Hóa chất',exact:true}).click();await student.getByLabel('Đơn vị hóa chất').selectOption('mL');await student.getByLabel('Lượng hóa chất').fill('5');await student.locator('.inventory-item').filter({hasText:'Đồng(II) sunfat'}).click();await student.getByLabel('Lượng hóa chất').fill('10');await student.locator('.inventory-item').filter({hasText:'Natri hiđroxit'}).click();await student.getByRole('button',{name:'Trộn & quan sát',exact:true}).click();
   await expect(student.locator('.reaction-status')).toContainText('Phản ứng hoàn tất',{timeout:20000});
   await student.getByRole('button',{name:'Viết ghi chép',exact:true}).click();await student.getByLabel('Mô tả màu kết tủa.',{exact:true}).fill('Xuất hiện chất rắn màu xanh lam.');await student.getByRole('button',{name:'Lưu ghi chép',exact:true}).click();await student.getByRole('button',{name:'Nộp bài',exact:true}).click();await expect(student).toHaveURL(/results\//);
   const submitted=await (await studentContext.request.get('/api/learning/state')).json();expect(submitted.submissions).toHaveLength(1);expect(Object.values(submitted.submissions[0].attempt.answers)).toContain('Xuất hiện chất rắn màu xanh lam.');expect(submitted.submissions[0].attempt.stockUsed).toMatchObject({CuSO4:5,NaOH:10});expect(submitted.submissions[0].grade).toBeNull();
   await teacherPage.reload();await expect(teacherPage.locator('.class-assignment')).toContainText('1/1');
  }finally{await studentContext.close()}
 }finally{await fresh.close()}
});
