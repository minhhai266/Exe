# Đối chiếu và hoàn thiện Admin Dashboard

Đã triển khai trực tiếp trong dự án React 19 / TypeScript / Vite hiện có. Backend quản trị chạy cùng Vite, lưu SQLite; không tạo ứng dụng hoặc database nghiệp vụ riêng.

## Hiện trạng sau khi đối chiếu

Đủ bảy module: Dashboard, Hóa chất, Dụng cụ, Phản ứng & hiệu ứng, E-book, Nhà trường, Tài khoản & phân quyền. Các module đã có API, lưu dữ liệu, xác thực và kiểm tra quyền máy chủ. Nội dung thư viện ban đầu lấy từ danh mục có sẵn; không thêm trường, học sinh hoặc lượt thực hành giả vào database chính.

Component dùng lại: `AdminLayout`, `AdminPageHeader`, `AdminPagination`, `StatusBadge`, `ConfirmAdmin`, trạng thái tải/trống/lỗi, form nội dung, upload và reader. Component mới `EffectTemplateDetails` trình bày giới hạn của mẫu hiệu ứng bên trong module phản ứng.

## Thay đổi theo giai đoạn

### 1. Nền tảng và kiểm tra đầu vào

- Từ chối JSON gốc là null, mảng hoặc giá trị đơn bằng lỗi 400.
- Chuẩn hóa số trang/kích thước trang thành số nguyên, tránh lỗi SQL với tham số phân trang thập phân.
- Giữ session cookie, scrypt, RBAC, transaction và kiểm tra version hiện có.

### 2. Thư viện hóa học

- Tìm hóa chất theo tên, mã, công thức hoặc tên quốc tế ở backend.
- Bộ lọc loại dụng cụ hoạt động qua API và bảng quản trị.
- Hiển thị điều kiện tương thích, tham số và giới hạn màu/hình thái của effect template. Preview vẫn dùng simulation engine thực tế.
- Không mở thêm hành vi hoặc hiệu ứng mà engine chưa hỗ trợ.

### 3. Trường và tài khoản

- Đổi email/quyền/trường hoặc khóa tài khoản thu hồi session và liên kết đặt mật khẩu còn hiệu lực.
- Tạm khóa/lưu trữ trường thu hồi session và lời mời của các tài khoản thuộc trường; mở lại trường không khôi phục lời mời cũ.
- Khóa hoặc thay quyền/phạm vi School Admin gỡ việc gán người đó làm quản trị viên của trường và tăng version trường.
- Chặn chuyển tài khoản đã có lớp hoặc lịch sử thực hành sang trường khác khi chưa có quy trình di chuyển dữ liệu.
- Tên trường trong DTO tài khoản lấy từ database, không phụ thuộc danh sách 100 trường ở bộ chọn.

### 4. E-book và toàn vẹn liên kết

- Khi phát hành sách, hóa chất/phản ứng/dụng cụ/thí nghiệm liên kết phải tồn tại và đã xuất bản.
- Chặn thu hồi nội dung hoặc tắt bài thực hành mẫu đang được E-book đã xuất bản tham chiếu. Thông báo chỉ rõ sách đang sử dụng.
- Bản nháp được phép liên kết nội dung chưa xuất bản để tiếp tục soạn thảo.
- Kiểm tra quan hệ tái sử dụng `ebook_chapters`, `ebook_lessons`, `lesson_experiment_links` và dữ liệu JSON hiện có, không tạo bảng trùng.
- Trạng thái đọc được khởi tạo lại theo cặp sách/người dùng; dữ liệu tiến độ sai định dạng không làm hỏng trang đọc.

### 5. Dashboard và migration

- Migration 4 bổ sung `learning_sessions.completed_at` và index. Phiên đã hoàn thành trước đây lấy `updated_at` làm thời điểm hoàn thành; đây là giá trị gần đúng tốt nhất mà schema cũ lưu được.
- Thống kê ngày theo `Asia/Ho_Chi_Minh` (UTC+7), độc lập múi giờ hệ điều hành.
- Phiên bắt đầu và phiên hoàn thành được nhóm theo hai thời điểm riêng; biểu đồ có các ngày 0 nằm giữa những ngày có dữ liệu.
- Gửi lại completion không đổi thời điểm hoàn thành đầu tiên.
- Từ chối ngày lịch không tồn tại, chẳng hạn 30/02.

Đã kiểm tra dữ liệu chính trước khi thay đổi: 3 migration, 0 tài khoản, 0 trường, 0 phiên thực hành, 5 E-book và 4 phản ứng sẵn có. Bản sao SQLite nhất quán được tạo bằng `VACUUM INTO` tại `.data/virtual-lab-before-migration-4-1794125213416.sqlite` trước khi bổ sung migration 4. Không đưa bản sao hoặc database vào hosting tĩnh.

## Kiểm thử

- `npm run build`: kiểm tra TypeScript và build ứng dụng.
- `npm test`: 90 kiểm thử trong 13 file, gồm engine hiện có, API HTTP/SQLite, toàn vẹn liên kết, tenant, lời mời, thời điểm hoàn thành, lịch Việt Nam và migration trên database phiên bản 3 có dữ liệu.
- `npm run test:admin`: hai luồng Playwright đã đạt, dùng database bộ nhớ riêng. Bao phủ bootstrap, bảy module, trường/tài khoản/lời mời, quyền giáo viên, reaction preview, dụng cụ trong Lab, upload/đọc PDF, XSS dạng văn bản, tiến độ đọc, responsive; thêm tạo/sửa/xuất bản hóa chất bằng form, chặn trùng, tìm tên quốc tế, sửa cổng dụng cụ và lọc loại dụng cụ. Kiểm tra chuyển sách trong cùng route SPA và khôi phục tiến độ bị sai định dạng.

