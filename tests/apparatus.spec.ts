import {test,expect,type Page} from '@playwright/test';
import {labSession} from './lab-session';
import {createEquipment,type Vessel} from '../src/engine/equipment';

async function seed(page:Page,items:Vessel[],experiment='hydrogen'){
 await labSession(page);
 await page.addInitScript(({items,experiment})=>{
  localStorage.setItem('virtual-lab-v1',JSON.stringify({state:{templates:[],attempts:[],draftLabs:{['lab-tester:'+experiment]:{vessels:items,logs:[],notes:'',hints:0,equation:false,seconds:0,stockUsed:{},answers:{}}}},version:0}));
 },{items,experiment});
 await page.goto('/lab/'+experiment);await expect(page.locator('.bench-viewport canvas')).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function saved(page:Page,experiment='hydrogen'):Promise<Vessel[]>{return page.evaluate(key=>JSON.parse(localStorage.getItem('virtual-lab-v1')!).state.draftLabs['lab-tester:'+key].vessels,experiment)}
async function point(page:Page,x:number,y:number){const b=(await page.locator('.bench-viewport canvas').boundingBox())!;const s=Math.min(b.width/1000,b.height/485);return{x:b.x+(b.width-1000*s)/2+x*s,y:b.y+(b.height-485*s)/2+(y-55)*s}}
async function select(page:Page,v:Vessel){const p=await point(page,v.x,v.y-60);await page.mouse.click(p.x,p.y);await expect(page.locator('.selected-title h3')).toBeVisible()}

test('250 mL flask keeps rotation, stopper snap, state-driven reaction and gas collection',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const flask=createEquipment('flask','flask',340,425);flask.volume=60;flask.contents={Zn:.01,HCl:.02};
 const stopper=createEquipment('stopper','stopper',570,420);
 const jar=createEquipment('gasJar','jar',760,250);jar.rotation=180;jar.prepared=true;jar.volume=250;
 await seed(page,[flask,stopper,jar]);await select(page,flask);
 await page.getByLabel('Góc xoay',{exact:true}).fill('30');await page.getByLabel('Góc xoay',{exact:true}).press('Tab');
 await expect.poll(async()=>(await saved(page))[0].rotation).toBe(30);
 await page.getByRole('button',{name:'Phóng to dụng cụ',exact:true}).click();await expect(page.getByRole('dialog',{name:'Quan sát dụng cụ phóng to'})).toBeVisible();
 await page.locator('.observation-lens').screenshot({path:'artifacts/premium-flask-tilted.png'});await page.getByRole('button',{name:'Đóng kính quan sát'}).click();
 // Restore upright, then drag the real stopper onto the neck.
 await page.getByLabel('Góc xoay',{exact:true}).fill('0');await page.getByLabel('Góc xoay',{exact:true}).press('Tab');
 const current=(await saved(page))[0];const from=await point(page,stopper.x,stopper.y-10),to=await point(page,current.x,current.y-188);
 await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:15});await page.mouse.up();
 await expect.poll(async()=>(await saved(page)).find(v=>v.id==='stopper')?.mountedOn).toBe('flask');
 await select(page,(await saved(page))[0]);await page.getByLabel('Chọn dụng cụ đích').selectOption('jar');await page.getByRole('button',{name:'Nối cổng RA → VÀO',exact:true}).click();
 await expect.poll(async()=>(await saved(page))[0].connections).toEqual(['jar']);
 await page.getByRole('button',{name:'Trộn & quan sát',exact:true}).click();
 await expect.poll(async()=>((await saved(page)).find(v=>v.id==='jar')?.gasVolume||0),{timeout:15000}).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Phóng to dụng cụ',exact:true}).click();await page.locator('.observation-lens').screenshot({path:'artifacts/premium-flask-reacting.png'});await page.getByRole('button',{name:'Đóng kính quan sát'}).click();
 await page.screenshot({path:'artifacts/premium-gas-collection.png'});expect(errors).toEqual([]);
});

