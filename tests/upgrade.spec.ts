import {test,expect} from '@playwright/test';
import {labSession} from "./lab-session";
test.beforeEach(async({page})=>labSession(page));
test('Học liệu: chọn lớp, đọc bài, lưu và tự kiểm tra',async({page})=>{
 await page.goto('/materials');await expect(page.getByRole('heading',{level:1})).toContainText('Mở từng trang');
 await page.getByRole('link',{name:/Lớp 11/}).click();await expect(page.locator('.folder-card')).toHaveCount(2);await page.getByRole('link',{name:/Cân bằng trong dung dịch/}).click();
 await page.getByRole('textbox',{name:'Tìm học liệu'}).fill('pH và lượng');await expect(page.locator('.folder-lesson')).toHaveCount(1);await page.getByRole('link',{name:'Đọc pH và lượng axit, bazơ dư'}).click();
 await page.getByRole('button',{name:'Lưu bài học',exact:true}).click();await page.getByRole('button',{name:'B Tổng thể tích dung dịch sau trộn theo mô hình'}).click();await page.getByRole('button',{name:'Kiểm tra đáp án'}).click();await expect(page.getByRole('status')).toContainText('Chính xác');await page.getByRole('button',{name:'Đánh dấu đã đọc'}).click();await page.reload();await expect(page.getByRole('button',{name:'Đã lưu bài'})).toBeVisible();await expect(page.getByRole('button',{name:'Đã đánh dấu đọc'})).toBeVisible();
 await page.screenshot({path:'artifacts/bai-hoc.png',fullPage:true});await page.goto('/materials');await page.screenshot({path:'artifacts/hoc-lieu.png',fullPage:true});
});
test('Từ điển: mô tả dụng cụ và hóa chất',async({page})=>{
 await page.goto('/materials?tab=atlas');await page.getByRole('link',{name:/Dụng cụ/}).click();await page.getByRole('button',{name:/Bình tam giác/}).click();await expect(page.getByRole('dialog')).toContainText('Lắc xoay nhẹ');await page.getByRole('button',{name:'Đóng thông tin'}).click();await page.goto('/materials?tab=atlas&folder=chemicals');await page.getByRole('button',{name:/Axit clohidric/}).click();await expect(page.getByRole('dialog')).toContainText('không màu');await expect(page.getByRole('dialog')).toContainText('36.46 g/mol');
});
test('Bảng giá đúng chu kỳ và đăng ký demo',async({page})=>{
 await page.goto('/pricing');const personal=page.locator('.price-card').filter({has:page.getByRole('heading',{name:'Cá nhân',exact:true})});const teacher=page.locator('.price-card').filter({has:page.getByRole('heading',{name:'Giáo viên',exact:true})});
 await expect(personal.locator('.price-amount')).toContainText('30.000');await expect(teacher.locator('.price-amount')).toContainText('40.000');await page.getByRole('button',{name:'6 tháng',exact:true}).click();await expect(personal.locator('.price-amount')).toContainText('150.000');await expect(teacher.locator('.price-amount')).toContainText('170.000');await page.getByRole('button',{name:'1 năm Tiết kiệm hơn'}).click();await expect(personal.locator('.price-amount')).toContainText('250.000');await expect(teacher.locator('.price-amount')).toContainText('270.000');
 await page.screenshot({path:'artifacts/goi-su-dung.png',fullPage:true});await teacher.getByRole('button',{name:'Chọn gói giáo viên'}).click();await page.getByLabel('Họ và tên').fill('Giáo viên Demo');await page.getByLabel('Email',{exact:true}).fill('demo@example.com');await page.getByRole('button',{name:'Xác nhận đăng ký demo'}).click();await expect(page.getByRole('heading',{name:'Đã lưu đăng ký demo.'})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-plan-requests')!)[0].price)).toBe(270000);
});
test('Di động: học liệu, bảng giá và bàn lab không tràn ngang',async({page})=>{
 await page.setViewportSize({width:390,height:844});for(const route of ['/materials','/pricing','/lab/precipitate']){await page.goto(route);await expect(page.locator('main')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
 await page.getByRole('button',{name:'Thêm dụng cụ đầu tiên'}).click();await expect(page.locator('canvas')).toHaveCount(1);await page.screenshot({path:'artifacts/lab-mobile-moi.png',fullPage:true});
});
