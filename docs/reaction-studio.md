# Teacher AI Reaction Creator

## Mở chức năng

- Giáo viên: `/teacher/reaction-studio`, mục **Tạo phản ứng bằng AI** trên thanh điều hướng.
- Quản trị hệ thống: `/admin/reactions/studio`.
- Cần phiên máy chủ của tài khoản giáo viên hoặc System Admin. Tài khoản Google đăng ký với vai trò giáo viên và tài khoản giáo viên được trường mời đều dùng được. Tài khoản học tập chỉ lưu cục bộ không cấp quyền API.

## Kiến trúc đã kiểm tra

Ứng dụng dùng React 19, TypeScript, React Router, Zustand; backend là Vite middleware trong `server/admin/plugin.ts`; dữ liệu máy chủ dùng SQLite qua `node:sqlite`, không có ORM. Bộ dựng hình React Konva, mô hình mol, pha, nhiệt, xúc tác, lắp ráp, Smart Snap và vẽ ống dẫn đã có sẵn.

Các mô-đun `reactionDefinition`, `reactionRules`, `timeSimulation`, `effectComposer`, `ReactionEffectLayers`, `WorkbenchScene` và `LabPage` được tái sử dụng. Preview không tạo engine hay renderer khác và không tự nạp hóa chất. Bộ tạo bài, kho, cấu hình rubric, lớp học, ghi nhật ký và chấm bài cũng được giữ lại.

`vite.config.ts` đọc `.env` / `.env.local` bằng `loadEnv` với tiền tố server. `adminPlugin` ưu tiên biến môi trường tiến trình, sau đó đưa cấu hình vào `GeminiReactionProvider`. Khóa không được đưa vào `VITE_*`, request gửi tới trình duyệt hay prompt.

## Quy trình 5 bước

1. **Nhập phản ứng:** tên tùy chọn, phương trình hoặc mô tả, lớp 8–12, mục đích, chế độ học và mức giải thích. **Phân tích bằng AI** gọi Gemini; **Phân tích phương trình** là parser xác định và tra cứu thư viện, không giả danh AI.
2. **Phân tích & chỉnh sửa:** phương trình, chất/hệ số/pha, nhiệt độ, tiếp xúc, xúc tác, quan sát, giải thích, nguồn, mục tiêu và hướng dẫn. Validator báo cân bằng, căn cứ khoa học và khả năng mô phỏng.
3. **Cấu hình thực hành:** kho và nồng độ, lượng cấp, dụng cụ, thời gian, độ khó, gợi ý, chính sách giải thích và rubric. Các hiệu ứng được suy ra từ mô hình hóa học và registry; không nhận mã hoặc renderer do AI sinh.
4. **Chạy thử trên Lab:** mở `/teacher/reaction-studio/preview/:draftId`. Backend kiểm tra quyền sở hữu và điều kiện mô phỏng rồi cấp cấu hình đã biên dịch. `StudioLabPreview` tải chính `LabPage`. Bàn khởi đầu trống; giáo viên lấy dụng cụ và chất, kéo thả, trộn, nối ống hoặc đun bằng cùng thao tác của học sinh. **Lưu lần chạy thử** ghi trạng thái, thao tác, ghi chú và phiên bản vào SQLite, sau đó quay về bản nháp.
5. **Lưu & giao bài:** thêm/sửa/xóa/duyệt câu hỏi; đối chiếu nguồn và xác nhận chuyên môn; tạo bài qua Builder hiện có hoặc chọn lớp và giao trực tiếp. Bài giao lưu bản chụp độc lập của phiên bản phản ứng, cấu hình, câu hỏi và rubric. Sửa bản nháp về sau không đổi bài đã giao.

Các bản nháp, kể cả phản ứng chưa được hỗ trợ hoặc chưa cân bằng, vẫn có thể lưu. Bản không đủ điều kiện không được preview, xuất bản hay giao như bài mô phỏng đã được xác thực.

## Gemini và giới hạn chi phí

Tạo `.env.local` ở thư mục dự án, chỉ trên máy chủ:

```dotenv
GEMINI_API_KEY=<khóa của dự án Google AI>
GEMINI_MODEL=<model đã được cấp quyền generateContent>
AI_STUDIO_DAILY_LIMIT=30
```

Khởi động lại Vite khi đổi cấu hình. Không tự đoán model mặc định; thiếu khóa hoặc model trả lỗi cấu hình rõ ràng.

