import {describe,it,expect} from 'vitest';
import {glassGeometry,liquidGeometry,polygonArea,volumeMarkings} from './apparatus';
describe('Shared apparatus liquid geometry',()=>{
 for(const [type,g] of Object.entries(glassGeometry)){
  it(`${type}: conserves visible volume and keeps the surface horizontal when rotated`,()=>{
   for(const angle of [0,35,90,135,180,270])for(const ratio of [.02,.2,.5,.9,1]){
    const liquid=liquidGeometry(g!,ratio*250,250,angle);
    expect(polygonArea(liquid.points)/polygonArea(g!.inner)).toBeCloseTo(ratio,6);
    if(liquid.surface.length===2){const a=angle*Math.PI/180;const heights=liquid.surface.map(p=>p.x*Math.sin(a)+p.y*Math.cos(a));expect(heights[0]).toBeCloseTo(heights[1],6)}
   }
   expect(liquidGeometry(g!,0,250).points).toEqual([]);
  });
  it(`${type}: graduation positions use the same volume mapping as the liquid`,()=>{
   const marks=volumeMarkings(g!,250);for(const mark of marks)expect(liquidGeometry(g!,mark.value,250).level).toBeCloseTo(mark.y,6);
   expect(marks.every((m,i)=>i===0||m.y<marks[i-1].y)).toBe(true);
  });
 }
});
