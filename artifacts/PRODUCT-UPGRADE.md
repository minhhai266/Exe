# Virtual Lab 2D — cải thiện sản phẩm và hệ màu

## Phạm vi và nguyên tắc

Triển khai trên React 19, TypeScript, Vite, React Router, Zustand và React Konva hiện có. Không thêm dependency, đổi backend, giá gói, quyền truy cập hay định dạng dữ liệu mô phỏng. Các liên kết menu trang chủ vẫn cuộn đến section tương ứng.

Thư mục không phải Git repository nên không tạo nhánh/commit/push. Hai tài liệu đính kèm được sử dụng; 13 ảnh được nhắc trong tài liệu không xuất hiện trong lượt yêu cầu. QA dựa trên ứng dụng chạy thật và ảnh chụp sau thay đổi.

## Bản đồ route, component và dữ liệu

| Route | Page / component | Nguồn dữ liệu | Hành động |
| --- | --- | --- | --- |
| `/` | HomePage, PublicLayout | Danh mục thí nghiệm và học liệu tĩnh | Cuộn menu, preview, mở lab |
| `/login`, `/register` | AuthPage | authStore, sessionStorage / localStorage | Đăng ký, đăng nhập, phân quyền |
| `/teacher/dashboard` | LearningDashboard | authStore, useClassrooms | Xem KPI thật, lớp, bài cần chấm, giao bài gần đây |
| `/student/dashboard` | LearningDashboard | useClassrooms, labStore, useReading | Bài được giao, bàn lab đã lưu, bài bookmark, lịch sử |
| `/experiments` | Library, ExperimentCard | Danh mục và template được phép truy cập | Tìm theo tên/chủ đề/chất; lọc và xem tiến độ |
| `/experiments/:id` | Detail | useExperiments | Mục tiêu, vật tư, mở lab |
| `/{role}/classes` | Classes | useClassrooms | Tạo lớp / tham gia bằng mã |
| `/{role}/classes/:classId` | Classroom | Lớp, bài giao, tài liệu, thành viên | Copy mã, giao bài, gửi tài liệu, tìm thành viên |
| `/teacher/classes/:classId/assignments/:assignmentId` | AssignmentSubmissions | Submissions, saved attempts | Xem nhật ký, chấm điểm, phản hồi |
| `/teacher/experiments/new` | Builder, BuilderSteps, ReactionComposer | Form state, templates, reactionRules | Sáu bước, AI hoặc tự soạn, validation, xem trước, lưu / xuất bản |
| `/teacher/reports` | ClassReports | useClassrooms | Lọc lớp/bài/ngày/trạng thái, KPI, CSV theo bộ lọc |
| `/materials` | MaterialsFolders | lessons, readingStore | Chọn lớp → chương → bài, bookmark |
| `/materials/:lessonId` | LessonReader | lessons, readingStore | Mục lục, đọc, quiz, đánh dấu đã đọc, thực hành liên quan |
| `/lab/:id` | ExperimentAccess, Lab, WorkbenchScene | labStore, chemistry engine, useClassrooms | Dụng cụ, chất, nối, phản ứng, quan sát, ghi chép, nộp, reset/undo |
| `/results/:attemptId` | Result | Attempts / authorized submissions | Xem kết quả, ghi chép và nhật ký |

AI tiếp tục gọi endpoint máy chủ `/api/reaction-draft`. Không đưa API key vào frontend. Lớp, bài giao, bài nộp và tiến độ vẫn lưu cục bộ như trước; không bổ sung backend giả hoặc đồng bộ đa thiết bị.

## Checklist triển khai

### P0

- [x] Tokens thương hiệu, nền, chữ, border, trạng thái, lớp học và vùng lab.
- [x] Bỏ nhập `vivid-theme.css`; thay bằng theme trung tính cho ứng dụng. Giữ stylesheet cũ trên đĩa để bảo toàn cấu trúc.
- [x] Sidebar active theo React Router, thu gọn desktop, drawer mobile, Escape và quản lý focus.
- [x] PageHeading mặc định compact, banner nổi bật dành cho dashboard.
- [x] Chữ và metadata dễ đọc hơn; focus ring và disabled state.
- [x] LabWorkflow lấy bước từ trạng thái thật. Nút chạy dùng kiểm tra `startReaction`; không thay state machine hoặc quy tắc nộp bài hiện tại.
- [x] Tăng hit area/label điểm nối, giữ chuyển đổi tọa độ scene; thu gọn panel desktop không xóa selection.
- [x] Quan sát và giải thích phản ứng, trạng thái lưu ghi chép, focus trap dialog.

### P1

- [x] Teacher dashboard: KPI thật, quick actions gọn, lớp, bài chờ chấm và bài giao gần đây.
- [x] Student dashboard: bài giao, bàn lab đã lưu, bài đã bookmark chưa đọc và lịch sử thật.
- [x] Class cards có số bài chờ chấm; class detail có ngày giao, tổng bài, tìm thành viên và empty state theo ngữ cảnh.
- [x] Reports: lọc thật, KPI theo bài phù hợp, bảng tổng hợp; CSV giữ định dạng cũ và lọc trạng thái theo lần nộp gần nhất.
- [x] Builder: sáu bước giữ form state, hai cách tạo bài, tóm tắt động, preview và xác nhận trước xuất bản.
- [x] Sửa hành vi preview: bài mới được lưu nháp, không tự xuất bản; preview bài đã xuất bản không tự hạ trạng thái của nó.
- [x] AI: prompt examples, loading, hủy request, timeout, lỗi/retry, cảnh báo giáo viên kiểm tra; dùng validator hiện có.
- [x] Library: lọc tiến độ thật, chip bỏ từng bộ lọc/reset; tìm kiếm cả chủ đề, tên chất.