test('measured transfer and undo preserve chemical amounts with the new glass layers',async({page})=>{
 const a=createEquipment('beaker','a',280,425),b=createEquipment('flask','b',620,425);a.volume=10;a.contents={CuSO4:.01};
 await seed(page,[a,b],'precipitate');await select(page,a);await page.getByLabel('Chọn dụng cụ đích').selectOption('b');await page.getByLabel('Thể tích rót').fill('3');await page.getByRole('button',{name:'Rót dung dịch',exact:true}).click();
 await expect.poll(async()=>(await saved(page,'precipitate'))[0].volume).toBe(7);
 const after=await saved(page,'precipitate');expect(after[0].contents.CuSO4).toBeCloseTo(.007);expect(after[1].contents.CuSO4).toBeCloseTo(.003);
 await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();await expect.poll(async()=>(await saved(page,'precipitate'))[0].volume).toBe(10);
});

test('alcohol burner heats through the existing engine and stops on command',async({page})=>{
 const tripod=createEquipment('tripod','tripod',340,450),beaker=createEquipment('beaker','beaker',340,345),lamp=createEquipment('alcoholBurner','lamp',340,450);beaker.mountedOn=tripod.id;beaker.volume=50;beaker.contents={H2O:.05};
 await seed(page,[tripod,beaker,lamp],'oxygen');const p=await point(page,lamp.x,lamp.y-25);await page.mouse.click(p.x,p.y);await expect(page.locator('.selected-title h3')).toHaveText('Đèn cồn');
 await page.getByRole('button',{name:'Bật đèn',exact:true}).click();await expect(page.getByRole('button',{name:'Tắt đèn',exact:true})).toBeVisible();
 await expect.poll(async()=>((await saved(page,'oxygen')).find(v=>v.id==='beaker')?.temperature||25)).toBeGreaterThan(25.5);
 await page.screenshot({path:'artifacts/premium-alcohol-burner.png'});await page.getByRole('button',{name:'Tắt đèn',exact:true}).click();await expect.poll(async()=>(await saved(page,'oxygen')).find(v=>v.id==='lamp')?.burning).toBe(false);
});

test('glassware gallery remains usable with reduced motion and on a narrow screen',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 const types=['flask','beaker','tube','roundFlask','cylinder','gasJar'] as const;
 const items=types.map((type,i)=>{const v=createEquipment(type,type,100+i*155,425);v.volume=v.capacity*.45;v.contents={CuSO4:.003};return v});
 await seed(page,items);await page.screenshot({path:'artifacts/premium-glassware-desktop.png'});
 await select(page,items[0]);await page.getByRole('button',{name:'Phóng to dụng cụ',exact:true}).click();await page.locator('.observation-lens').screenshot({path:'artifacts/premium-flask-250ml.png'});await page.getByRole('button',{name:'Đóng kính quan sát'}).click();
 await page.setViewportSize({width:390,height:844});await expect(page.locator('.bench-viewport canvas')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'artifacts/premium-glassware-mobile.png'});
});

test('dropper animation follows a confirmed small addition without duplicating the dose',async({page})=>{
 const beaker=createEquipment('beaker','beaker',340,425),dropper=createEquipment('dropper','dropper',340,250);beaker.volume=20;beaker.contents={H2O:.02};
 await seed(page,[beaker,dropper]);await select(page,dropper);
 await page.getByRole('button',{name:'Dùng ống: thêm từng giọt',exact:true}).click();
 await page.locator('.inventory-item').filter({hasText:'Axit clohidric'}).click();
 await expect.poll(async()=>(await saved(page))[0].volume).toBeCloseTo(20.05);
 const items=await saved(page);expect(items[1].lastAddition?.chemical).toBe('HCl');expect(items[0].contents.HCl).toBeCloseTo(.00005);
});

test('shared SVG previews keep unique paint definitions across home diagrams',async({page})=>{
 await page.goto('/');await expect(page.locator('.hero .lab-art')).toBeVisible();
 const ids=await page.locator('svg defs [id]').evaluateAll(nodes=>nodes.map(node=>node.id));
 expect(ids.length).toBeGreaterThan(0);expect(new Set(ids).size).toBe(ids.length);
 await page.locator('.hero').screenshot({path:'artifacts/premium-home-preview.png'});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
