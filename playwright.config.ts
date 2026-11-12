import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:60000,workers:1,use:{baseURL:'http://127.0.0.1:5174',headless:true,channel:'chrome',viewport:{width:1440,height:1000}},webServer:{command:'npm.cmd run dev -- --port 5174',url:'http://127.0.0.1:5174',reuseExistingServer:true},reporter:'list'});