### P2

- [x] Accent lớp 8–12 chỉ trên icon, badge và cover, không phủ màu toàn bộ trang.
- [x] Số bài đã đọc trên grade card lấy từ readingStore.
- [x] Lesson: chữ 16px, line-height rộng, mục lục active, mục lục thu gọn trên màn hình hẹp, nguồn tham khảo dễ đọc hơn.
- [x] Không thêm hiệu ứng chuyển động hoặc thư viện nặng; giữ lazy-loading phòng lab và cleanup listener/timer hiện có.
- [x] Kiểm tra ảnh desktop/tablet/mobile, overflow và các luồng chức năng.

## Hệ màu

`src/styles/tokens.css` định nghĩa các nhóm `--brand-*`, `--bg-*`, `--text-*`, `--border-*`, semantic success/warning/error/info/AI, grade accents, chart palette và lab surfaces. `workspace-theme.css` là lớp áp dụng cuối cho ứng dụng, `scientific-design.css` dùng các token tương ứng cho trang chủ.

Dashboard và quản lý dùng nền `--bg-app`, card trắng. Giáo viên có welcome gradient xanh; học sinh có welcome xanh nhạt. Tím dành cho AI và accent phù hợp; trạng thái có cả nhãn chữ. Học liệu dùng accent theo khối. Lab dùng nền ổn định, panel trắng, toolbar trung tính. WorkbenchScene đọc token cho các thành phần UI của canvas; màu vật liệu và hóa chất tiếp tục do engine/appearance quản lý.

Hàm kiểm tra: `node scripts/check-contrast.mjs`. Kết quả tại `artifacts/color-contrast.json`: 16 cặp chữ/nền được đo, đều ≥ 4.5:1, từ 4.75:1 đến 13.29:1. Đây là phạm vi cặp token đã đo, không phải tuyên bố toàn bộ DOM/canvas đạt WCAG AA. Một số màu minh họa và stylesheet lịch sử còn tồn tại; không áp dụng phép thay màu hàng loạt lên mô hình hóa học.

## File đã thay đổi

- Shared/layout: `src/main.tsx`, `src/app/App.tsx`, `src/layouts/WorkspaceLayout.tsx`, `src/shared/components/PageHeading.tsx`, `src/shared/components/Empty.tsx`.
- Component/hook mới: `ContextEmpty.tsx`, `useDialogFocus.ts`, `DashboardReports.tsx`, `reporting.ts`, `BuilderSteps.tsx`, `LabWorkflow.tsx`.
- Modules: `Classrooms.tsx`, `LibraryPage.tsx`, `ExperimentCard.tsx`, `BuilderPage.tsx`, `ReactionComposer.tsx`, `useExperiments.ts`, `MaterialsFolders.tsx`, `Materials.tsx`, `LabPage.tsx`, `WorkbenchScene.tsx`, `LiveReadout.tsx`.
- Styles: `tokens.css`, `workspace-theme.css`, `scientific-design.css`.
- QA: `scripts/check-contrast.mjs`, `tests/product-upgrade.spec.ts`; cập nhật `blue-lab.spec.ts` theo luồng xác nhận mới và thêm fixture đăng nhập cho `assembly.spec.ts`.

## Kiểm tra và giới hạn

- `npm run build`: TypeScript và Vite đạt.
- `npm test`: 9 file, 61 test đạt; bao gồm reaction authoring, simulation, thời gian, transfer, visual model, proximity và classroom state.
- Playwright: **23 test đạt** trong 1,5 phút. Các nhóm gồm auth, classrooms, blue-lab, upgrade, product-upgrade, assembly, compact-lab và redesign. Các luồng nâng cao về lắp ráp, thu khí, gia nhiệt/xúc tác và undo đều đạt sau khi fixture đăng nhập được bổ sung.
- Viewport được kiểm tra: 375, 390, 768, 1024, 1366, 1440, 1920px. Ảnh `product-lab-{width}.png`; ảnh các trang tại 390/768/1440px: `product-page-{index}-{width}.png`, `product-chapter-{width}.png`, `product-lesson-{width}.png`.
- Page index: 0 dashboard giáo viên, 1 danh sách lớp, 2 chi tiết lớp, 3 tạo bài, 4 báo cáo, 5 thư viện thí nghiệm, 6 chi tiết thí nghiệm, 7 học liệu, 8 khối lớp. Dữ liệu trong ảnh audit là fixture kiểm thử riêng, không được đưa vào ứng dụng hay dữ liệu người dùng.
- AI được kiểm tra với response mock thành công/lỗi, không xác minh Gemini thật khi máy chủ chưa có cấu hình. Không thêm AI giả vào sản phẩm.
- Pan/zoom toàn cảnh mới không được thêm vào engine. Lab tiếp tục tự scale theo chiều rộng, hỗ trợ drawer và cận cảnh; thao tác chính xác trên thiết bị cảm ứng thật còn cần kiểm tra thêm.
- Chưa có audit bằng trình đọc màn hình thực tế, Safari/iOS hoặc Android thật. Không có script lint trong package.json.
- Chưa triển khai lên hosting; không commit/push. Không thay backend hoặc hứa hẹn đồng bộ dữ liệu giữa các thiết bị.
