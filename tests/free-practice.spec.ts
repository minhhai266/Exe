import { test,expect } from '@playwright/test';
import { summarize } from '../src/engine/timeSimulation';
import type { Vessel } from '../src/engine/equipment';
import type { ChemicalId } from '../src/engine/chemicals';
import { createEquipment } from '../src/engine/equipment';
import { labSession } from './lab-session';

for(const [id,product] of [['hydrogen','H2'],['precipitate','Cu(OH)2']]){
 test(`guest can run ${id} without submitting or creating a learning session`,async({page})=>{
  const learningCalls:string[]=[];
  page.on('request',req=>{if(req.url().includes('/api/learning/'))learningCalls.push(req.url())});
  await page.goto(`/practice/${id}?assignment=ignored`);
  await expect(page.locator('.bench-viewport canvas')).toBeVisible();
  await expect(page.getByRole('button',{name:'Nộp bài',exact:true})).toHaveCount(0);
  await expect(page.locator('.lab-timer,.lab-readiness')).toHaveCount(0);
  await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();
  const prepared=await page.evaluate(id=>JSON.parse(localStorage.getItem('virtual-lab-practice-v1')||'{}').state?.draftLabs['practice:'+id]?.vessels,id);
  const source=prepared?.find((v:Vessel)=>v.type==='flask'||v.type==='beaker');
  await page.getByRole('button',{name:id==='neutralization'?'Thêm HCl & chạy':'Bắt đầu phản ứng',exact:true}).click();
  const saved=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('virtual-lab-practice-v1')||'{}').state?.draftLabs['practice:'+id],id);
  await expect.poll(async()=>{
   const draft=await saved();
   return draft?summarize(draft.vessels as Vessel[]).contents[product as ChemicalId]||0:0;
  }).toBeGreaterThan(0);
  await page.locator('.lab-actions-menu>summary').click();
  await expect(page.getByRole('button',{name:'Mục tiêu',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Ghi chép',exact:true})).toHaveCount(0);
  await page.keyboard.press('Escape');
  const count=(await saved()).vessels.length;
  await page.reload();
  await expect(page.locator('.bench-viewport canvas')).toBeVisible();
  expect((await saved()).vessels.length).toBe(count);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')||'{}').state?.attempts||[])).toEqual([]);
  expect(learningCalls).toEqual([]);
  if(id==='precipitate')await page.screenshot({path:'artifacts/free-practice-desktop.png'});
 });
}

test('landing and public library open guest practice; mobile keeps apparatus controls',async({page})=>{
 await page.goto('/');
 await page.locator('.experiment-card[href="/practice/neutralization"]').click();
 await expect(page).toHaveURL(/\/practice\/neutralization$/);
 await expect(page.locator('.bench-viewport canvas')).toBeVisible();
 await page.getByRole('link',{name:'Thí nghiệm tự do',exact:true}).click();
 await expect(page).toHaveURL('/practice');
 await expect(page.locator('.experiment-card')).toHaveCount(14);
 await page.setViewportSize({width:390,height:844});
 await page.locator('.experiment-card[href="/practice/precipitate"]').click();
 await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();
 await page.getByRole('button',{name:'Hóa chất & dụng cụ',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Hóa chất và dụng cụ',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'artifacts/free-practice-mobile.png'});
});

test('guest practice does not open custom drafts or change classroom access',async({page})=>{
 await page.goto('/practice/private-draft');
 await expect(page.locator('.bench-viewport canvas')).toHaveCount(0);
 await page.goto('/lab/hydrogen');
 await expect(page).toHaveURL(/\/login$/);
});

test('public practice stays isolated from an existing signed-in account draft',async({page})=>{
 await labSession(page);
 const privateDraft={vessels:[createEquipment('beaker','private-beaker',300,425)],logs:[],notes:'Private classroom notes',hints:1,seconds:12,equation:false};
 await page.addInitScript(draft=>{
  if(!sessionStorage.getItem('isolation-seeded')){
   localStorage.setItem('virtual-lab-v1',JSON.stringify({state:{role:'student',templates:[],attempts:[],draftLabs:{'lab-tester:precipitate':draft}},version:0}));
   sessionStorage.setItem('isolation-seeded','1');
  }
 },privateDraft);
 await page.goto('/practice/precipitate');
 const before=await page.evaluate(()=>localStorage.getItem('virtual-lab-v1'));
 await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-practice-v1')||'{}').state?.draftLabs['practice:precipitate']?.vessels.length||0)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>localStorage.getItem('virtual-lab-v1'))).toBe(before);
 await page.goto('/ebooks/sgk-khtn-8');
 await page.getByRole('link',{name:'Quay lại danh sách tài liệu'}).click();
 await expect(page).toHaveURL('/ebooks?grade=8');
 expect(await page.evaluate(()=>localStorage.getItem('virtual-lab-v1'))).toBe(before);
 await page.goto('/lab/precipitate');
 await expect(page.getByRole('button',{name:'Nộp bài',exact:true})).toBeVisible();
 await expect(page.locator('.bench-viewport canvas')).toBeVisible();
 const accountDraft=await page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')||'{}').state.draftLabs['lab-tester:precipitate']);
 expect(accountDraft.notes).toBe(privateDraft.notes);
 expect(accountDraft.vessels.map((v:Vessel)=>v.id)).toEqual(['private-beaker']);
});
