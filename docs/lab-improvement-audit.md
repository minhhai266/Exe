# Kiểm tra Virtual Chemistry Lab 2D

## Kiến trúc và phạm vi

React 19, TypeScript, Vite, Zustand persist; bàn dùng React Konva. Cùng một engine phục vụ bài thư viện và bài giao. Dữ liệu lớp, tài khoản và bài làm hiện lưu tại trình duyệt; không có máy chủ xác thực/chấm điểm đáng tin cậy. Không thể bảo mật đáp án trong bundle JavaScript hoặc đồng bộ nhiều thiết bị chỉ bằng lớp UI.

## File và phân loại sau khi đọc source

| Module | File chính | Đánh giá |
|---|---|---|
| Workspace | `src/features/lab/LabPage.tsx`, `styles/lab-compact.css` | Có ba cột, drawer điện thoại; bàn còn cuộn, tablet thiếu diện tích, header nhiều hàng. Cần cải thiện. |
| Canvas | `components/WorkbenchScene.tsx` | Có click, drag, cổng click thay drag; tọa độ 1000×540 dùng chung. Chưa có zoom/pan thực. |
| Ống | `src/engine/tubeInteraction.ts` | Có nét vẽ và nối; chưa làm mượt/đơn giản hóa, chưa điều chỉnh toàn bộ nét khi đầu nối di chuyển. |
| Gắn dụng cụ | `src/engine/connectionLogic.ts` | Có nút, phễu, nhiệt kế, giá, kẹp, rack. Chỉ gắn khi thả; thiếu preview, góc gắn và kiểm tra chu trình. |
| Nhiệt/chuyển chất | `heatingLogic.ts`, `transfer.ts` | Giữ logic gia nhiệt theo khoảng cách, tự nguội, bật đèn chủ động và rót xác nhận. |
| Hóa học | `timeSimulation.ts`, `reactionRules.ts`, `appearance.ts`, `visualModel.ts` | Giữ cân bằng mol, giới hạn dung tích, điều kiện phản ứng và hiệu ứng riêng. Tốc độ/nhiệt là mô hình giảng dạy. |
| Kiến thức | `LiveReadout.tsx`, `LabDetails.tsx`, `ObservationLens.tsx` | Phương trình lộ mặc định hoặc qua catalog/lens. Cần một chính sách dùng chung. |
| Bài giao | `classroomStore.ts`, `Classrooms.tsx` | Có tạo lớp, giao bài, nộp nhiều lần, giáo viên nhận xét. Thiếu snapshot, kho hữu hạn, policy và rubric cấu hình. |
| Lưu/nhật ký | `labStore.ts`, `experimentLogger.ts` | Có autosave và undo. Nhật ký chỉ gồm câu chữ; undo đang tua ngược thời gian bài và nhật ký. Thiếu redo/session/event. |
| Báo cáo | `Classrooms.tsx`, `DashboardReports.tsx`, `reporting.ts` | Giữ danh sách bài, điểm giáo viên và CSV. Cần timeline có dữ liệu, cấu hình lịch sử và rubric minh bạch. |

## Thứ tự triển khai và kiểm thử

1. Workspace: đo vùng bàn, fit theo cả chiều rộng/cao; các panel cuộn riêng; drawer tablet. Kiểm tra 1920×1080, 1366×768, 1280×720, 1024×768.
2. Interaction: zoom/pan chuyển tọa độ thống nhất, preview snap, ống mượt/anchor, undo/redo. Kiểm tra thêm/di chuyển/nối/tháo, resize và zoom không đổi mô hình.
3. Chemistry/learning: thông tin thực tế, giải thích chủ động theo reaction extent; chặn mọi lối UI khi policy khóa. Giữ các quy tắc đã kiểm thử, không thêm hiện tượng hoặc hằng số chưa có nguồn.
4. Assignment: snapshot cấu hình, kho hữu hạn và nồng độ, dụng cụ cho phép, thời gian, câu hỏi. Kiểm tra mọi đường thêm chất, quick setup và refresh.
5. Tracking/assessment: session và sự kiện có cấu trúc, không log chuyển động chuột; rubric tách tự chấm/giáo viên, không trừ điểm mở thông tin. Kiểm tra nộp lặp, timeline và lịch sử.

## Rủi ro và nguyên tắc

