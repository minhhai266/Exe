import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChemicalKnowledge } from './ChemicalKnowledge';
import { chemicalKnowledge } from '../../../engine/chemicalKnowledge';
import { chemicals, type ChemicalId } from '../../../engine/chemicals';

describe('chemical knowledge in the catalog', () => {
  it('renders knowledge for every engine chemical, including products and the indicator', () => {
    for (const id of Object.keys(chemicals) as ChemicalId[]) {
      const html = renderToStaticMarkup(createElement(ChemicalKnowledge, { id, explanationAllowed: true }));
      expect(html).toContain(chemicalKnowledge[id].formula);
      expect(html).toContain(chemicalKnowledge[id].chemical);
    }
  });

  it('keeps basic structure visible but withholds chemical explanations and substance links in locked lessons', () => {
    for (const id of Object.keys(chemicals) as ChemicalId[]) {
      const html = renderToStaticMarkup(createElement(ChemicalKnowledge, { id, explanationAllowed: false }));
      expect(html).toContain(chemicalKnowledge[id].composition);
      expect(html).not.toContain(chemicalKnowledge[id].chemical);
      expect(html).not.toContain('Tham khảo về chất');
      expect(html).toContain('Nội dung này sẽ được mở');
    }
  });
});
