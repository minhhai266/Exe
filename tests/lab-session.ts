import type {Page} from '@playwright/test';
export async function labSession(page:Page){
 await page.addInitScript(()=>{
  if(!sessionStorage.getItem('virtual-lab-session'))sessionStorage.setItem('virtual-lab-session',JSON.stringify({id:'lab-tester',name:'Học sinh kiểm thử',email:'lab@example.com',role:'student'}));
  if(!localStorage.getItem('virtual-lab-access-v1'))localStorage.setItem('virtual-lab-access-v1',JSON.stringify({state:{entitlements:{'lab-tester':{expiresAt:'2099-01-01T00:00:00.000Z'}}},version:0}));
 });
}
