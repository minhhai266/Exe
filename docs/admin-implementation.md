# Admin Dashboard — kiểm tra và kế hoạch triển khai

## Những gì đã có

React 19/TypeScript/Vite, React Router, Zustand, Be Vietnam Pro, Lucide; workspace thu gọn sidebar; danh mục hóa học và dụng cụ trong engine; kiểm tra cân bằng nguyên tử; mô phỏng theo thời gian; học liệu cấu trúc; lớp, giao/nộp/chấm bài cục bộ. API hiện có chỉ tạo bản nháp Gemini.

## Khoảng trống trước triển khai

Không có database quản trị, tài khoản System/School Admin, tenant, session máy chủ, API CRUD nội dung, upload bền vững, metrics máy chủ hoặc audit log. Không chuyển số liệu trong localStorage thành số liệu hệ thống một cách ngầm định.

## Thứ tự phụ thuộc

1. SQLite migrations, repository, xác thực, RBAC/tenant, DTO và kiểm thử API.
2. AdminLayout và component chung, đúng bảy module; API nội dung và preview dùng engine.
3. Nhà trường/tài khoản, lời mời đặt mật khẩu, khóa tài khoản và kiểm tra truy cập chéo trường.
4. E-book cấu trúc, file hợp lệ, reader và liên kết Lab.
5. Catalog phát hành cho Lab, đo phiên có xác thực, KPI/charts thực, audit, kiểm thử tích hợp và responsive.

## Cấu trúc và file

- `server/admin/`: migrations/database, security, service/validation, HTTP middleware.
- `src/features/admin/`: domain/API, layout, auth, dashboard, bảng chung, editor/preview, reader.
- `vite.config.ts`: gắn middleware cùng backend hiện có, hỗ trợ dev và preview.
- `src/app/App.tsx`: thêm route quản trị/reader, giữ route Lab hiện tại.
- `src/engine/`: adapter chỉ nhận dữ liệu và hành vi được hỗ trợ; không thực thi mã do admin tải lên.

## Rủi ro và cách kiểm tra

- Auth cục bộ hiện có không phải bằng chứng phân quyền máy chủ. API quản trị chỉ chấp nhận cookie phiên được máy chủ cấp, kiểm tra lại vai trò và trường trong database mỗi request.
- SQLite tích hợp Node 22.22 hiện chạy được nhưng vẫn mang nhãn experimental; dùng một tiến trình ghi, transaction, foreign key, unique/index, version và archive. Chưa coi đây là hạ tầng scale nhiều máy chủ.
- Phương trình cân bằng chưa chứng minh phản ứng có thật. Phát hành cần nguồn và xác nhận chuyên môn; trạng thái engine/effect phải được kiểm tra riêng.
- Không được lấy màu vật chất từ theme dashboard; dữ liệu hóa học và token UI tách biệt.
- Kiểm tra RBAC/tenant, duplicate, payload sai, đổi role trái quyền, token dùng lại, upload không hợp lệ, publication và dữ liệu Lab cũ trước khi bàn giao.

## Kết quả triển khai

| Module | Dữ liệu và hành vi thực tế |
| --- | --- |
| Dashboard | Tám KPI bằng SQL, bộ lọc ngày, ba chuỗi thời gian, phân bố vai trò, hoạt động từ audit; trạng thái tải/trống/lỗi |
| Hóa chất | CRUD, tìm/lọc phân loại/trạng thái, sắp xếp/phân trang backend; kiểm tra công thức, số/đơn vị, nguồn/review; mẫu chuẩn bị riêng, phản ứng liên quan |
| Dụng cụ | Mẫu 2D engine, thumbnail/preview, dung tích, vật liệu, hành vi tương thích, cổng có tọa độ/hướng/loại/occupancy; kéo vào Lab với snapshot cấu hình |
| Phản ứng & hiệu ứng | Vế/hệ số riêng với điều kiện và effect; kiểm tra nguyên tố/điện tích, hỗ trợ engine; preview thực bằng `startReaction`/`stepSimulation`; cấu hình bài mẫu riêng |
| E-book | Chương/bài/khối có thứ tự, liên kết chất/phản ứng/dụng cụ/thí nghiệm, cover/PDF upload, preview/reader, tìm kiếm và tiến độ cục bộ |
| Nhà trường | CRUD/archive, quản trị viên, liên hệ, đếm giáo viên/học sinh, các tab overview/admin/teacher/student/classes/activity; khóa trường thu hồi phiên |
| Tài khoản & quyền | Bốn vai trò, tìm/lọc/sắp xếp/phân trang, mời/đặt lại mật khẩu, khóa/mở khóa, session máy chủ và kiểm tra tenant mỗi request |

