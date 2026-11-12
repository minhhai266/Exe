import {test,expect} from '@playwright/test';

test('fourteen document activities retain ordering and filters survive refresh',async({page})=>{
 await page.goto('/');
 await page.getByRole('link',{name:'Xem tất cả thí nghiệm',exact:true}).click();
 await expect(page).toHaveURL('/practice');
 await expect(page.locator('.experiment-card')).toHaveCount(14);
 await expect(page.locator('.experiment-card').nth(0)).toHaveAttribute('href','/practice/hydrogen');
 await expect(page.locator('.experiment-card').nth(1)).toHaveAttribute('href','/practice/precipitate');
 await expect(page.locator('.visual-number')).toHaveText(Array.from({length:14},(_,i)=>String(i+1).padStart(2,'0')));
 await page.getByLabel('Khối lớp',{exact:true}).selectOption('11');
 await expect(page.locator('.experiment-card')).toHaveCount(1);
 await page.getByLabel('Chủ đề',{exact:true}).selectOption('Hữu cơ');
 await page.reload();
 await expect(page.getByLabel('Khối lớp',{exact:true})).toHaveValue('11');
 await expect(page.locator('.experiment-card')).toHaveCount(1);
 await expect(page.locator('.visual-number')).toHaveText('12');
 await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
 await expect(page.locator('.experiment-card')).toHaveCount(14);
 await page.getByLabel('Tìm thí nghiệm',{exact:true}).fill('kem');
 await expect(page.locator('.experiment-card')).toHaveCount(1);
 await page.getByLabel('Thời lượng',{exact:true}).selectOption('short');
 await expect(page.locator('.experiment-card')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Chưa tìm thấy thí nghiệm phù hợp'})).toBeVisible();
 await page.locator('.empty').getByRole('button',{name:'Xóa bộ lọc'}).click();
 await expect(page.locator('.experiment-card')).toHaveCount(14);
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:`artifacts/practice-library-${width}.png`,fullPage:true});
 }
 await page.locator('.experiment-card[href="/practice/esterification"]').click();
 await expect(page.getByRole('heading',{name:'Tạo este có mùi thơm'})).toBeVisible();
});