Đã xem ảnh Dashboard desktop và sidebar mobile. Database chính đã áp dụng migration 4; `PRAGMA integrity_check` trả về `ok`, `PRAGMA foreign_key_check` không có lỗi. Tài khoản kiểm thử chỉ nằm trong database riêng, không được tạo vào dữ liệu chính.

## Bổ sung ảnh nhận biết hóa chất

Hóa chất hỗ trợ ảnh tùy chọn, chú thích và nguồn/tác giả ảnh. Form quản trị có tải/thay/gỡ ảnh và xem trước. Người học xem ảnh trong từ điển và cửa sổ thông tin hóa chất của Lab, áp dụng cho cả chất engine có sẵn và chất bổ sung vào thư viện. Khi không có ảnh, giao diện vẫn dùng công thức/hình minh họa hiện có.

Các trường `imageUrl`, `imageCaption`, `imageCredit` lưu trong JSON của bản ghi hóa chất; không cần migration. Backend chỉ chấp nhận ảnh đã tải lên kho hệ thống; giữ giới hạn PNG/JPEG/WebP tối đa 3 MB. File chỉ công khai khi được hóa chất đã xuất bản tham chiếu; gỡ ảnh thu hồi truy cập công khai nếu không còn nội dung đã xuất bản khác sử dụng. Ảnh không thay đổi tính chất vật chất hoặc logic engine.

Kiểm thử bổ sung kiểm tra lưu ảnh/chú thích/nguồn, từ chối đường dẫn ảnh ngoài, quyền truy cập file trước/sau xuất bản và sau khi gỡ. Playwright kiểm tra tải ảnh trong form, preview quản trị và hiển thị cho người học. Tổng bộ unit/API hiện có 91 kiểm thử.

## Bổ sung kho hiện tượng phản ứng

Kho nằm trong module Phản ứng & hiệu ứng, giữ nguyên bảy mục điều hướng. Có bảy loại hiện tượng được mô hình hiện tại hỗ trợ: sinh khí, kết tủa, chất rắn tan dần, đổi màu dung dịch, trung hòa, tỏa nhiệt và dẫn/thu khí. Có tìm kiếm, lọc nhóm, xem mẫu bằng engine và tạo bản nháp từ mẫu hiện có.

Mỗi mẫu nêu rõ điều kiện. Khi tạo từ mẫu, dữ liệu chất/hệ số/nguồn được lấy từ phản ứng hiện có trong database; bản mới có mã riêng, trạng thái nháp và phải xác nhận kiểm chứng lại trước khi phát hành. Hiện bảy nhóm này dùng các ví dụ từ bốn phản ứng chuẩn của dự án, không tạo thêm định luật hoặc phản ứng khoa học chưa được xác minh.

Một phản ứng có thể lưu nhiều mục tiêu quan sát trong `data.phenomena`; dữ liệu đi theo catalog, bài mẫu và snapshot quy tắc phản ứng. Metadata này không thay đổi cân bằng vật chất, tự tạo nhiệt hoặc cho phép chọn màu chất tùy ý. Backend từ chối hiện tượng ngoài kho hoặc không tương thích. Màu đổi được xét theo mô hình màu của hỗn hợp; hình thái chất rắn tan dần hiện áp dụng cho kẽm; nhiệt chỉ dùng phản ứng trung hòa chuẩn. Thu khí vẫn phụ thuộc bộ dụng cụ thực tế trong phiên Lab.

Các định nghĩa dùng chung đặt tại `src/engine/phenomena.ts`, được API options cung cấp cùng các mẫu engine. Lựa chọn theo phản ứng lưu bằng cấu trúc JSON hiện có, không cần thay schema. Không ghi đè hoặc phát hành lại các phản ứng đang có khi triển khai tính năng này.

Build đã đạt; tổng cộng 95 kiểm thử trong 14 file và ba luồng Playwright đã đạt. Có kiểm tra hiện tượng đồng thời, chặn cấu hình không tương thích tại API, xem preview, tạo/lưu/tải lại bản nháp từ kho và form trên màn hình mobile. Ảnh kiểm tra: `artifacts/admin-phenomenon-library.png`.

## Giới hạn giữ nguyên

- SQLite và backend hiện dành cho một host Node; hosting riêng `dist` không chạy API.
- Lớp/bài giao/bài nộp/chấm điểm cũ vẫn lưu ở trình duyệt. Metadata lớp và phiên có tài khoản máy chủ mới được đồng bộ; completion chưa phải xác minh kết quả học tập chống gian lận.
- Liên kết đặt mật khẩu được hiển thị một lần để quản trị viên chia sẻ; chưa kết nối dịch vụ email.
- Species vật chất mới có thể có thông tin thư viện nhưng chưa tự động được engine mô phỏng. Dụng cụ dùng mẫu hình học và hành vi có sẵn. Chưa hỗ trợ boiling/evaporation.
- Chặn SVG tải lên; PDF và ảnh được kiểm tra theo giới hạn đã mô tả trong tài liệu triển khai, chưa có dịch vụ quét malware.
- Bộ selector giao diện Lab cũ chưa được cập nhật toàn bộ theo các thay đổi giao diện trước đây. Lần này xác minh engine bằng unit test và đường tích hợp Lab bằng Playwright Admin; không khẳng định toàn bộ các spec giao diện cũ đã đạt.
