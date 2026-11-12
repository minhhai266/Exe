import {test,expect,type Page} from '@playwright/test';

async function asUser(page:Page,id:string,role:'student'|'teacher'){
 await page.goto('/');
 await page.evaluate(({id,role})=>sessionStorage.setItem('virtual-lab-session',JSON.stringify({id,name:id==='teacher'?'Cô Lan':id==='student'?'Minh Anh':'Bạn khác',email:id+'@example.com',role})),{id,role});
 await page.goto('/'+role+'/dashboard');
}

test('free library requires an account and paid labs stay locked without an entitlement',async({page})=>{
 await page.goto('/experiments');
 await page.getByRole('button',{name:'Miễn phí',exact:true}).click();
 await expect(page.locator('.experiment-card')).toHaveCount(2);
 await page.getByRole('button',{name:'Trả phí',exact:true}).click();
 await expect(page.locator('.experiment-card')).toHaveCount(2);
 await page.goto('/lab/hydrogen');await expect(page).toHaveURL(/login/);
 await asUser(page,'student','student');
 await page.goto('/lab/hydrogen');await expect(page.locator('canvas')).toHaveCount(1);
 await page.goto('/lab/oxygen');await expect(page.getByRole('heading',{name:'Nội dung dành cho gói trả phí'})).toBeVisible();
 await expect(page.locator('canvas')).toHaveCount(0);
 await page.evaluate(()=>localStorage.setItem('virtual-lab-plan-requests',JSON.stringify([{plan:'Cá nhân',status:'demo'}])));
 await page.reload();await expect(page.locator('canvas')).toHaveCount(0);
});

