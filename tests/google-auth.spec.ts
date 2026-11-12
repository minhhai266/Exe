import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.route('https://accounts.google.com/gsi/client*',route=>route.fulfill({contentType:'text/javascript',body:`
  window.google={accounts:{id:{
   initialize(options){window.testGoogleOptions=options},
   renderButton(element){const button=document.createElement('button');button.type='button';button.textContent='Đăng nhập bằng Google';button.style.cssText='width:100%;height:40px;border:1px solid #dadce0;border-radius:4px;background:white';button.onclick=()=>window.testGoogleOptions.callback({credential:'test.signed.token'});element.appendChild(button)}
  }}};
 `}));
 await page.route('**/api/admin/auth/google/prepare',route=>route.fulfill({json:{clientId:'test.apps.googleusercontent.com',nonce:'test-nonce'}}));
});

test('Google sign-in returns to the protected destination and survives reload',async({page})=>{
 await page.route('**/api/admin/auth/google',async route=>{
  expect(route.request().postDataJSON()).toEqual({credential:'test.signed.token'});
  await route.fulfill({json:{user:{id:'google-user',name:'Nguyễn Minh Anh',email:'test@gmail.com',role:'STUDENT'}}});
 });
 await page.goto('/student/classes');await expect(page).toHaveURL(/login/);
 await page.getByRole('button',{name:'Đăng nhập bằng Google',exact:true}).click();
 await expect(page).toHaveURL(/student\/classes/);
 await page.reload();await expect(page.locator('.account-card')).toContainText('Nguyễn Minh Anh');
});

test('Google registration uses the selected role and fits desktop and mobile',async({page})=>{
 const roles:string[]=[];
 await page.route('**/api/admin/auth/google/prepare',async route=>{roles.push(route.request().postDataJSON().role);await route.fulfill({json:{clientId:'test.apps.googleusercontent.com',nonce:'test-nonce'}})});
 await page.route('**/api/admin/auth/google',route=>route.fulfill({json:{user:{id:'google-teacher',name:'Giáo viên tiếng Việt',email:'teacher@gmail.com',role:'TEACHER'}}}));
 await page.goto('/register');
 await page.getByRole('button',{name:'Đăng nhập bằng Google',exact:true}).waitFor();
 await page.getByRole('button',{name:'Giáo viên',exact:true}).click();
 await expect.poll(()=>roles.at(-1)).toBe('teacher');
 await page.getByRole('button',{name:'Đăng nhập bằng Google',exact:true}).waitFor();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`artifacts/google-register-${width}.png`,fullPage:true});
 }
 await page.getByRole('button',{name:'Đăng nhập bằng Google',exact:true}).click();
 await expect(page).toHaveURL(/teacher\/dashboard/);
});

test('Google failures are shown and retry obtains a fresh challenge',async({page})=>{
 let tries=0;
 await page.route('**/api/admin/auth/google',async route=>{tries++;await route.fulfill(tries===1?{status:401,json:{error:{message:'Không xác minh được tài khoản Google.'}}}:{json:{user:{id:'google-retry',name:'Học sinh',email:'retry@gmail.com',role:'STUDENT'}}})});
 await page.goto('/login');await page.getByRole('button',{name:'Đăng nhập bằng Google',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Không xác minh được');
 await expect(page.getByRole('button',{name:'Đăng nhập',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Thử lại đăng nhập Google'}).click();
 await page.getByRole('button',{name:'Đăng nhập bằng Google',exact:true}).click();await expect(page).toHaveURL(/student\/dashboard/);
});

test('missing Google configuration keeps password login available',async({page})=>{
 await page.route('**/api/admin/auth/google/prepare',route=>route.fulfill({status:503,json:{error:{message:'Đăng nhập Google hiện chưa khả dụng. Vui lòng dùng email và mật khẩu.'}}}));
 await page.goto('/login');await expect(page.getByRole('button',{name:'Đăng nhập bằng Google'})).toBeDisabled();
 await expect(page.getByRole('status')).toContainText('chưa khả dụng');
 await expect(page.getByRole('button',{name:'Đăng nhập',exact:true})).toBeEnabled();
 await page.screenshot({path:'artifacts/google-login-unavailable.png',fullPage:true});
});
