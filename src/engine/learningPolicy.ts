import type { Vessel } from './equipment';
import { reactionRules } from './reactionRules';

export type ExplanationPolicy='always'|'after-submit'|'never';
export function canExplain(policy:ExplanationPolicy='always',submitted=false){return policy==='always'||policy==='after-submit'&&submitted}
export function observedReaction(v:Vessel){
 const r=v.reaction;
 return r&&r.extent>1e-10?(r.rule||reactionRules.find(rule=>rule.id===r.ruleId)):undefined;
}