test('teacher creates a class, student joins, receives material, submits and sees teacher feedback',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await asUser(page,'teacher','teacher');
 await page.getByRole('link',{name:'Quản lý lớp học',exact:true}).click();
 await page.getByRole('button',{name:'Tạo lớp',exact:true}).click();await page.getByLabel('Tên lớp',{exact:true}).fill('Hóa học 9A');
 await page.getByRole('dialog').getByRole('button',{name:'Tạo lớp',exact:true}).click();
 const classUrl=page.url();const classId=classUrl.split('/').pop()!;
 await page.getByRole('button',{name:'Mã tham gia',exact:true}).click();const code=await page.locator('.class-code strong').innerText();await page.getByRole('button',{name:'Đóng',exact:true}).click();expect(code).toMatch(/^[A-Z2-9]{8}$/);
 await page.getByRole('button',{name:'Giao bài thực hành',exact:true}).click();await page.getByLabel('Tiêu đề bài giao').fill('Quan sát kết tủa');
 await page.getByLabel('Thí nghiệm',{exact:true}).selectOption('precipitate');
 await page.getByLabel('Yêu cầu cho học sinh').fill('Ghi lại màu kết tủa và giải thích.');
 await page.getByRole('button',{name:'Giao bài cho lớp',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Đã giao bài cho lớp.');
 await page.getByRole('tab',{name:'Tài liệu',exact:true}).click();
 await page.getByRole('button',{name:'Gửi tài liệu',exact:true}).click();await page.getByLabel('Tiêu đề tài liệu').fill('Phiếu quan sát');
 await page.getByLabel('Nội dung / hướng dẫn').fill('Đọc trước khi thực hành.');
 await page.getByLabel('Liên kết tài liệu').fill('https://example.com/phieu.pdf');
 await page.getByRole('dialog').getByRole('button',{name:'Gửi tài liệu',exact:true}).click();
 await asUser(page,'student','student');
 await page.goto('/student/classes/'+classId);await expect(page.getByRole('heading',{name:'Không tìm thấy lớp hoặc bạn chưa tham gia.'})).toBeVisible();
 await page.goto('/student/classes');await page.getByRole('button',{name:'Tham gia lớp',exact:true}).click();await page.getByLabel('Mã tham gia').fill('INVALID');await page.getByRole('dialog').getByRole('button',{name:'Tham gia lớp',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Không tìm thấy lớp');
 await page.getByLabel('Mã tham gia').fill(code);await page.getByRole('dialog').getByRole('button',{name:'Tham gia lớp',exact:true}).click();
 await page.getByRole('tab',{name:'Thành viên',exact:true}).click();
 await expect(page.locator('.class-member')).toHaveCount(2);await expect(page.locator('.class-member')).toContainText(['Cô Lan','Minh Anh']);
 await page.getByRole('tab',{name:'Tài liệu',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Phiếu quan sát'})).toBeVisible();await expect(page.getByRole('link',{name:'Mở tài liệu'})).toHaveAttribute('href','https://example.com/phieu.pdf');
 await page.getByRole('tab',{name:'Bài được giao',exact:true}).click();
 await page.getByRole('link',{name:'Làm bài thực hành'}).click();
 const assignmentUrl=page.url();
 await page.locator('.inventory-item').filter({hasText:'Cốc thủy tinh'}).click();
 await page.locator('.lab-actions-menu>summary').click();await page.getByRole('button',{name:'Ghi chép',exact:true}).click();await page.locator('.modal textarea').first().fill('Dung dịch có màu xanh.');await page.getByRole('button',{name:'Lưu ghi chép'}).click();
 await page.getByRole('button',{name:'Nộp bài',exact:true}).click();await expect(page).toHaveURL(/results/);
 const resultUrl=page.url();
 await asUser(page,'stranger','student');await page.goto(resultUrl);await expect(page.getByText('Chưa tìm thấy kết quả này')).toBeVisible();
 await page.goto(assignmentUrl);await expect(page.getByRole('heading',{name:'Không thể mở bài được giao'})).toBeVisible();
 await asUser(page,'teacher','teacher');await page.goto(classUrl);
 await page.getByRole('link',{name:'Quản lý bài nộp'}).click();
 await expect(page.locator('tbody tr')).toContainText('Minh Anh');await expect(page.locator('tbody tr')).toContainText('Đã nộp');
 await page.locator('.submission-review>summary').first().click();await expect(page.getByText('Dung dịch có màu xanh.',{exact:true})).toBeVisible();
 await page.getByLabel('Điểm tiêu chí: Quan sát và lập luận', {exact:false}).fill('2.5');await page.getByLabel('Điểm tiêu chí: Phương trình và kết luận', {exact:false}).fill('3');await page.getByRole('button',{name:'Điền tổng điểm rubric'}).click();await expect(page.getByLabel('Điểm (0–10)')).toHaveValue('5.5');await page.getByLabel('Điểm (0–10)').fill('8.5');await page.getByLabel('Nhận xét',{exact:true}).fill('Bổ sung giải thích phản ứng.');await page.getByRole('button',{name:'Lưu đánh giá'}).click();
 await expect(page.getByRole('status')).toHaveText('Đã lưu điểm và nhận xét.');
 await page.screenshot({path:'artifacts/class-submissions-desktop.png',fullPage:true});
 await page.goto('/teacher/reports');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất báo cáo CSV'}).click();expect((await download).suggestedFilename()).toBe('bao-cao-lop-hoc.csv');
 await asUser(page,'student','student');await page.goto('/student/classes/'+classId);
 await expect(page.getByText(/Điểm: 8.5\/10/)).toBeVisible();await expect(page.getByText('Nhận xét: Bổ sung giải thích phản ứng.')).toBeVisible();
 await page.setViewportSize({width:390,height:844});await expect.poll(async()=>{const b=await page.locator('.workspace-sidebar').boundingBox();return b!.x+b!.width}).toBeLessThanOrEqual(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'artifacts/class-student-mobile.png',fullPage:true});
 expect(errors).toEqual([]);
});

test('membership updates across tabs while another teacher cannot manage the class',async({page,context})=>{
 await asUser(page,'teacher','teacher');await page.goto('/teacher/classes');await page.getByRole('button',{name:'Tạo lớp',exact:true}).click();await page.getByLabel('Tên lớp',{exact:true}).fill('Lớp đồng bộ');await page.getByRole('dialog').getByRole('button',{name:'Tạo lớp',exact:true}).click();const url=page.url();await page.getByRole('button',{name:'Mã tham gia',exact:true}).click();const code=await page.locator('.class-code strong').innerText();await page.getByRole('button',{name:'Đóng',exact:true}).click();await page.getByRole('tab',{name:'Thành viên',exact:true}).click();
 const student=await context.newPage();await asUser(student,'student','student');await student.goto('/student/classes');await student.getByRole('button',{name:'Tham gia lớp',exact:true}).click();await student.getByLabel('Mã tham gia').fill(code);await student.getByRole('dialog').getByRole('button',{name:'Tham gia lớp',exact:true}).click();
 await expect(page.locator('.class-member')).toHaveCount(2);
 await asUser(student,'another-teacher','teacher');await student.goto(url);await expect(student.getByRole('heading',{name:'Không tìm thấy lớp hoặc bạn chưa tham gia.'})).toBeVisible();await expect(student.getByRole('button',{name:'Giao bài cho lớp'})).toHaveCount(0);await student.close();
});