Provider dùng [structured output của Gemini](https://ai.google.dev/gemini-api/docs/structured-output), JSON Schema, tối đa 4.096 output tokens, hạn 45 giây cho một yêu cầu logic. HTTP 503 được thử lại tối đa một lần trong cùng hạn đó; không tự thử lại vô hạn hoặc gọi model khác. Giao diện có thể hủy yêu cầu; nội dung nhập và bản nháp cũ được giữ khi API lỗi.

Giới hạn mặc định 30 lượt phân tích/câu hỏi mỗi tài khoản trong 24 giờ, tối đa 2 yêu cầu đồng thời, thêm rate limit theo phút. Cache đề xuất thành công trong 5 phút, tách theo tài khoản và đầu vào, tối đa 200 mục. Lượt gọi qua cache vẫn tính trong hạn mức thao tác. Không tự gửi hồ sơ học sinh vào AI.

Trong lần kiểm tra thực tế, API metadata xác nhận model cấu hình có hỗ trợ `generateContent`, nhưng lần tạo nội dung thật trả HTTP 503 do model quá tải; có lần kết nối hết thời gian. Chưa xác nhận một phản ứng Gemini thật hoàn tất thành công. Kiểm thử provider dùng dữ liệu giả lập được giới hạn trong test, không có fallback giả AI trong ứng dụng.

Có thể kiểm tra lại sau bằng `node scripts/check-reaction-studio-live.mjs`. Script dùng SQLite trong bộ nhớ và một tài khoản kiểm thử riêng; không thay đổi dữ liệu dạy học thật và không in khóa.

## Schema, khoa học và engine

`ReactionDefinition` phiên bản 1 giữ tương thích bản nháp cũ. Thêm cấu hình `simulation` tùy chọn và metadata câu hỏi: ID, loại, prompt, lựa chọn, đáp án/hướng dẫn chấm riêng, độ khó, mục tiêu, điểm gợi ý và trạng thái duyệt.

Validator kiểm tra kiểu/schema, công thức, hệ số, nguyên tố và điện tích, pha, danh mục đã xuất bản, mô hình vật chất, điều kiện nhiệt/xúc tác, kho và dụng cụ. Phương trình cân bằng không chứng minh phản ứng xảy ra. Căn cứ khoa học có ba mức: khớp thư viện, người có chuyên môn duyệt, chờ kiểm chứng. Hỗ trợ có ba mức: `SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`.

Preview yêu cầu cân bằng, engine hỗ trợ và có căn cứ khoa học. Giao bài/xuất bản còn yêu cầu người dùng xác nhận nguồn chuyên môn. Sửa định nghĩa, cấu hình hoặc câu hỏi làm mất xác nhận của bản cũ. Người dùng không thể tự sửa quy tắc hóa học trong cấu hình bài giao để giữ trạng thái xác thực cũ; backend lấy quy tắc từ bản đã kiểm chứng.

Mol, chất giới hạn, sản phẩm, chất còn dư, nhiệt độ và đường khí vẫn do engine hiện có tính. `reactionLifecycle` biểu diễn `IDLE`, `READY`, `RUNNING`, `COMPLETED`, `BLOCKED` từ vật chất/điều kiện; animation không quyết định phản ứng hóa học đã hoàn tất.

Kết tủa, bọt khí, màu và chất rắn được vẽ trong hệ tọa độ cục bộ của bình. Di chuyển bình giữ nguyên trạng thái. Dẫn khí cần kết nối hợp lệ và bình thu được chuẩn bị; có khí sinh ra không đồng nghĩa đã thu được khí.

Các chất ngoài mô hình, bay hơi/ngưng tụ/kết tinh và động học ngoài phạm vi engine không được tự suy diễn. Thời gian minh họa và mô hình nhiệt/khí giản lược không thay cho đo thực nghiệm.

## Lưu trữ, lớp học và bài nộp

Migration 7 giữ nguyên tài khoản, session, trường và lớp cũ; bổ sung mã tham gia lớp, cho phép giáo viên cá nhân không thuộc trường, thêm các bảng:

- `class_members`, `learning_assignments`, `learning_submissions`, `learning_materials`.
- `studio_experiment_templates`, `studio_trials`.

Các bảng bản nháp, phiên bản, audit và catalog cũ tiếp tục được dùng. Migration chạy trong transaction, kiểm tra foreign keys khi cần dựng lại bảng lớp.

Tài khoản máy chủ đồng bộ lớp/bài giao/bài nộp qua API. Học sinh ở trình duyệt khác tham gia bằng mã lớp, mở snapshot đã giao, thao tác trên Lab, trả lời và nộp. Máy chủ lưu lượng chất sử dụng, snapshot dụng cụ, trạng thái phản ứng, sự kiện có ý nghĩa, câu trả lời và thời gian nộp. Điểm tự luận để `null` tới khi giáo viên chấm; không chấm bằng một đáp án AI chưa được kiểm tra.

Câu hỏi AI mặc định chưa duyệt. Chỉ câu đã duyệt được đưa vào snapshot; ID/loại/lựa chọn/metadata được giữ, đáp án riêng không gửi cho học sinh. Trắc nghiệm và đúng/sai có lựa chọn trên Lab; dạng quan sát, giải thích, phương trình và tính toán dùng ô trả lời. Giáo viên xem lại bằng prompt thay vì ID.

Lớp học cục bộ cũ vẫn hoạt động cho tài khoản cục bộ. Bài Builder của tài khoản máy chủ được đưa qua cùng validator để lưu và giao; không bỏ luồng tạo thủ công/thư viện. Bàn đang làm chưa nộp vẫn được lưu dự phòng trên trình duyệt; không cung cấp đồng bộ liên tục từng thao tác khi chưa nộp.

Điểm mô hình dựa vào snapshot do trình duyệt gửi là bằng chứng hỗ trợ giáo viên, không phải cơ chế chống gian lận. Điểm cuối và nhận xét do giáo viên xác nhận.

## API chính

| Endpoint | Chức năng |
| --- | --- |
| `POST /api/teacher/reactions/analyze` | Gemini: `{input,inputType,grade}` và các thiết lập tùy chọn |
| `/api/reaction-studio/config`, `/drafts`, `/analyze` | Cấu hình công khai an toàn, danh sách và phân tích |
| `/api/reaction-studio/drafts/:id` | Đọc/lưu có version và quyền sở hữu |
| `.../:id/preview`, `/trial`, `/review`, `/questions`, `/experiment`, `/versions`, `/publish`, `/archive` | Chạy thử, ghi nhận, duyệt và xuất bài |
| `GET /api/learning/state` | Lớp, bài giao, bài nộp, tài liệu và template trong phạm vi tài khoản |
| `POST /api/learning/classes`, `/classes/join` | Tạo/tham gia lớp |
| `POST /api/learning/templates`, `/assignments`, `/submissions`, `/materials` | Lưu bài, giao bài, nộp và chia sẻ |
| `POST /api/learning/submissions/:id/review` | Giáo viên sở hữu lớp chấm bài |

Tất cả quyền được kiểm tra ở backend. Học sinh không có quyền tạo phản ứng; giáo viên không đọc/sửa bản của người khác. Lớp thuộc trường kiểm tra cùng trường; mọi bài giao và bài nộp kiểm tra chủ lớp/thành viên. POST yêu cầu cùng origin và header xác nhận của ứng dụng. API không trả stack trace hoặc secret.

## File và kiểm thử

File chính: `server/reactionStudio/{provider,validation,service,http,learning}.ts`, `server/admin/{plugin,migrations,database}.ts`, `src/engine/{reactionDefinition,reactionConfiguration,assignmentLab,timeSimulation}.ts`, `src/features/reactionStudio/*`, `src/features/classrooms/serverClassrooms.ts`, `src/features/lab/LabPage.tsx`, `AssignmentQuestions.tsx`, Builder, routes và điều hướng.

Chạy `npm test`, `npm run build`, `npm run test:admin`. Test SQLite/HTTP dùng database riêng. Test trình duyệt dùng cùng engine thật, không giả lập hiệu ứng: trộn CuSO₄/NaOH, kéo cốc sau khi tạo kết tủa, lưu trial; teacher tạo lớp/giao snapshot; student ở context khác tham gia/thực hành/trả lời/nộp; kiểm tra tải lại từ máy chủ. Có test sinh và thu khí, phản ứng chưa hỗ trợ, schema injection, giới hạn AI, retry 503, quyền sở hữu và migration giữ lớp/session cũ.
