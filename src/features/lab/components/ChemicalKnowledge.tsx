import { Atom, ArrowUpRight } from 'lucide-react';
import { chemicalKnowledge, bondingSource } from '../../../engine/chemicalKnowledge';
import { chemicalProfiles } from '../../../engine/catalog';
import type { ChemicalId } from '../../../engine/chemicals';
import './chemical-knowledge.css';

export function ChemicalKnowledge({ id, explanationAllowed }: { id: ChemicalId; explanationAllowed: boolean }) {
  const knowledge = chemicalKnowledge[id];
  if (!knowledge) return null;

  return <section className="chemical-knowledge" aria-label="Kiến thức hóa học">
    <div className="chemical-knowledge-heading"><Atom size={19} aria-hidden="true"/><h3>Kiến thức hóa học</h3><span>{knowledge.formula}</span></div>
    <p className="chemical-knowledge-category">{knowledge.classification}</p>
    <dl>
      <div><dt>Thành phần</dt><dd>{knowledge.composition}</dd></div>
      <div><dt>Cấu tạo & liên kết</dt><dd>{knowledge.structure}</dd></div>
      <div><dt>Tính chất vật lý</dt><dd>{knowledge.physical}</dd></div>
      <div><dt>Tính chất hóa học</dt><dd>{explanationAllowed ? knowledge.chemical : 'Nội dung này sẽ được mở khi bài học cho phép xem giải thích.'}</dd></div>
    </dl>
    {explanationAllowed && <p className="chemical-knowledge-scope">Kiến thức tham khảo về chất; khả năng mô phỏng được liệt kê tại mục “Phản ứng được hỗ trợ”.</p>}
    <div className="chemical-knowledge-sources">
      <a href={bondingSource} target="_blank" rel="noreferrer">Cấu tạo & liên kết · OpenStax <ArrowUpRight size={12}/></a>
      {explanationAllowed && <a href={chemicalProfiles[id].source} target="_blank" rel="noreferrer">Tham khảo về chất <ArrowUpRight size={12}/></a>}
    </div>
  </section>;
}
