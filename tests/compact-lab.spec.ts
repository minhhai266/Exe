import {test,expect} from '@playwright/test';
import {labSession} from "./lab-session";
test.beforeEach(async({page})=>labSession(page));

test('desktop lab fits the viewport with independently scrolling panels',async({page})=>{
 for(const viewport of [{width:1366,height:768},{width:1024,height:768}]){
  await page.setViewportSize(viewport);
  await page.goto('/lab/precipitate');
  await page.getByRole('button',{name:'Thực hành nhanh',exact:true}).click();
  if(viewport.width<=1100){await expect(page.locator('.properties')).toBeHidden();await page.getByRole('button',{name:'Thông tin / Quan sát'}).click();await expect(page.getByRole('dialog',{name:'Thông tin và quan sát'})).toBeVisible();await page.keyboard.press('Escape')}else await expect(page.locator('.properties')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const toolbar=await page.locator('.assembly-toolbar').boundingBox();
  expect(toolbar!.y+toolbar!.height).toBeLessThanOrEqual(viewport.height);
 }
 await page.screenshot({path:'artifacts/lab-compact-desktop.png'});
});

test('mobile inventory opens as a drawer and returns to the table after adding a chemical',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/lab/precipitate');
 await page.getByRole('button',{name:'Thực hành nhanh',exact:true}).click();
 await expect(page.locator('.inventory')).toBeHidden();
 await expect(page.locator('.properties')).toBeHidden();
 await page.getByRole('button',{name:'Hóa chất & dụng cụ',exact:true}).click();
 const drawer=page.getByRole('dialog',{name:'Hóa chất và dụng cụ'});
 await expect(drawer).toBeVisible();
 await page.screenshot({path:'artifacts/lab-compact-mobile-drawer.png'});
 await drawer.locator('.inventory-item').first().click();
 await expect(drawer).toBeHidden();
 await page.getByRole('button',{name:'Thông tin / Quan sát'}).click();
 await expect(page.getByRole('dialog',{name:'Thông tin và quan sát'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('.properties')).toBeHidden();
 await expect(page.getByRole('button',{name:'Thông tin / Quan sát'})).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/lab-compact-mobile.png'});
});
