import {test,expect,type Page} from '@playwright/test';
import {labSession} from './lab-session';
import {createEquipment,type Vessel} from '../src/engine/equipment';

async function fixture(page:Page){
 await labSession(page);
 const stand=createEquipment('stand','stand',240,440),flask=createEquipment('flask','flask',285,365),stopper=createEquipment('stopper','stopper',500,430),jar=createEquipment('gasJar','jar',760,260);
 flask.mountedOn=stand.id;flask.volume=100;flask.contents={CuSO4:.01};jar.rotation=180;jar.prepared=true;jar.volume=250;
 const items=[stand,flask,stopper,jar];
 await page.addInitScript(items=>localStorage.setItem('virtual-lab-v1',JSON.stringify({state:{templates:[],attempts:[],draftLabs:{'lab-tester:hydrogen':{vessels:items,logs:[],notes:'',hints:0,equation:false,seconds:0,stockUsed:{},answers:{}}}},version:0})),items);
 await page.goto('/lab/hydrogen');await expect(page.locator('.bench-viewport canvas')).toBeVisible();await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 return items;
}
async function model(page:Page):Promise<Vessel[]>{return page.evaluate(()=>JSON.parse(localStorage.getItem('virtual-lab-v1')!).state.draftLabs['lab-tester:hydrogen'].vessels)}
async function pixel(page:Page,x:number,y:number,zoom=1,panX=0){
 return page.locator('.bench-viewport canvas').evaluate((node,{x,y,zoom,panX})=>{const canvas=node as HTMLCanvasElement,b=canvas.getBoundingClientRect(),base=Math.min(b.width/1000,b.height/485),scale=base*zoom,ratio=canvas.width/b.width;return Array.from(canvas.getContext('2d')!.getImageData(Math.round(((b.width-1000*base)/2+panX+x*scale)*ratio),Math.round(((b.height-485*base)/2-55*base+y*scale)*ratio),1,1).data).slice(0,3)},{x,y,zoom,panX});
}
test('wall, tabletop and front edge remain distinct through camera zoom and pan',async({page})=>{
 const before=await fixture(page);
 expect(await pixel(page,61,201)).toEqual([255,255,255]);
 expect(await pixel(page,61,470)).toEqual([231,228,219]);
 expect(await pixel(page,61,502)).toEqual([200,194,181]);
 await page.locator('.bench-viewport').screenshot({path:'artifacts/workbench-depth-desktop.png'});
 // A mounted Canvas must pick up the current CSS wall color instead of its initial cached palette.
 await page.evaluate(()=>document.documentElement.style.setProperty('--lab-wall','#F6F8F4'));
 await page.getByRole('button',{name:'Phóng to bàn',exact:true}).click();
 expect(await pixel(page,61,201,1.2)).toEqual([246,248,244]);
 await page.evaluate(()=>document.documentElement.style.setProperty('--lab-wall','#FFFFFF'));
 await page.getByRole('button',{name:'Dịch phải',exact:true}).click();
 expect(await pixel(page,61,201,1.2,-50)).toEqual([255,255,255]);
 expect(await pixel(page,61,470,1.2,-50)).toEqual([231,228,219]);
 expect(await pixel(page,61,502,1.2,-50)).toEqual([200,194,181]);
 expect((await model(page)).map(v=>[v.id,v.x,v.y,v.rotation])).toEqual(before.map(v=>[v.id,v.x,v.y,v.rotation]));
 await page.locator('.bench-viewport').screenshot({path:'artifacts/workbench-depth-zoomed.png'});
});
test('hover and soft selection do not obstruct moving the stand or the attached flask',async({page})=>{
 const items=await fixture(page),canvas=page.locator('.bench-viewport canvas'),b=(await canvas.boundingBox())!,s=Math.min(b.width/1000,b.height/485),ox=b.x+(b.width-1000*s)/2,oy=b.y+(b.height-485*s)/2-55*s;
 await page.mouse.move(ox+240*s,oy+435*s);await expect(page.locator('.konvajs-content')).toHaveCSS('cursor','grab');
 await page.mouse.down();await page.mouse.move(ox+320*s,oy+435*s,{steps:12});await page.mouse.up();
 await expect.poll(async()=>(await model(page)).find(v=>v.id==='stand')!.x).toBeCloseTo(320,0);
 const after=await model(page);expect(after.find(v=>v.id==='flask')!.x).toBeCloseTo(items[1].x+80,0);expect(after.find(v=>v.id==='flask')!.contents).toEqual(items[1].contents);
 await page.locator('.bench-viewport').screenshot({path:'artifacts/workbench-depth-selected.png'});
});
