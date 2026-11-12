import { describe, expect, it } from 'vitest';
import { activityOutcome, documentActivities } from './documentActivities';
import { practiceExperiments } from './practiceCatalog';

const activity=(id:string)=>documentActivities.find(a=>a.id===id)!;
describe('document practice collection',()=>{
  it('keeps the original pair followed by the twelve document activities with stable codes',()=>{
    expect(practiceExperiments).toHaveLength(14);
    expect(practiceExperiments.slice(0,2).map(e=>e.id)).toEqual(['hydrogen','precipitate']);
    expect(new Set(practiceExperiments.map(e=>e.id)).size).toBe(14);
    expect(documentActivities.map(e=>e.code)).toEqual(Array.from({length:12},(_,i)=>String(i+3).padStart(2,'0')));
    expect(practiceExperiments.some(e=>e.id.includes('excess')||e.id==='oxygen-no-catalyst'||e.id==='oxygen-stirred')).toBe(false);
    expect(activity('oxygen').reagents).toEqual(['KMnO₄']);
  });
  it('uses the limiting reagent for gas, salt and precipitation products',()=>{
    const zinc=activityOutcome(activity('zinc-acid'),[10,6])!;
    expect(zinc.products.find(p=>p.formula==='H₂')?.mmol).toBe(3);
    expect(zinc.remaining[0].mmol).toBe(7);
    expect(activityOutcome(activity('oxygen'),[10])?.products.find(p=>p.formula==='O₂')?.mmol).toBe(5);
    expect(activityOutcome(activity('saponification'),[10,15])?.products.find(p=>p.formula==='Glixerol')?.mmol).toBe(5);
    expect(activityOutcome(activity('silver-chloride'),[10,4])?.products[0].mmol).toBe(4);
  });
  it('accounts for redissolving carbonate in excess CO₂',()=>{
    expect(activityOutcome(activity('carbon-dioxide-test'),[5,10])?.products[0].mmol).toBe(5);
    expect(activityOutcome(activity('carbon-dioxide-test'),[15,10])?.products).toEqual([{formula:'CaCO₃',mmol:5},{formula:'Ca(HCO₃)₂',mmol:5}]);
    const excess=activityOutcome(activity('carbon-dioxide-test'),[25,10])!;
    expect(excess.products[0].mmol).toBe(0);
    expect(excess.remaining[0].mmol).toBe(5);
  });
  it('rejects invalid dosages and does not invent an ester equilibrium yield',()=>{
    for(const n of [0,-1,NaN,Infinity])expect(activityOutcome(activity('zinc-acid'),[n,10])).toBeNull();
    expect(activityOutcome(activity('esterification'),[10,10])).toBeNull();
  });
});
