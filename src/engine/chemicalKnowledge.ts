import { extendedChemicals,type ExtendedChemicalId } from './extendedChemicals';
import type { ChemicalId } from './chemicals';

export interface ChemicalKnowledge {
  formula: string;
  classification: string;
  composition: string;
  structure: string;
  physical: string;
  chemical: string;
}

// Formula units describe ionic solids; they are not discrete molecules.
// Properties describe real substances, separately from the engine's supported rules.
export const chemicalKnowledge: Record<ChemicalId, ChemicalKnowledge> = {
  ...Object.fromEntries(Object.entries(extendedChemicals).map(([id,c])=>[id,c.knowledge])) as Record<ExtendedChemicalId,ChemicalKnowledge>,
  Zn: {
    formula: 'Zn', classification: 'Đơn chất · Kim loại',
    composition: 'Gồm nguyên tố kẽm (Zn), số hiệu nguyên tử 30.',
    structure: 'Các nguyên tử Zn tạo mạng tinh thể kim loại, liên kết với nhau bằng liên kết kim loại.',
    physical: 'Chất rắn màu xám bạc, dẫn điện và dẫn nhiệt, không tan trong nước.',
    chemical: 'Có tính khử: Zn nhường 2 electron tạo Zn²⁺. Tác dụng với dung dịch HCl giải phóng H₂; ZnO và Zn(OH)₂ là các hợp chất lưỡng tính của kẽm.',
  },
  HCl: {
    formula: 'HCl', classification: 'Hợp chất · Axit mạnh trong nước',
    composition: 'Một phân tử hiđro clorua gồm 1 nguyên tử H và 1 nguyên tử Cl.',
    structure: 'H–Cl có liên kết cộng hóa trị phân cực. Trong nước, HCl ion hóa gần như hoàn toàn tạo H₃O⁺ và Cl⁻.',
    physical: 'HCl nguyên chất là khí; axit clohidric trong lab là dung dịch HCl trong nước, trong suốt, không màu.',
    chemical: 'Trung hòa bazơ tạo muối clorua và nước; tác dụng với một số kim loại đứng trước hiđro trong dãy hoạt động, như Zn, giải phóng H₂.',
  },
  CuSO4: {
    formula: 'CuSO₄', classification: 'Hợp chất · Muối sunfat',
    composition: 'Một đơn vị công thức gồm 1 Cu, 1 S và 4 O; tỉ lệ ion Cu²⁺ : SO₄²⁻ là 1 : 1.',
    structure: 'Muối gồm ion Cu²⁺ và SO₄²⁻; các liên kết S–O trong ion sunfat là liên kết cộng hóa trị. Trong nước, ion đồng được hiđrat hóa.',
    physical: 'CuSO₄ khan màu trắng; dạng ngậm nước CuSO₄·5H₂O màu xanh lam. Dung dịch trong lab có màu xanh lam.',
    chemical: 'Ion Cu²⁺ kết hợp với OH⁻ tạo kết tủa Cu(OH)₂ màu xanh lam. Ion SO₄²⁻ không tham gia phương trình ion rút gọn của phản ứng này.',
  },
  NaOH: {
    formula: 'NaOH', classification: 'Hợp chất · Bazơ mạnh',
    composition: 'Một đơn vị công thức gồm 1 Na, 1 O và 1 H; tỉ lệ ion Na⁺ : OH⁻ là 1 : 1.',
    structure: 'Gồm Na⁺ và OH⁻; trong OH⁻, O và H liên kết cộng hóa trị. Khi hòa tan, phân li thành Na⁺ và OH⁻.',
    physical: 'Chất rắn màu trắng, hút ẩm, tan nhiều trong nước và tỏa nhiệt khi hòa tan. Dung dịch không màu.',
    chemical: 'Trung hòa axit tạo muối và nước; cung cấp OH⁻ để tạo kết tủa với Cu²⁺. Làm phenolphthalein chuyển hồng trong vùng pH thích hợp.',
  },
  ZnCl2: {
    formula: 'ZnCl₂', classification: 'Hợp chất · Muối clorua',
    composition: 'Một đơn vị công thức gồm 1 Zn và 2 Cl; kẽm có số oxi hóa +2.',
    structure: 'Liên kết Zn–Cl có tính cộng hóa trị đáng kể. Trong dung dịch loãng, có thể biểu diễn thành phần ion là Zn²⁺ và Cl⁻.',
    physical: 'Chất rắn màu trắng, hút ẩm mạnh, tan tốt trong nước; dung dịch không màu.',
    chemical: 'Là sản phẩm của Zn với HCl. Ion Zn²⁺ có thể tạo Zn(OH)₂ khi thêm OH⁻; kết tủa tan trong bazơ mạnh dư. Phản ứng này chưa được mô phỏng trong lab.',
  },
  H2: {
    formula: 'H₂', classification: 'Đơn chất · Phi kim',
    composition: 'Mỗi phân tử gồm 2 nguyên tử hiđro.',
    structure: 'H–H: hai nguyên tử dùng chung một cặp electron, tạo liên kết cộng hóa trị không phân cực.',
    physical: 'Khí không màu, không mùi, nhẹ hơn không khí và ít tan trong nước.',
    chemical: 'Có tính khử; cháy trong oxi tạo nước. Hỗn hợp H₂ và O₂ có thể gây nổ khi có nguồn mồi. Lab biểu diễn H₂ sinh ra từ Zn và HCl.',
  },
  'Cu(OH)2': {
    formula: 'Cu(OH)₂', classification: 'Hợp chất · Bazơ ít tan',
    composition: 'Một đơn vị công thức gồm 1 Cu, 2 O và 2 H; có 2 nhóm hiđroxit ứng với Cu(II).',
    structure: 'Chất rắn có cấu trúc mạng gồm Cu(II) và các nhóm OH; liên kết O–H trong nhóm hiđroxit là cộng hóa trị.',
    physical: 'Chất rắn màu xanh lam, rất ít tan trong nước; thường được quan sát dưới dạng kết tủa.',
    chemical: 'Hình thành khi Cu²⁺ gặp OH⁻. Tan trong axit; khi đun nóng phân hủy thành CuO và H₂O. Hai quá trình sau chưa được mô phỏng trong lab.',
  },
  Na2SO4: {
    formula: 'Na₂SO₄', classification: 'Hợp chất · Muối sunfat',
    composition: 'Một đơn vị công thức gồm 2 Na, 1 S và 4 O; tỉ lệ ion Na⁺ : SO₄²⁻ là 2 : 1.',
    structure: 'Mạng tinh thể ion gồm Na⁺ và SO₄²⁻; trong ion sunfat có liên kết cộng hóa trị S–O.',
    physical: 'Chất rắn màu trắng, tan trong nước tạo dung dịch không màu.',
    chemical: 'Trong phản ứng CuSO₄ với NaOH, Na⁺ và SO₄²⁻ là các ion khán giả, còn lại trong dung dịch sau khi Cu(OH)₂ kết tủa.',
  },
  NaCl: {
    formula: 'NaCl', classification: 'Hợp chất · Muối clorua',
    composition: 'Tỉ lệ ion Na⁺ : Cl⁻ là 1 : 1; công thức NaCl biểu diễn tỉ lệ này trong tinh thể.',
    structure: 'Gồm mạng tinh thể ion, không tồn tại dưới dạng các phân tử NaCl riêng biệt trong tinh thể. Khi tan, tạo Na⁺ và Cl⁻.',
    physical: 'Tinh thể màu trắng, tan trong nước tạo dung dịch không màu.',
    chemical: 'Dung dịch HCl trung hòa NaOH tạo dung dịch NaCl và nước. Na⁺, Cl⁻ là ion khán giả; phương trình ion rút gọn là H₃O⁺ + OH⁻ → 2H₂O.',
  },
  H2O: {
    formula: 'H₂O', classification: 'Hợp chất · Oxit của hiđro',
    composition: 'Mỗi phân tử gồm 2 nguyên tử H và 1 nguyên tử O.',
    structure: 'H–O–H có dạng gấp khúc, góc liên kết khoảng 104,5°. Phân tử phân cực; giữa các phân tử có liên kết hiđro.',
    physical: 'Chất lỏng không màu ở điều kiện thường, là dung môi hòa tan nhiều chất ion và chất phân cực.',
    chemical: 'Có thể nhận hoặc nhường proton. Nước tự ion hóa rất ít tạo H₃O⁺ và OH⁻; đồng thời là sản phẩm của phản ứng trung hòa trong lab.',
  },
  H2O2: {
    formula: 'H₂O₂', classification: 'Hợp chất · Peoxit',
    composition: 'Mỗi phân tử gồm 2 nguyên tử H và 2 nguyên tử O; oxi có số oxi hóa −1.',
    structure: 'Có khung liên kết H–O–O–H, chứa liên kết đơn O–O; phân tử không phẳng.',
    physical: 'Dung dịch loãng trong nước gần như không màu, trong suốt.',
    chemical: 'Có thể thể hiện tính oxi hóa hoặc tính khử. Phân hủy thành nước và oxi: 2H₂O₂ → 2H₂O + O₂; MnO₂ làm tăng tốc độ phản ứng này.',
  },
  O2: {
    formula: 'O₂', classification: 'Đơn chất · Phi kim',
    composition: 'Mỗi phân tử gồm 2 nguyên tử oxi.',
    structure: 'Ở mức phổ thông, biểu diễn O=O với liên kết cộng hóa trị đôi, không phân cực.',
    physical: 'Khí không màu, không mùi, ít tan trong nước, nặng hơn không khí một ít.',
    chemical: 'Có tính oxi hóa, duy trì sự cháy; bản thân oxi không phải khí cháy. Là sản phẩm phân hủy H₂O₂ trong lab.',
  },
  MnO2: {
    formula: 'MnO₂', classification: 'Hợp chất · Oxit kim loại',
    composition: 'Tỉ lệ nguyên tử Mn : O là 1 : 2; Mn có số oxi hóa +4, O có số oxi hóa −2.',
    structure: 'Tạo mạng tinh thể mở rộng với các liên kết Mn–O; không phải các phân tử O=Mn=O riêng biệt.',
    physical: 'Chất rắn màu nâu đen, không tan trong nước.',
    chemical: 'Xúc tác phân hủy H₂O₂, được tái sinh sau chu trình xúc tác nên không bị tiêu thụ theo phương trình tổng. Có thể tham gia phản ứng oxi hóa – khử trong điều kiện khác.',
  },
  CaCO3: {
    formula: 'CaCO₃', classification: 'Hợp chất · Muối cacbonat ít tan',
    composition: 'Một đơn vị công thức gồm 1 Ca, 1 C và 3 O; tỉ lệ ion Ca²⁺ : CO₃²⁻ là 1 : 1.',
    structure: 'Mạng tinh thể ion gồm Ca²⁺ và CO₃²⁻; ion cacbonat có dạng tam giác phẳng với liên kết cộng hóa trị C–O.',
    physical: 'Chất rắn màu trắng, rất ít tan trong nước; là thành phần chính của đá vôi.',
    chemical: 'Tác dụng với HCl giải phóng CO₂; được tạo ra khi CO₂ phản ứng với nước vôi trong. CO₂ dư có thể làm kết tủa tan tiếp; quá trình này được hỗ trợ trong lab.',
  },
  indicator: {
    formula: 'C₂₀H₁₄O₄', classification: 'Hợp chất hữu cơ · Chỉ thị axit – bazơ',
    composition: 'Mỗi phân tử phenolphthalein gồm 20 C, 14 H và 4 O. “PP” trên chai là ký hiệu chỉ thị, không phải công thức phân tử.',
    structure: 'Phân tử hữu cơ có các vòng thơm và nhóm chức chứa oxi; liên kết chủ yếu là cộng hóa trị. Cấu trúc thay đổi theo môi trường axit – bazơ.',
    physical: 'Chất tinh thể trắng, ít tan trong nước; dung dịch chỉ thị thường được pha với dung môi có cồn.',
    chemical: 'Chuyển từ không màu sang hồng trong khoảng pH xấp xỉ 8,2–10. Lab mô phỏng màu trong hệ HCl/NaOH; chỉ thị không được tính như chất phản ứng chính.',
  },
};

export const bondingSource = 'https://openstax.org/books/chemistry-2e/pages/2-6-ionic-and-molecular-compounds';
