import {test,expect} from '@playwright/test';
import {labSession} from "./lab-session";
test.beforeEach(async({page})=>labSession(page));

test('library has one banner and class joining opens only after clicking',async({page})=>{
 await page.goto('/experiments');
 await expect(page.locator('.page-banner')).toHaveCount(1);
 await expect(page.getByRole('heading',{name:'Khoa học nằm trong tay bạn.'})).toBeVisible();
 await expect(page.getByText('KHÔNG GIAN KHÁM PHÁ',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Bản demo cục bộ',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Học tập & khám phá',{exact:true})).toHaveCount(0);
 await expect(page.locator('.account-card')).toContainText('Học sinh kiểm thử');
 await page.screenshot({path:'artifacts/compact-library.png',fullPage:true});
 await page.goto('/student/classes');
 await expect(page.getByLabel('Mã tham gia',{exact:true})).toHaveCount(0);
 const button=page.getByRole('button',{name:'Tham gia lớp',exact:true});await button.click();
 await expect(page.getByRole('dialog',{name:'Tham gia lớp học'})).toBeVisible();
 await expect(page.getByLabel('Mã tham gia',{exact:true})).toBeFocused();
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  const box=await page.getByRole('dialog').boundingBox();
  expect(Math.abs(box!.x+box!.width/2-viewport.width/2)).toBeLessThan(2);
  expect(Math.abs(box!.y+box!.height/2-viewport.height/2)).toBeLessThan(2);
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(button).toBeFocused();
 await page.screenshot({path:'artifacts/compact-classes.png',fullPage:true});
});

test('materials drills into grade, chapter and lesson and keeps navigation on reload',async({page})=>{
 await page.goto('/materials');await expect(page.locator('.folder-card')).toHaveCount(5);await expect(page.locator('.folder-lesson')).toHaveCount(0);
 await page.screenshot({path:'artifacts/material-folders-desktop.png',fullPage:true});
 await page.getByRole('link',{name:/Lớp 8/}).click();await expect(page).toHaveURL(/grade=8/);await expect(page.locator('.folder-lesson')).toHaveCount(0);
 await page.locator('.folder-card').first().click();const chapterUrl=page.url();await page.reload();await expect(page.locator('.folder-lesson').first()).toBeVisible();
 await page.locator('.folder-lesson').first().getByRole('button').click();await page.getByRole('link',{name:/^Đã lưu/}).click();await expect(page.locator('.folder-lesson')).toHaveCount(1);
 await page.goto(chapterUrl);await page.locator('.folder-lesson').first().getByRole('link').first().click();await expect(page.locator('.reader-page')).toBeVisible();await page.getByRole('link',{name:'Về chương học'}).click();await expect(page).toHaveURL(chapterUrl);
 await page.getByRole('link',{name:'Từ điển',exact:true}).first().click();await expect(page.locator('.folder-card')).toHaveCount(3);await expect(page.locator('.atlas-card')).toHaveCount(0);
 await page.getByRole('link',{name:/Dụng cụ/}).click();await page.locator('.atlas-card').first().click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.goto('/materials');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('.account-mobile')).toContainText('Học sinh kiểm thử');await page.screenshot({path:'artifacts/material-folders-mobile.png',fullPage:true});
});