`users.school_id` là membership một trường cho mỗi tài khoản ở giai đoạn này, không tạo bảng membership trùng chức năng. System Admin không gắn riêng một trường. School Admin chỉ sửa liên hệ trường mình và quản lý giáo viên/học sinh cùng trường; thư viện dùng chung chỉ đọc. Teacher/Student không được gọi API quản trị. Tài khoản học tập cục bộ giữ cách dùng cũ, không được chấp nhận làm bằng chứng quyền API.

### Khởi động và dữ liệu

Yêu cầu Node 22.22+; `node:sqlite` hiện còn cảnh báo experimental trên phiên bản đã kiểm tra. Chạy `npm install`, `npm run dev`, mở `/admin` tại địa chỉ loopback và tạo tài khoản đầu tiên. Cấu hình `.env.local` chỉ đọc ở máy chủ:

- `ADMIN_DB_PATH`: mặc định `.data/virtual-lab.sqlite`; `:memory:` chỉ dùng cho kiểm thử.
- `ADMIN_SETUP_TOKEN`: mã khởi tạo nếu truy cập từ xa. Không có mã thì chỉ socket loopback được phép tạo tài khoản đầu tiên. Đặt mã trước khi mở reverse proxy vì kết nối từ proxy có thể xuất hiện như loopback.
- `ADMIN_SECURE_COOKIES=1`: bắt buộc cookie Secure khi máy chủ nằm sau HTTPS. Local HTTP dùng `0`. Không tin tự động `X-Forwarded-Proto` do client gửi.

Database có năm migration đánh số, foreign key, unique/check/index, WAL và transaction. Migration 3 bổ sung dependency của phản ứng chuẩn, sửa cổng mặc định và tên quốc tế của bản seed chưa sửa. Migration 4 bổ sung thời điểm hoàn thành phiên và index thống kê. Migration 5 bổ sung bản nháp Reaction Studio, lịch sử và ngân sách gọi AI; xem [Reaction Studio](reaction-studio.md). Không ghi đè bản ghi quản trị đã chỉnh sửa. Các thay đổi về liên kết E-book, lời mời và múi giờ nằm ở [báo cáo hoàn thiện](admin-followup.md).

Các file upload lưu BLOB cùng database. Để sao lưu đơn giản: dừng tiến trình máy chủ sau khi đã lưu công việc, sao chép file SQLite và các file `-wal`/`-shm` nếu còn; khởi động lại. Với sao lưu trực tuyến, dùng công cụ SQLite hỗ trợ backup nhất quán, không sao chép riêng file chính đang có giao dịch. Không commit database hoặc đưa nó vào thư mục `public`/`dist`.

### API và bảo vệ dữ liệu

- `GET /api/admin/auth/state`; `POST .../setup`, `.../login`, `.../logout`, `.../activate`.
- `GET /api/admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`, `/api/admin/options`.
- `GET/POST /api/admin/{chemicals|apparatus|reactions|ebooks|schools|users}`; `GET/PUT .../:id`. Danh sách hỗ trợ `q`, `status`, `page`, `pageSize`, `sort`, `direction` và bộ lọc theo module.
- `POST /api/admin/reactions/:id/validate`, `POST /api/admin/users/:id/invite`, `GET /api/admin/schools/:id/overview`, `GET /api/admin/:resource/:id/versions`.
- `POST /api/admin/assets`, `GET /api/admin/assets/:id`; file nháp chỉ System Admin đọc, file thuộc học liệu/dụng cụ đã xuất bản được đọc công khai.
- `GET /api/catalog`: catalog đã phát hành; `POST /api/learning/sessions`, `POST .../:id/complete`, `POST /api/learning/classes`: xác thực Teacher/Student, trường và chủ sở hữu lấy từ session máy chủ.

Mật khẩu dùng scrypt với salt ngẫu nhiên; không trả hash trong DTO. Session cookie HttpOnly/SameSite=Strict, hết hạn 8 giờ; database chỉ lưu digest của token. Liên kết đặt mật khẩu ngẫu nhiên, hash tại máy chủ, hết hạn 24 giờ, dùng một lần. Cấp liên kết mới thay thế liên kết cũ; kích hoạt/đổi quyền/khóa thu hồi phiên phù hợp. Có giới hạn tốc độ, kiểm tra origin và header mutation, version chống ghi đè, soft archive, audit không chứa mật khẩu/token. Quy trình gửi thư chưa được kết nối; quản trị viên chia sẻ liên kết hiển thị một lần.