- Schema lưu cũ phải tiếp tục đọc được; trường mới optional hoặc có mặc định tương thích.
- Thay viewport không đổi tọa độ dụng cụ; không che lỗi bằng overflow đơn thuần.
- Mọi shortcut thêm chất phải qua cùng kiểm tra kho; undo phải khôi phục kho nhưng không xóa dấu vết đánh giá hay tua ngược thời gian.
- Không báo hoàn thành kiểm thử giao diện khi chưa chạy; giới hạn backend phải hiển thị rõ trong tài liệu.
- Không thêm phản ứng mới trong đợt này. Nguồn khoa học có sẵn trong `catalog.ts`; các hiệu ứng vẫn chỉ dựa trên rule được hỗ trợ.

## Kết quả triển khai theo giai đoạn

1. **Workspace:** bàn fit theo cả hai chiều bằng `ResizeObserver`; hình học vẫn ở hệ 1000×540. Hai panel cuộn riêng, tablet dưới 1101px dùng drawer có focus trap/Escape. Thu gọn panel chuyển vào toolbar bàn. Thêm điều khiển zoom, pan và đặt lại góc nhìn.
2. **Interaction:** nút Vẽ ống tạo ống ngay; nét được đơn giản hóa và làm mượt; vùng hút hiển thị cổng đích hợp lệ. Có tay nắm sửa điểm uốn. Khi di chuyển bình, độ dịch chuyển hai đầu được phân bố dọc đường ống. Giữ phương án nối hai cổng bằng bàn phím/click. Preview snap chỉ gắn khi thả; góc nút đi theo bình và các dụng cụ con đi theo vị trí gắn cuối. Có Undo/Redo; thời gian và sự kiện đánh giá không bị tua ngược.
3. **Chemistry:** tái sử dụng cân bằng mol, dung tích, nhiệt, xúc tác và các hiệu ứng hiện có. Phương trình chỉ xuất hiện theo yêu cầu sau khi phản ứng thực sự có tiến độ. Bỏ đáp án tự hiện ở notes/lens; catalog áp dụng cùng chính sách. Mô tả quan sát oxi không khẳng định có MnO₂ khi học sinh chưa thêm xúc tác.
4. **Learning:** có sensor, thông tin chất/dụng cụ, giải thích, vai trò và điều kiện; phần kiến thức mở rộng thu gọn. Có tạm dừng toàn mô phỏng và hệ số tốc độ; đồng hồ làm bài chạy riêng theo thời gian thực. Lịch sử học tập và kết quả cũ tiếp tục hoạt động.
5. **Assignment:** form giao bài cấu hình lớp, mục tiêu, hóa chất, nồng độ, lượng, dụng cụ, thời gian, quyền gợi ý/giải thích và câu hỏi. Bài mới lưu snapshot độc lập. Click và drag thêm chất đi qua cùng kiểm tra kho; chuẩn bị bình thu cũng trừ nước. Tắt shortcut cấp miễn phí trong bài giao. Reset không hồi kho hoặc thời gian; `new=1` không tạo lại kho bài giao. Autosave khôi phục session, câu trả lời và kho.
6. **Assessment:** sự kiện có ID/session/schema/thời gian/dữ liệu đối tượng, chống trùng ID; ghi hành động hoàn tất thay vì mọi chuyển động chuột. Có rubric sản phẩm/thu khí/liều lượng với sai số, phần tự chấm và phần giáo viên tách biệt. Giáo viên nhập điểm từng tiêu chí, điền tổng hoặc điều chỉnh điểm chung; giới hạn trọng số được kiểm tra. Bài nộp lưu clone dữ liệu, cùng request không nộp trùng. Timeline hiển thị lần thử, hóa chất, phản ứng, mở thông tin/gợi ý và câu trả lời. CSV bổ sung thời gian, số lần thử, kho đã dùng và điểm tự động tạm tính.

### Module bổ sung

- `src/engine/assignmentLab.ts`: cấu hình, kho, chuyển đơn vị, rubric.
- `src/engine/labSession.ts`: session và sự kiện có cấu trúc.
- `src/engine/learningPolicy.ts`: quyền xem và chọn phản ứng thực tế.
- `src/engine/tubeGeometry.ts`: đơn giản hóa nét, biến dạng theo anchor, điểm uốn.
- `src/features/classrooms/AssignmentConfigEditor.tsx`: cấu hình bài giao.
- `src/features/classrooms/PracticeTimeline.tsx`: báo cáo học tập dùng chung ở bài nộp/kết quả.

### Giới hạn còn lại

