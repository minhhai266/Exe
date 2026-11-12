import { test, expect } from '@playwright/test';

test('class folders expose all 11 PDFs and open an inline reader without downloads', async ({ page, request }) => {
 const downloads: string[] = [];
 page.on('download', file => downloads.push(file.suggestedFilename()));
 for (const [grade, count] of [[8,1],[9,1],[10,3],[11,3],[12,3]]) {
  await page.goto('/materials?grade=' + grade);
  await expect(page.locator('.ebook-card')).toHaveCount(0);
  await page.locator(`a.folder-card[href="/materials?grade=${grade}&section=sgk"]`).click();
  await expect(page.locator('.ebook-card')).toHaveCount(1);
  const links = await page.locator('.ebook-card').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!));
  await page.goto('/materials?grade=' + grade);
  await page.locator(`a.folder-card[href="/materials?grade=${grade}&section=review"]`).click();
  await expect(page.locator('.ebook-card')).toHaveCount(count - 1);
  links.push(...await page.locator('.ebook-card').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!)));
  for (const href of links) {
   await page.goto(href);
   const reader = page.locator('iframe.book-pdf');
   await expect(reader).toBeVisible();
   const src = (await reader.getAttribute('src'))!.split('#')[0];
   const response = await request.get(src, { headers: { Range: 'bytes=0-15' } });
   expect(response.ok()).toBeTruthy();
   expect(response.headers()['content-type']).toContain('application/pdf');
   expect(response.headers()['content-disposition'] || '').not.toContain('attachment');
   expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
  }
 }
 expect(downloads).toEqual([]);
 await page.setViewportSize({width:390,height:844});
 await page.goto('/materials?grade=12&section=review');
 await expect(page.locator('.ebook-card')).toHaveCount(2);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
 await page.screenshot({path:'artifacts/ebooks-mobile.png',fullPage:true});
});

test('home shelf switches classes and opens the selected book', async ({page}) => {
 await page.goto('/');
 const shelf = page.locator('.ebook-shelf');
 await shelf.locator('.ebook-grade-tabs button').filter({hasText:'12'}).click();
 await expect(shelf.locator('.ebook-card')).toHaveCount(3);
 await shelf.locator('a[href="/ebooks/sgk-hoa-12"]').click();
 await expect(page).toHaveURL(/\/ebooks\/sgk-hoa-12$/);
 await expect(page.locator('iframe.book-pdf')).toBeVisible();
 await page.screenshot({path:'artifacts/ebook-reader.png'});
 await page.goto('/ebooks');
 await page.getByLabel('Lọc khối lớp E-book').selectOption('10');
 await expect(page.locator('.book-card[href="/ebooks/sgk-hoa-10"]')).toHaveCount(1);
 await expect(page.locator('.book-card[href="/ebooks/on-giua-ky-2-10"]')).toHaveCount(1);
 await expect(page.locator('.book-card[href="/ebooks/on-cuoi-ky-2-10"]')).toHaveCount(1);
});
