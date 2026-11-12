import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/styles/tokens.css',import.meta.url),'utf8');
const tokens=Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})\s*;/gi)].map(m=>[m[1],m[2]]));
const luminance=value=>{let hex=value.slice(1);if(hex.length===3)hex=hex.split('').map(x=>x+x).join('');return [.2126,.7152,.0722].reduce((total,weight,i)=>{const v=parseInt(hex.slice(i*2,i*2+2),16)/255;return total+weight*(v<=.04045?v/12.92:((v+.055)/1.055)**2.4)},0)};
const pairs=[['text-primary','bg-surface'],['text-secondary','bg-app'],['text-muted-accessible','bg-surface'],['text-on-brand','button-accessible'],['text-on-brand-hover','brand-primary-hover'],['text-on-solid','button-accessible'],['text-on-solid','button-accessible-hover'],['text-link','bg-app'],['text-link','bg-selected'],['text-secondary','bg-selected'],['accent-orange-ink','accent-orange'],['text-primary','accent-orange-soft'],['info-text','info-bg'],['success-text','success-bg'],['warning-text','warning-bg'],['error-text','error-bg'],['ai-text','ai-bg'],['brand-teal','brand-teal-light'],...[8,9,10,11,12].map(n=>['grade-'+n,'grade-'+n+'-bg'])];
const results=pairs.map(([text,background])=>{const a=luminance(tokens[text]),b=luminance(tokens[background]),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);return {text,background,ratio:Number(ratio.toFixed(2)),pass:ratio>=4.5}});
fs.writeFileSync(new URL('../artifacts/color-contrast.json',import.meta.url),JSON.stringify(results,null,2));
for(const row of results)console.log(`${row.pass?'PASS':'FAIL'} ${row.text} / ${row.background}: ${row.ratio}:1`);
if(results.some(r=>!r.pass))process.exitCode=1;
