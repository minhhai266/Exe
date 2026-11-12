import {effectTemplates} from './domain';

const constraints:Record<string,string>={
 bubbles:'Cần sản phẩm khí đã được engine hỗ trợ.',
 precipitate:'Cần sản phẩm có pha kết tủa trong thư viện.',
 neutral:'Chỉ áp dụng cho hệ HCl / NaOH / NaCl / H₂O.',
 none:'Không thay đổi hiệu ứng pha khí hoặc kết tủa bắt buộc của sản phẩm.',
};

export function EffectTemplateDetails({code}:{code:string}){
 const effect=effectTemplates.find(item=>item.code===code);
 if(!effect)return null;
 return <section className="admin-effect-details" aria-label="Thông tin mẫu hiệu ứng">
  <h3>{effect.name}</h3><p>{effect.description}</p>
  <dl><div><dt>Điều kiện tương thích</dt><dd>{constraints[effect.code]}</dd></div>
   <div><dt>Tham số được điều chỉnh</dt><dd>Thời gian minh họa: 1–120 giây; mặc định 10 giây cho phản ứng mới.</dd></div>
   <div><dt>Màu và hình thái</dt><dd>Theo dữ liệu vật chất của engine. Chạy preview để kiểm tra diễn biến của phản ứng đang soạn.</dd></div></dl>
 </section>;
}
