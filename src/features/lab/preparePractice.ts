import type { Experiment } from '../experiments/data';
import { quickSetup } from '../../engine/quickSetup';

export function preparePractice(experiment:Experiment){
  return quickSetup(experiment);
}