- Đây vẫn là ứng dụng lưu ở trình duyệt. `server/geminiPlugin.ts` chỉ hỗ trợ soạn phản ứng, không phải backend xác thực hoặc lưu bài. Chưa có đồng bộ lớp trên nhiều thiết bị, bảo mật đáp án trong bundle hoặc xác minh bằng chứng chấm điểm tại máy chủ. Điểm tự động là gợi ý, điểm giáo viên là kết quả xác nhận.
- Bài cũ chưa lưu snapshot được áp dụng kho mặc định từ nội dung hiện có khi mở; không thể khôi phục chính xác cấu hình quá khứ chưa từng được lưu. Bài mới lưu snapshot tại lúc giao.
- Ống đang hỗ trợ **khí qua ống mềm**. Đã có hợp đồng cổng khí ra/vào và trạng thái chiếm dụng; chưa mô phỏng thủy lực trong ống chất lỏng hoặc cơ học ống thủy tinh cứng. Chuyển dung dịch vẫn là thao tác rót có xác nhận.
- Nhiệt, tốc độ, thể tích khí và pH vẫn là mô hình giáo dục giản lược; không bổ sung bay hơi/sôi, áp suất, cân bằng phức tạp hoặc phản ứng ngoài danh mục để tạo hiệu ứng giả.
- Timeline ghi các lần thử và kết quả có dữ liệu; chưa phải video replay hoặc bộ tái dựng toàn bộ trạng thái từng khung hình.

### Đối chiếu khoa học

- Phản ứng H₂O₂ và vai trò xúc tác MnO₂: [University of Washington](https://chem.washington.edu/lecture-demos/decomposition-h2o2-mno2).
- Kim loại với axit và khí hiđro: [University of Washington](https://chem.washington.edu/lecture-demos/metals-acid).
- Kết tủa Cu(OH)₂ xanh khi phối hợp CuSO₄/NaOH: [University of Wisconsin–Madison](https://www2.chem.wisc.edu/deptfiles/genchem/lab/ccaold/main/naoh/page1.htm).

Các nguồn dùng kiểm tra hiện tượng và vai trò; không dùng thí nghiệm biểu diễn để suy diễn hằng số tốc độ hoặc thông số định lượng cho engine.

## Kết quả kiểm tra

| Lệnh / phạm vi | Kết quả |
|---|---|
| Baseline trước khi sửa: `npm.cmd test` | 61/61 đạt |
| Bản cuối: `npm.cmd test` | 70/70 đạt, 10 file test |
| Bản cuối: `npm.cmd run build` | TypeScript và Vite build đạt |
| `npx.cmd playwright test --reporter=list` trước bổ sung xử lý hết giờ | 40/40 đạt |
| Sau bổ sung hết giờ và kiểm tra chấm từng tiêu chí: `npx.cmd playwright test tests/lab-improvements.spec.ts tests/classrooms.spec.ts --reporter=list` | 9/9 đạt, gồm test hết giờ mới |

Các trường hợp đã chạy bằng trình duyệt: thêm dụng cụ/chất, tự gắn giá/nút, vẽ ống bằng chuột, kéo bình sau khi nối, tháo ống, dẫn/thu khí, gia nhiệt, xúc tác, chuyển dung dịch, zoom/pan/resize, Undo/Redo, giải thích chủ động, kho hữu hạn, refresh, giao/nộp/chấm bài theo rubric, CSV và quyền thành viên. Kiểm tra viewport ở 1920×1080, 1366×768, 1280×720, tablet 1024×768 và drawer điện thoại 390×844. Có ảnh trong `artifacts/lab-viewport-*.png`, `artifacts/lab-drawn-tube.png`, `artifacts/class-submissions-desktop.png`.

Hết giờ: phản ứng đang chạy chuyển sang tạm dừng, đèn tắt, giữ nguyên lượng đã phản ứng, không chặn lưu câu trả lời/nộp bài. Refresh giữ trạng thái và chỉ có một sự kiện `TIME_LIMIT_REACHED` cho phiên.

Các test cũ được cập nhật theo hệ tọa độ fit hai chiều, nét ống đã đơn giản hóa, đăng nhập hiện có, nút thu gọn panel, chính sách mở giải thích và việc khôi phục draft giữa các lần mở trang. Không bỏ qua test để che lỗi. API Gemini trong test vẫn dùng fixture, không xác nhận kết nối dịch vụ tính phí.
