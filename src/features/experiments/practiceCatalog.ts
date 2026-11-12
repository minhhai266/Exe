import { experiments } from './data';
import { documentActivities } from './documentActivities';
import { documentLabExperiments } from './labActivities';

// Keep the two original cards, followed by the document's cards 03–14.
export const practiceLabExperiments = [...experiments.filter(e=>['hydrogen','precipitate'].includes(e.id)),...documentLabExperiments];
export const practiceExperiments = [...practiceLabExperiments.slice(0,2), ...documentActivities];