### Phạm vi engine và học liệu

Chất mới có thể xuất bản thông tin thư viện. Engine hiện chỉ tính các species có trong danh mục vật chất cố định; phản ứng dùng species mới nhận `partial` và bị chặn xuất bản thành mô phỏng đầy đủ. Không tự dựng phản ứng từ hai chất. Hành vi dụng cụ đi theo toàn bộ mẫu engine; chưa bật/tắt tùy ý từng hành vi, chưa thay hình học/vùng tương tác bằng ảnh tải lên. Dung tích, cổng và tên mới lưu snapshot vào dụng cụ trong phiên Lab.

Effect hỗ trợ: bọt khí, kết tủa, trung hòa/chỉ thị và phản ứng không có effect bổ sung. Tham số được chỉnh là thời gian minh họa và nhiệt độ mô hình trong khoảng cho phép. Không cung cấp hiệu ứng boiling/evaporation hay màu vật chất tùy ý theo theme. Phản ứng chuẩn đang được bài mẫu sử dụng không được thay thành phần/hệ số; tạo phản ứng riêng nếu cần. Nội dung đang được tham chiếu không được thu hồi phát hành hoặc archive gây đứt quan hệ.

Khối E-book render bằng React, không nhận/thực thi raw HTML. URL chặn protocol thực thi; video chỉ embed YouTube nocookie/Vimeo; dữ liệu có giới hạn kích thước. Upload chỉ nhận PNG/JPEG/WebP tối đa 3 MB và PDF tối đa 10 MB; kiểm tra chữ ký và canonical MIME, chặn SVG, một số action/attachment PDF nguy hiểm; response có `nosniff` và CSP sandbox. Đây không phải trình quét malware hay bộ phân tích PDF đầy đủ. Nếu mở upload cho nguồn không tin cậy trên Internet, cần bổ sung quét file và cô lập dịch vụ. Chỉ phát hành nội dung có quyền sử dụng; bộ seed học liệu lấy từ nội dung sẵn có của dự án, không xác nhận giấy phép của tài liệu bên ngoài.

### Phần tương thích và giới hạn triển khai

Giao/nộp/chấm bài, thành viên lớp, gói trả phí và tài khoản tự đăng ký cũ vẫn ở localStorage/sessionStorage. Không chuyển thành hệ thống học tập đa máy hoàn chỉnh trong đợt này. Tạo lớp bằng tài khoản máy chủ đồng bộ metadata tên lớp/giáo viên/trường; các lớp cũ không được tự nhập. KPI chỉ ghi nhận phiên có session máy chủ; completion là sự kiện người học nộp, chưa xác minh điểm hay chống gian lận. Tiến độ đọc lưu theo người dùng trên trình duyệt.

Backend gắn vào Vite dev và preview; `npm run preview` phục vụ bản build cùng API để kiểm tra cục bộ. Hosting chỉ có `dist` không chạy API. Trước khi phục vụ Internet cần host Node có lưu trữ bền vững, HTTPS, mã khởi tạo và cấu hình cookie phù hợp; không công khai Vite dev. SQLite này dành cho một tiến trình/host; chưa triển khai HA, object storage, email hoặc dịch vụ thanh toán.

### Kiểm thử

`npm run build`; `npm test` hiện có 90 kiểm thử thuộc 13 file, gồm engine và API thực qua HTTP/SQLite. Có kiểm tra auth/hash, duplicate, version, dữ liệu sai, effect sai, upload, lời mời một lần, khóa/session, hai trường, chống nâng quyền, thống kê, toàn vẹn liên kết E-book, ngày hoàn thành theo UTC+7, migration từ phiên bản 3 và persistence qua đóng/mở database.

`npm run test:admin` chạy Chrome/Playwright với database bộ nhớ riêng, cổng 5176: bootstrap, đủ bảy module, tạo/sửa trường, giáo viên/lời mời/đăng nhập, 403 cho giáo viên, preview engine, dụng cụ 500 mL trong Lab, upload/đọc PDF, E-book escape HTML/ghi nhớ đọc và responsive. Ảnh kiểm tra ở `artifacts/admin-*.png`. Bộ giao diện Lab cũ có một số selector cho mode/thanh trạng thái đã được người dùng yêu cầu bỏ; chưa coi toàn bộ các spec cũ đó là đạt với giao diện hiện tại.
