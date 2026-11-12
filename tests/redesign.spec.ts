import {test,expect} from '@playwright/test';

test('scientific homepage responds at all requested widths',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [375,390,768,1024,1440,1920]){
  await page.setViewportSize({width,height:1000});await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Tự tay thí nghiệm');
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const cards=page.locator('.experiment-card');await expect(cards).toHaveCount(4);
  const columns=width>=1440?4:width>=768?2:1;
  expect(await page.locator('.experiment-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(columns);
  await cards.first().scrollIntoViewIfNeeded();await expect(cards.first()).toBeVisible();
  const sizes=await cards.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));
  expect(Math.max(...sizes)-Math.min(...sizes)).toBeLessThan(2);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`artifacts/redesign-${width}.png`,fullPage:true});
 }
 expect(errors).toEqual([]);
});

test('preview, feature selector, mobile menu and materials links work',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Quan sát bọt khí'}).click();
 await expect(page.getByRole('button',{name:'Dừng chuyển động'})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.preview-explanation')).toContainText('giải phóng khí hiđro');
 await page.getByRole('button',{name:'Thử sai, học thật'}).click();
 await expect(page.locator('#discovery-panel')).toContainText('không làm tăng lượng O₂ tối đa');
 await page.getByRole('button',{name:'Lưu lại khám phá'}).click();
 await expect(page.locator('.journal-preview')).toContainText('lần thực hành đầu tiên');
 await page.locator('.home-book').first().click();await expect(page).toHaveURL(/materials\?grade=8/);
 await page.goto('/');await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Mở menu'}).click();
 await expect(page.locator('#public-mobile-menu')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.locator('#public-mobile-menu')).toBeHidden();
 await page.getByRole('button',{name:'Mở menu'}).click();
 await page.locator('#public-mobile-menu').getByRole('link',{name:'Thư viện thí nghiệm'}).click();
 await expect(page).toHaveURL(/\/#experiments$/);await expect(page.locator('#public-mobile-menu')).toBeHidden();
 await page.goto('/experiments');await expect(page.locator('.experiment-card')).toHaveCount(4);
 await page.getByLabel('Tìm thí nghiệm').fill('kết tủa');await expect(page.locator('.experiment-card')).toHaveCount(1);
});

test('library combines real filters and resets empty results',async({page})=>{
 await page.goto('/experiments');await page.locator('.compact-filters summary').click();
 await page.getByLabel('Lọc theo độ khó').selectOption('Trung bình');
 await expect(page.locator('.experiment-card')).toHaveCount(2);
 await page.getByLabel('Lọc theo thời lượng').selectOption('short');
 await expect(page.locator('.experiment-card')).toHaveCount(0);
 await page.getByRole('button',{name:'Xóa bộ lọc'}).click();
 await expect(page.locator('.experiment-card')).toHaveCount(4);
 await page.getByLabel('Tìm thí nghiệm').fill('ket tua');
 await expect(page.locator('.experiment-card')).toHaveCount(1);
});
