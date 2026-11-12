# Cải tiến phòng lab

## Cập nhật giao diện và thao tác

Giao diện xanh dương cùng điểm nhấn tím, cam, xanh ngọc nằm trong `src/blue-lab.css`; chai minh họa tự vẽ ở `src/lab/ChemicalBottle.tsx`. Chế độ nhanh đặt chai trước phần tùy chỉnh lượng để dễ bắt đầu. Bấm chế độ nhanh thay toàn bộ bàn bằng bộ mới, đặt lại tiến trình và lưu ngay; reset/xóa toàn bộ có hoàn tác. Gợi ý chỉ xuất hiện khi người học yêu cầu.

`engine/tubeInteraction.ts` xử lý nét kéo ống và bắt hai đầu vào cổng trong phạm vi 100 đơn vị. `WorkbenchScene.tsx` hiển thị đúng nét kéo, cập nhật các đầu nối và bộ phận gắn kèm trong khi di chuyển bình/giá. `connectionLogic.ts` dùng bán kính 120 cho phụ kiện miệng bình. `heatingLogic.ts` áp dụng vùng nhiệt bán kính 160 (hai ô quy ước), không còn yêu cầu giá trước khi đun trong mô hình tương tác này; các chặn hiđro/bình kín vẫn giữ.

`ReactionComposer.tsx` và phần Builder trong `pages.tsx` cho giáo viên tạo bản nháp bằng Gemini hoặc tự soạn, sửa chất/hệ số/điều kiện/hiện tượng/nguồn, duyệt và lưu cùng bài học. `reactionAuthoring.ts` kiểm tra chất thuộc thư viện, cân bằng nguyên tử và miền điều kiện; không xác nhận tính đúng thực nghiệm thay giáo viên. Quy tắc được lưu riêng theo bài và chụp lại trong state phản ứng, không thay thư viện toàn cục.

`server/geminiPlugin.ts` cung cấp API trong Vite dev/preview, dùng khóa và model từ `.env.local` ở máy chủ. Build tĩnh cần triển khai backend và xác thực riêng. Kiểm thử gọi Gemini dùng phản hồi giả lập; chưa gọi Gemini thật do chưa cấu hình khóa. Xem hướng dẫn mới trong README.

Kiểm tra đợt này: 57 unit test; 16 kiểm thử trình duyệt bao gồm đăng nhập, lắp ráp, nhiệt, vẽ ống, reset, soạn/lưu/chạy bài Gemini qua phản hồi giả lập, chuyển dung dịch, mobile, học liệu và bảng giá. Đã xem ảnh desktop/mobile và sửa kích thước chai, vị trí thanh công cụ. Hai kiểm thử `flows.spec.ts` dùng selector đăng nhập/menu cũ không nằm trong bộ 16 này.

## Phân tích kiến trúc

- `Lab.tsx`: điều phối state, thao tác, lưu bản nháp, hoàn tác và nộp bài.
- `lab/WorkbenchScene.tsx`, `LabVisuals.tsx`: bàn Konva, kéo thả, cổng nối, hình dụng cụ và hiện tượng.
- `engine/chemicals.ts`, `catalog.ts`, `equipment.ts`: dữ liệu hóa chất, an toàn, nguồn tham khảo và dụng cụ.
- `engine/reactionRules.ts`, `timeSimulation.ts`: bốn quy tắc theo hệ số mol, chất giới hạn và tích phân theo thời gian.
- `engine/experimentGoals.ts`, `data.ts`: mục tiêu đánh giá và bài thực hành.
- `store.ts`: Zustand và LocalStorage. Chưa có API backend thực tế.

## Các thay đổi đã triển khai

1. Kho: tìm theo tên/công thức, hiển thị trạng thái và nồng độ đang chọn. Màu chai ở kho và thẻ thông tin dùng cùng mô hình màu với bàn; dung dịch không màu không mang màu nhận diện tùy ý.
2. Thẻ thông tin: liệt kê các quy tắc phản ứng liên quan, nêu rõ chất chưa có quy tắc.
3. Tách `engine/transfer.ts`: rót thể tích tùy chọn theo tỷ lệ mol trong dung dịch; giữ chất rắn lắng và khí ở nguồn; bảo toàn thể tích và lượng từng chất; trộn nhiệt độ theo giả thiết dung dịch như nước.
4. Chặn số không hợp lệ, nguồn thiếu chất, đích tràn, bình có nút, phản ứng đang chạy và bình thu khí. Xóa kế hoạch phản ứng cũ sau chuyển để không tiếp tục dùng lượng chất trước khi rót.
5. Kéo nguồn đến gần bình khác để chọn đích; nhập thể tích và xác nhận trong bảng thuộc tính ở chế độ Tự lắp ráp. Hiệu ứng nghiêng/dòng chảy chỉ xuất hiện sau giao dịch thành công. Có thể chọn đích qua danh sách, không cần kéo.
6. Phản hồi tiếng Việt hướng người học chọn bình đích rồi chủ động bắt đầu phản ứng; lưu nhật ký và hỗ trợ hoàn tác bằng cơ chế sẵn có.

## Phạm vi còn lại

Đây là phần cải tiến kho và chuyển dung dịch trên kiến trúc hiện có. Chưa bổ sung burette/pipette có thể hút và chứa chất thật, rót liên tục khi giữ nút, hoặc workflow kiểm tra từng bước riêng biệt. Chế độ nhanh và tự lắp ráp có sẵn không tương đương hoàn toàn Guided/Free Mode được đề xuất. Không bổ sung phản ứng mới khi chưa có dữ liệu kiểm chứng.

Mức chất lỏng lấy trực tiếp từ state đã commit; animation minh họa giao dịch, chưa nội suy thể tích theo dòng chảy. Rót hiện là gạn dung dịch đồng nhất phía trên chất rắn lắng, không phải chuyển huyền phù. Không mô phỏng thủy động lực học.

Tham khảo nguyên tắc thao tác: https://chemcollective.org/help/vlabUserGuide và https://chemcollective.org/help/vlabWalkthrough. Không dùng mã hoặc hình ảnh của ChemCollective.
