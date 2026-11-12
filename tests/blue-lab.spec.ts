import {test,expect} from '@playwright/test';
import {labSession} from "./lab-session";
test.beforeEach(async({page})=>labSession(page));

test('quick mode replaces the table and reset clears it with undo',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/lab/precipitate');await page.getByRole('button',{name:'Thêm dụng cụ đầu tiên'}).click();
 await page.getByRole('button',{name:'Tự lắp ráp',exact:true}).click();
 await page.locator('.inventory-item').filter({hasText:'Cốc thủy tinh'}).click();
 await expect(page.getByText('2 dụng cụ',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Thực hành nhanh',exact:true}).click();
 await expect(page.getByText('1 dụng cụ',{exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(0);
 const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')!).state.draftLabs['lab-tester:precipitate'].vessels[0].id);
 await page.getByRole('button',{name:'Thực hành nhanh',exact:true}).click();
 const second=await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')!).state.draftLabs['lab-tester:precipitate'].vessels[0].id);expect(second).not.toBe(first);
 await page.getByRole('button',{name:'Gợi ý',exact:true}).click();await expect(page.getByRole('heading',{name:'Một chút gợi mở'})).toBeVisible();await page.getByRole('button',{name:'Đóng',exact:true}).click();
 await page.getByRole('button',{name:'Hóa chất',exact:true}).click();await expect(page.locator('.cute-bottle')).toHaveCount(2);
 await page.getByRole('button',{name:'Đóng thông báo'}).click();await page.screenshot({path:'artifacts/lab-xanh-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'artifacts/lab-xanh-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Xóa toàn bộ',exact:true}).click();await page.getByRole('button',{name:'Làm mới bàn thực hành'}).click();await expect(page.getByText('0 dụng cụ',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')!).state.draftLabs['lab-tester:precipitate'].vessels)).toEqual([]);
 await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();await expect(page.getByText('1 dụng cụ',{exact:true})).toBeVisible();expect(errors).toEqual([]);
});

test('draw a flexible tube along the cursor between actual vessel ports',async({page})=>{
 await page.goto('/lab/hydrogen');await page.getByRole('button',{name:'Tự lắp ráp',exact:true}).click();await page.getByRole('button',{name:'Lắp bộ thu khí mẫu'}).click();
 await page.getByRole('button',{name:'Tháo ống nối',exact:true}).click();
 await page.getByRole('button',{name:'Tiện ích',exact:true}).click();await page.locator('.inventory-item').filter({hasText:'Ống dẫn khí'}).click();
 await page.getByRole('button',{name:'Vẽ ống theo tay'}).click();
 const raw=(await page.locator('canvas').boundingBox())!,scale=Math.min(raw.width/1000,raw.height/540),box={x:raw.x+(raw.width-1000*scale)/2,y:raw.y+(raw.height-540*scale)/2};
 await page.mouse.move(box.x+289*scale,box.y+172*scale);await page.mouse.down();
 for(const [x,y] of [[420,100],[610,130],[774,435]])await page.mouse.move(box.x+x*scale,box.y+y*scale,{steps:12});
 await page.mouse.up();await expect(page.getByRole('status')).toContainText('Đã nối ống theo đường bạn kéo');
 await page.waitForTimeout(1200);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')!).state.draftLabs['lab-tester:hydrogen'].vessels);
 const tube=saved.find((v:any)=>v.type==='tubing');expect(tube.tubeShape.points.length).toBeGreaterThanOrEqual(3);expect(saved.find((v:any)=>v.id===tube.tubeShape.from).connections).toContain(tube.tubeShape.to);
 await page.screenshot({path:'artifacts/ong-dan-keo-tu-do.png',fullPage:true});
});

test('teacher generates, reviews, edits and saves a Gemini draft as a runnable lesson',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('virtual-lab-session',JSON.stringify({id:'test-teacher',name:'Giáo viên',email:'test@example.com',role:'teacher'})));
 let calls=0;
 await page.route('**/api/reaction-draft',async route=>{calls++;expect(route.request().postDataJSON().prompt).toContain('CuSO4');await route.fulfill({json:{draft:{title:'Bài Gemini kết tủa',objectives:'Quan sát kết tủa xanh và giải thích hệ số mol.',instructions:'Thêm CuSO4 và NaOH rồi trộn.',hints:['Chọn hai dung dịch.','So sánh số mol.','Một mol đồng cần hai mol bazơ.'],reactants:[{chemical:'CuSO4',coefficient:1},{chemical:'NaOH',coefficient:2}],products:[{chemical:'Cu(OH)2',coefficient:1},{chemical:'Na2SO4',coefficient:1}],observation:'Kết tủa xanh lam.',explanation:'Cu²⁺ kết hợp với OH⁻ tạo chất rắn ít tan.',source:'https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch18/complex.php',minTemperature:20,durationSeconds:1}}})});
 await page.goto('/teacher/experiments/new');await page.getByRole('button',{name:'Tạo với AI · Gemini',exact:true}).click();await page.getByLabel('Yêu cầu cho Gemini').fill('Soạn bài CuSO4 và NaOH tạo kết tủa xanh');await page.getByRole('button',{name:'Tạo với Gemini'}).click();
 await expect(page.getByLabel('Tên bài thực hành')).toHaveValue('Bài Gemini kết tủa');expect(calls).toBe(1);
 await page.getByLabel('Hệ số tham gia 2',{exact:true}).fill('1');await expect(page.locator('.validation-error')).toContainText('chưa cân bằng');
 await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();await expect(page.locator('.form-message')).toContainText('chưa cân bằng');
 await page.getByLabel('Hệ số tham gia 2',{exact:true}).fill('2');await page.getByLabel('Hiện tượng quan sát').fill('Giáo viên: kết tủa xanh xuất hiện rồi lắng.');
 await page.getByLabel('Tôi đã kiểm tra nguồn').check();await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();await expect(page.locator('.form-message')).toContainText('Đã lưu bản nháp');
 await page.screenshot({path:'artifacts/giao-vien-soan-gemini.png',fullPage:true});
 const form=await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')!).state.templates[0]);expect(form.customReaction.reactants.NaOH).toBe(2);expect(form.customReaction.observation).toContain('Giáo viên:');
 await page.getByRole('button',{name:'Xem trước & kiểm tra',exact:true}).click();await page.getByLabel('Tôi đã xem trước và kiểm tra').check();await page.getByRole('button',{name:'Xuất bản bài thực hành'}).click();await expect(page).toHaveURL(/teacher\/dashboard/);
 await page.goto('/lab/'+form.id);await page.getByRole('button',{name:'Thực hành nhanh',exact:true}).click();await page.getByRole('button',{name:'Bắt đầu phản ứng',exact:true}).click();
 await expect(page.locator('.reaction-status')).toContainText('Phản ứng hoàn tất');await expect(page.locator('.observations')).toContainText('Giáo viên: kết tủa');
});

test('unconfigured Gemini reports a useful error and manual authoring remains available',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('virtual-lab-session',JSON.stringify({id:'teacher',name:'Teacher',email:'test@example.com',role:'teacher'})));
 await page.route('**/api/reaction-draft',route=>route.fulfill({status:503,json:{error:'Chưa cấu hình Gemini. Có thể dùng Tự soạn phản ứng ngay.'}}));
 await page.goto('/teacher/experiments/new');await page.getByRole('button',{name:'Tạo với AI · Gemini',exact:true}).click();await page.getByLabel('Yêu cầu cho Gemini').fill('Soạn bài phản ứng kết tủa');await page.getByRole('button',{name:'Tạo với Gemini'}).click();await expect(page.getByRole('alert')).toContainText('Chưa cấu hình Gemini');
 await page.getByRole('button',{name:'Tự soạn phản ứng'}).click();await expect(page.locator('.reaction-editor')).toBeVisible();await expect(page.locator('.validation-success')).toBeVisible();
});
