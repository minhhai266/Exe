import {test,expect,type Locator} from '@playwright/test';
import {labSession} from './lab-session';
import {mixtureAppearance} from '../src/engine/appearance';
const sizes=[{width:1440,height:1000},{width:768,height:1024},{width:390,height:844}];
const background='rgb(250, 252, 250)',surface='rgb(255, 255, 255)',primary='rgb(30, 128, 105)',focus='rgb(24, 116, 95)';
async function contrastOf(locator:Locator){return locator.evaluate(node=>{
 const styles=getComputedStyle(node),luminance=(value:string)=>{const rgb=value.match(/[\d.]+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb.reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0)};
 const a=luminance(styles.color),b=luminance(styles.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
})}

test('public pages use warm surfaces, green actions and accessible focus across screen sizes',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const size of sizes){
  await page.setViewportSize(size);
  for(const [name,path] of [['home','/'],['pricing','/pricing'],['login','/login']]){
   await page.goto(path);await expect(page.locator('body')).toHaveCSS('background-color',background);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path} at ${size.width}`).toBe(true);
   const action=page.locator('.btn.primary:visible:not(:disabled)').first();await expect(action).toHaveCSS('background-color',primary);
   expect(await contrastOf(action)).toBeGreaterThanOrEqual(4.5);
   await action.hover();await expect(action).toHaveCSS('background-color','rgb(24, 116, 95)');await expect(action).toHaveCSS('color','rgb(255, 255, 255)');expect(await contrastOf(action)).toBeGreaterThanOrEqual(4.5);
   await page.mouse.move(0,0);await expect(action).toHaveCSS('background-color',primary);
   if(name==='login'){
    const input=page.getByLabel('Email',{exact:true});await input.focus();await expect(input).toHaveCSS('outline-color',focus);await expect(page.locator('.auth-card')).toHaveCSS('background-color',surface);
   }
   await page.screenshot({path:`artifacts/botanical-${name}-${size.width}.png`,fullPage:name!=='home'});
  }
 }
 expect(errors).toEqual([]);
});

test('learning pages and neutral laboratory remain responsive without tinting chemical swatches',async({page})=>{
 await labSession(page);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const size of sizes){
  await page.setViewportSize(size);
  for(const [name,path] of [['student','/student/dashboard'],['library','/experiments'],['materials','/materials'],['lab','/lab/precipitate?new=1']]){
   await page.goto(path);await expect(page.locator('main')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path} at ${size.width}`).toBe(true);
   if(name==='lab'){
    await page.getByRole('button',{name:'Chuẩn bị nhanh',exact:true}).click();await expect(page.locator('.bench-viewport canvas')).toBeVisible();
    await expect(page.locator('.bench-viewport')).toHaveCSS('background-color','rgb(255, 255, 255)');
    await expect(page.getByRole('button',{name:'Bắt đầu phản ứng',exact:true})).toBeEnabled();
    await expect(page.getByRole('button',{name:'Bắt đầu phản ứng',exact:true})).toHaveCSS('background-color',primary);
    await expect(page.getByRole('button',{name:'Bắt đầu phản ứng',exact:true})).toHaveCSS('color','rgb(255, 255, 255)');
    expect(await contrastOf(page.getByRole('button',{name:'Bắt đầu phản ứng',exact:true}))).toBeGreaterThanOrEqual(4.5);
    if(size.width===1440){
     const expected=mixtureAppearance({CuSO4:.01},10).tags.find(tag=>tag.id==='liquid')!.color;
     const swatch=page.locator('.appearance-tag').filter({hasText:'Dung dịch xanh lam'}).locator('i');
     await expect(swatch).toBeVisible();
     const actual=await swatch.evaluate(node=>getComputedStyle(node).backgroundColor);
     expect(actual).not.toBe(primary);expect(actual).not.toBe(background);
     const expectedStyle=await page.evaluate(color=>{const node=document.createElement('i');node.style.background=color||'';return node.style.background},expected);
     expect(actual).toBe(expectedStyle);
    }
   }else if(size.width===1440){await expect(page.locator('.workspace-sidebar')).toHaveCSS('background-color',surface)}
   await page.screenshot({path:`artifacts/botanical-${name}-${size.width}.png`});
  }
 }
 expect(errors).toEqual([]);
});

test('teacher tools and lazy admin styling retain the botanical tokens',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('virtual-lab-session',JSON.stringify({id:'theme-teacher',name:'Giáo viên',email:'theme@example.test',role:'teacher'})));
 for(const size of sizes){
  await page.setViewportSize(size);
  for(const [name,path] of [['teacher','/teacher/dashboard'],['builder','/teacher/experiments/new'],['reports','/teacher/reports'],['studio','/teacher/reaction-studio'],['admin','/admin/login']]){
   await page.goto(path);await expect(page.locator('body')).toHaveCSS('background-color',background);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path} at ${size.width}`).toBe(true);
   if(name==='studio')await expect(page.getByRole('heading',{name:'Kết nối tài khoản giáo viên'})).toBeVisible();
   if(name==='admin'){
    const action=page.locator('.admin-button.primary:visible').first();await expect(action).toHaveCSS('background-color',primary);await expect(action).toHaveCSS('color','rgb(255, 255, 255)');expect(await contrastOf(action)).toBeGreaterThanOrEqual(4.5);
   }
   await page.screenshot({path:`artifacts/botanical-${name}-${size.width}.png`,fullPage:true});
  }
 }
});
