import {test,expect,type Page} from '@playwright/test';
import {documentLabExperiments} from '../src/features/experiments/labActivities';
import type {Vessel} from '../src/engine/equipment';
const saved=(page:Page,id:string):Promise<Vessel[]>=>page.evaluate(id=>JSON.parse(localStorage.getItem('virtual-lab-practice-v1')||'{}').state?.draftLabs['practice:'+id]?.vessels||[],id);
async function tool(page:Page,name:string){await page.locator('.lab-actions-menu>summary').click();await page.getByRole('button',{name,exact:true}).click()}

for(const experiment of documentLabExperiments){
 test(`shared workbench ${experiment.id}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/practice/'+experiment.id);
  await expect(page.locator('.bench-viewport canvas')).toBeVisible();
  await expect(page.locator('.document-lab')).toHaveCount(0);
  await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();
  await page.getByLabel('Tốc độ mô phỏng',{exact:true}).selectOption('2');
  if(experiment.id==='acid-base-identification'){
   await page.locator('.quick-actions').getByRole('button',{name:'Thử quỳ tím',exact:true}).click();
   await expect(page.locator('.observations')).toContainText('đỏ');
   const base=(await saved(page,experiment.id)).find(v=>v.contents.NaOH)!;
   await page.getByLabel('Chọn dụng cụ trên bàn',{exact:true}).selectOption(base.id);
   await page.locator('.properties').getByRole('button',{name:'Thử quỳ tím',exact:true}).click();
   await expect(page.locator('.observations')).toContainText('xanh');
  }else{
   if(['H2','O2','CO2'].includes(experiment.product)||experiment.id==='carbon-dioxide-test'){
    await page.getByRole('button',{name:/Cổng RA · (Bình tam giác|Ống nghiệm)/}).first().click();
    await page.getByRole('button',{name:experiment.id==='carbon-dioxide-test'?/Cổng VÀO · Cốc thủy tinh/:/Cổng VÀO · Bình thu khí/}).click();
   }
   if(experiment.customReaction?.minTemperature)await tool(page,'Đun nóng');
   if(experiment.customReaction?.requiresStirring)await tool(page,'Khuấy');
   const start=page.locator('.quick-actions button.primary');
   await expect(start).toBeEnabled({timeout:40000});
   await start.click();
   await expect.poll(async()=>{
    const items=await saved(page,experiment.id);
    return items.reduce((n,v)=>n+(v.produced?.[experiment.product]||0),0);
   },{timeout:20000}).toBeGreaterThan(1e-9);
   await expect.poll(async()=> (await saved(page,experiment.id)).some(v=>v.reaction?.status==='running'),{timeout:25000}).toBe(false);
   if(experiment.id==='carbon-dioxide-test'){
    const receiver=(await saved(page,experiment.id)).find(v=>v.type==='beaker')!;
    await page.getByLabel('Chọn dụng cụ trên bàn',{exact:true}).selectOption(receiver.id);
    await expect(page.locator('.appearance-legend')).toContainText('CaCO₃');
   }
  }
  if(await page.getByRole('button',{name:'Đóng thông báo',exact:true}).isVisible())await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();
  await page.screenshot({path:`artifacts/shared-${experiment.id}.png`});
  await page.reload();
  await expect(page.locator('.bench-viewport canvas')).toBeVisible();
  expect((await saved(page,experiment.id)).length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
 });
}

test('new workbench lessons keep mobile drawers and do not overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/practice/silver-mirror');
 await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();
 await page.getByRole('button',{name:'Hóa chất & dụng cụ',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Hóa chất và dụng cụ',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'artifacts/shared-mobile.png'});
});