import {test,expect} from '@playwright/test';

test('home opens the full document library with combined filters and inline PDF reading',async({page})=>{
 await page.goto('/');
 await page.getByRole('link',{name:'Tất cả học liệu',exact:true}).click();
 await expect(page).toHaveURL('/ebooks');
 await expect(page.getByRole('heading',{name:'Sách và tài liệu cho từng bước học.'})).toBeVisible();
 await page.getByLabel('Định dạng tài liệu',{exact:true}).selectOption('pdf');
 await expect(page.locator('.document-card')).toHaveCount(11);
 await page.getByLabel('Loại tài liệu',{exact:true}).selectOption('Sách giáo khoa');
 await expect(page.locator('.document-card')).toHaveCount(5);
 await page.getByLabel('Lọc khối lớp E-book',{exact:true}).selectOption('12');
 await expect(page.locator('.document-card')).toHaveCount(1);
 await page.getByLabel('Tìm E-book',{exact:true}).fill('hoa hoc');
 await expect(page.locator('.document-card')).toHaveCount(1);
 await page.reload();
 await expect(page.getByLabel('Loại tài liệu',{exact:true})).toHaveValue('Sách giáo khoa');
 const filteredUrl=page.url();
 await page.locator('.document-card[href="/ebooks/sgk-hoa-12"]').click();
 await expect(page.locator('iframe.book-pdf')).toBeVisible();
 await page.getByRole('link',{name:'Quay lại danh sách tài liệu'}).click();
 await expect(page).toHaveURL(filteredUrl);
 await expect(page.locator('.document-card')).toHaveCount(1);
 await page.getByLabel('Tìm E-book',{exact:true}).fill('khongco123456');
 await expect(page.getByRole('heading',{name:'Chưa tìm thấy tài liệu phù hợp'})).toBeVisible();
 await page.locator('.empty').getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
 await expect(page.getByLabel('Tìm E-book',{exact:true})).toHaveValue('');
 await page.getByLabel('Định dạng tài liệu',{exact:true}).selectOption('pdf');
 await expect(page.locator('.document-card')).toHaveCount(11);
 await page.getByLabel('Loại tài liệu',{exact:true}).selectOption('Ôn tập giữa kỳ II');
 await expect(page.locator('.document-card')).toHaveCount(3);
 await page.getByLabel('Loại tài liệu',{exact:true}).selectOption('Ôn tập cuối kỳ II');
 await expect(page.locator('.document-card')).toHaveCount(3);
 await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
 await expect(page.getByLabel('Loại tài liệu',{exact:true})).toHaveValue('');
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:`artifacts/document-library-${width}.png`});
 }
});
