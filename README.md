# Virtual Lab 2D

**Reaction Studio:** [Admin](http://localhost:5173/admin/reactions/studio) · [Giáo viên](http://localhost:5173/teacher/reaction-studio). Nhập phương trình → phân tích → lưu nháp trên máy chủ → kiểm tra → preview → kiểm chứng → xuất bản hoặc tạo bài thực hành. Luồng phương trình hoạt động không cần AI key; phân tích mô tả và tạo câu hỏi bằng Gemini cần `GEMINI_API_KEY`, `GEMINI_MODEL` trong `.env.local`. Xem [triển khai, API, cấu hình và giới hạn](docs/reaction-studio.md).

Đợt hoàn thiện quản trị mới nhất: [đối chiếu yêu cầu, migration và kiểm thử](docs/admin-followup.md).

**Ảnh nhận biết hóa chất:** vào **Quản trị → Hóa chất → Chi tiết**, tải ảnh PNG/JPEG/WebP tại mục **Ảnh mô tả hóa chất**, điền chú thích và nguồn/tác giả ảnh rồi lưu. Ảnh của hóa chất đã xuất bản hiển thị trong từ điển và thông tin hóa chất ở Lab. Có thể gỡ hoặc thay ảnh; mỗi ảnh tối đa 3 MB.

**Kho hiện tượng phản ứng:** vào **Quản trị → Phản ứng & hiệu ứng → Kho hiện tượng** để tìm mẫu sinh khí, kết tủa, chất rắn tan dần, đổi màu, trung hòa, tỏa nhiệt hoặc dẫn/thu khí. Chọn **Xem mẫu** để chạy preview, hoặc **Tạo từ mẫu** để bắt đầu một phản ứng nháp. Trong form phản ứng có thể gắn nhiều hiện tượng tương thích hoặc dùng nút **Gợi ý hiện tượng theo các chất đã chọn**. Kiểm tra nguồn và xác nhận chuyên môn trước khi xuất bản. Tỏa nhiệt hiện dùng mô hình trung hòa HCl/NaOH; dẫn/thu khí cần lắp đúng bộ dụng cụ trong Lab.

## Trung tâm quản trị

Chạy `npm run dev`, mở **`http://localhost:5173/admin`** (dùng cổng Vite hiển thị nếu 5173 đã bận). Lần đầu mở tại máy chủ sẽ có biểu mẫu tạo **System Admin**; không có tài khoản hay mật khẩu mặc định. Mật khẩu cần ít nhất 12 ký tự. Sau đó đăng nhập tại `/admin/login`.

Đã tích hợp đúng bảy module: Dashboard, Hóa chất, Dụng cụ, Phản ứng & hiệu ứng, E-book, Nhà trường, Tài khoản & phân quyền. Dữ liệu quản trị, file tải lên, phiên đăng nhập và audit lưu bằng SQLite tại `.data/virtual-lab.sqlite`. Bộ dữ liệu hóa học/học liệu ban đầu lấy từ nội dung dự án; trường, người học và lượt thực hành ban đầu để trống.

- **Tạo tài khoản trường:** tạo trường → tạo School Admin/Giáo viên/Học sinh thuộc trường → chia sẻ liên kết đặt mật khẩu hiển thị một lần. Chưa tích hợp gửi email tự động. Liên kết hết hạn sau 24 giờ.
- **Phát hành nội dung:** lưu nháp, kiểm tra nguồn và preview rồi xuất bản. Hóa chất mới xuất hiện trong từ điển; mô phỏng chỉ nhận các chất và hành vi engine đã hỗ trợ. Dụng cụ dùng mẫu 2D có sẵn, cấu hình dung tích/cổng nối; ảnh tham chiếu nhận PNG/JPEG/WebP. Không nhận SVG tải lên.
- **Phản ứng:** kiểm tra công thức, cân bằng nguyên tố/điện tích và hiệu ứng tương thích. Có thể bật cấu hình bài thực hành mẫu để đưa phản ứng đã kiểm chứng vào thư viện Lab. Cân bằng phương trình không xác nhận phản ứng có thật.
- **E-book:** biên soạn chương/bài/khối nội dung, ảnh và PDF; đọc tại `/ebooks`. Liên kết mở Lab hoặc tài liệu trong tab mới để giữ tiến trình hiện tại.
- **Phạm vi:** API quản trị kiểm tra session máy chủ, vai trò và trường. Lớp/giao bài/bài nộp/chấm điểm cũ vẫn lưu trên thiết bị; chỉ metadata lớp mới và phiên có tài khoản máy chủ được đồng bộ cho quản trị. Không tự nhập số liệu cục bộ vào KPI.

Cấu hình máy chủ trong `.env.local`: `ADMIN_DB_PATH`, `ADMIN_SETUP_TOKEN` và `ADMIN_SECURE_COOKIES` (xem `.env.example`). Khi không đặt mã khởi tạo, tạo quản trị đầu tiên chỉ được chấp nhận từ loopback. Sau một reverse proxy HTTPS, bật `ADMIN_SECURE_COOKIES=1`; đặt mã khởi tạo trước khi mở hệ thống qua proxy. Không đưa các biến này vào tiền tố `VITE_`.

```bash
npm run build
npm test
npm run test:admin
```

Kiểm thử Admin dùng database riêng trong bộ nhớ ở cổng 5176 và không sửa database chính. `npm run preview` phục vụ bản build cùng API để kiểm tra cục bộ. Chỉ tải thư mục `dist` lên hosting tĩnh sẽ **không có backend**. Hướng dẫn triển khai, API, sao lưu và giới hạn nằm tại [báo cáo Admin](docs/admin-implementation.md).

## Workspace thực hành và bài giao

Xem [báo cáo kiểm tra, các giai đoạn cải tiến và giới hạn](docs/lab-improvement-audit.md).

- **Vẽ ống dẫn:** chọn công cụ, kéo từ RA đến VÀO; chọn ống để sửa điểm uốn. Giữ cách nối bằng hai lần bấm.
- **Góc nhìn:** zoom/pan/đặt lại ở góc bàn; panel cuộn riêng và mở dạng drawer trên tablet.
- **Giải thích:** chỉ mở theo yêu cầu sau khi mô hình ghi nhận phản ứng; bài giao tuân theo quyền giáo viên đặt.
- **Giao bài:** cấu hình kho hữu hạn, nồng độ, dụng cụ, thời gian, câu hỏi và rubric; cấu hình được lưu cùng bài mới.
- **Nộp/chấm:** tự lưu session và thao tác, khôi phục sau refresh; giáo viên xem timeline, chấm từng tiêu chí và xác nhận điểm chung.

Dữ liệu học tập vẫn lưu trên cùng trình duyệt. Điểm tự động chưa có xác minh máy chủ; backend Gemini hỗ trợ soạn bài; backend quản trị lưu thư viện, trường, tài khoản và thống kê phiên đã đồng bộ.

## Cấu trúc mã nguồn

```text
src/
├── app/                 # App và cấu hình route
├── features/
│   ├── auth/            # Đăng nhập, đăng ký và auth store
│   ├── classrooms/      # Lớp học, báo cáo, store và kiểm thử
│   ├── experiments/     # Trang thí nghiệm, dữ liệu, hook và component
│   ├── home/            # Homepage và animation
│   ├── lab/             # Bàn lab, component, store và style riêng
│   ├── materials/       # Học liệu, nội dung bài và trạng thái đọc
│   └── pricing/         # Gói sử dụng
├── engine/              # Logic mô phỏng độc lập với React và kiểm thử
├── layouts/             # PublicLayout, WorkspaceLayout và style layout
├── shared/components/   # Component dùng chung giữa các chức năng
├── styles/              # Style toàn cục và theme (thứ tự import tại main.tsx)
└── main.tsx             # Khởi tạo ứng dụng
server/                  # API quản trị/SQLite và Gemini cho Vite dev/preview
public/                  # Tài nguyên tĩnh
scripts/                 # Script hỗ trợ phát triển
tests/                   # Kiểm thử giao diện Playwright
```

Mỗi chức năng đặt trang, component, hook, dữ liệu và store liên quan trong cùng thư mục. Component chỉ dùng cho một chức năng nằm trong chức năng đó; component dùng chung nằm trong `shared/components`. Kiểm thử logic đặt cạnh module, kiểm thử giao diện nằm trong `tests/`. Logic hóa học trong `engine/` không phụ thuộc React.


## Giao diện thu gọn

- Đầu trang dùng một banner chung với nhãn, tiêu đề và một câu hướng dẫn; tên tài khoản và vai trò nằm trong thẻ nổi bật ở menu, hoặc thanh trên của điện thoại.
- **Tạo lớp / Tham gia lớp**, **Mã tham gia**, **Giao bài**, **Gửi tài liệu** chỉ mở biểu mẫu sau khi bấm nút. Danh sách bài nộp thu gọn; bấm **Xem & đánh giá** để chấm bài.
- **Học liệu → Khối lớp → Chương → Bài học** là các cấp thư mục riêng. **Từ điển** cũng chia thư mục dụng cụ, hóa chất và sản phẩm; mở từng mục để xem chi tiết. Có đường dẫn quay lại và mục bài đã lưu.

## Hai luồng sử dụng

- **Khám phá tự do:** mọi tài khoản học sinh hoặc giáo viên được dùng thí nghiệm miễn phí, không bắt buộc theo chương trình học. Thư viện có bộ lọc **Miễn phí / Trả phí**. Hiđro và kết tủa là bộ miễn phí ban đầu; trung hòa và oxi được phân loại trả phí. Truy cập trực tiếp phòng lab cũng kiểm tra đăng nhập và quyền sử dụng.
- **Học theo lớp:** giáo viên mở **Lớp học → Tạo lớp**, chia sẻ mã 8 ký tự. Học sinh mở **Lớp học của tôi**, nhập mã để tham gia và xem thành viên, bài được giao, tài liệu. Giáo viên giao bài từ thư viện hoặc bài tự soạn đã xuất bản, đặt hạn nộp, gửi nội dung / liên kết tài liệu. Học sinh mở bài từ lớp và bấm **Nộp bài** trong lab; bài nộp được gắn đúng lớp, bài giao và tài khoản. Giáo viên xem từng lần nộp, ghi điểm 0–10 và nhận xét; học sinh xem đánh giá ngay trong lớp. Cho phép nộp lại và ghi nhận nộp muộn.

**Giới hạn lớp học cũ:** lớp, mã tham gia, tài khoản đăng ký cục bộ và bài nộp chỉ dùng trong cùng trình duyệt / cùng nguồn web; các tab cùng nguồn cập nhật khi dữ liệu thay đổi. Các máy học sinh khác nhau chưa thể dùng chung lớp. Tài liệu lớp là nội dung và liên kết; file trong module E-book đã có lưu trữ máy chủ. Dữ liệu cũ chưa có chủ sở hữu không tự gán cho tài khoản mới. Các kiểm tra quyền phía trình duyệt của luồng cũ không thay thế xác thực máy chủ trong Admin.

**Trả phí:** đăng ký gói hiện chỉ ghi nhận yêu cầu demo, không thu tiền và không mở khóa. Chưa có giao dịch, webhook thanh toán hoặc dịch vụ kích hoạt gói. Quyền sử dụng mẫu được tách riêng theo tài khoản và hạn dùng; không có nút tự cấp quyền trong giao diện. Khi triển khai thật cần backend lưu lớp / tài khoản / bài nộp và kiểm tra gói trên máy chủ trước khi mở nội dung trả phí.

## Màn hình thí nghiệm gọn

- Trên máy tính, bàn thí nghiệm và thanh thao tác nằm trong một màn hình; kho và bảng thuộc tính cuộn riêng.
- Trên điện thoại, bấm **Hóa chất & dụng cụ** để mở kho dạng sidebar, hoặc **Thông tin / Quan sát** để xem trạng thái. Đóng bằng nút ×, chạm bên ngoài hoặc phím Escape. Thêm thành công sẽ đóng kho để trở lại bàn.
- Các đoạn giới thiệu và hướng dẫn phụ được ẩn khỏi màn hình chính. **Mục tiêu**, **Gợi ý**, **Ghi chép** vẫn mở từ thanh thao tác.

## Giao diện xanh dương & thao tác mới

- Chai hóa chất minh họa bằng SVG, nhãn công thức và trạng thái rõ ràng. Màu viền nhãn phân loại; màu dung dịch/chất rắn vẫn lấy từ mô hình hóa học.
- Bấm **Chuẩn bị nhanh** để thay toàn bộ bàn bằng bộ dụng cụ mới, đồng thời đặt lại thời gian, ghi chép và số gợi ý. Gợi ý chỉ mở khi bấm **Gợi ý**.
- **Xóa toàn bộ** ở đầu bàn hoặc **Làm lại** ở thanh trên mở hộp reset. Có thể hoàn tác sau khi xóa.
- **Tiện ích → Ống dẫn khí → Vẽ ống theo tay**: giữ và kéo từ cổng RA tới VÀO. Ống theo nét kéo, tự bắt cổng trong bán kính 100 đơn vị mô hình. Có thể giữ kéo ngay trên thân ống để uốn lại; nối bằng hai lần bấm vẫn được hỗ trợ.
- Nút, phễu và nhiệt kế tự bắt vào miệng dụng cụ phù hợp khi thả trong phạm vi 120 đơn vị. Các cổng nối theo vị trí bình.
- Chọn đèn để thấy **vùng nhiệt 2 ô** (160 đơn vị). Bật đèn để đun tất cả cốc/bình chịu nhiệt có dung dịch trong vùng; không bắt buộc lắp giá trong chế độ tương tác đơn giản này. Mô hình vẫn chặn lửa gần hiđro và đun bình kín không có đường thoát. Đây là tương tác giáo dục, không phải hướng dẫn bố trí đun ngoài đời.

## Giáo viên soạn phản ứng bằng Gemini

Vào **Tạo bài thực hành**, nhập yêu cầu và bấm **Tạo với Gemini**. Kết quả điền vào bài học và mở bảng sửa chất, hệ số, nhiệt độ tối thiểu, thời gian mô phỏng, hiện tượng, giải thích và nguồn. Giáo viên kiểm tra nguồn, xác nhận rồi lưu nháp / xem thử / xuất bản. **Tự soạn phản ứng** hoạt động ngay cả khi chưa cấu hình Gemini.

Để gọi Gemini thật, sao chép `.env.example` thành `.env.local`, điền `GEMINI_API_KEY` và `GEMINI_MODEL` với mã mô hình hỗ trợ `generateContent` của tài khoản Google AI, rồi khởi động lại `npm run dev`. Không đặt tiền tố `VITE_` cho khóa. Tham khảo [mô hình Gemini](https://ai.google.dev/gemini-api/docs/models) và [đầu ra JSON có cấu trúc](https://ai.google.dev/gemini-api/docs/structured-output).

`server/geminiPlugin.ts` phục vụ `POST /api/reaction-draft` trong Vite dev/preview; khóa chỉ được dùng tại máy chủ. Bản build tĩnh `dist` **không có API này**: khi triển khai thật cần máy chủ tương ứng cùng xác thực giáo viên và giới hạn truy cập. Đăng nhập cục bộ hiện tại không xác thực được quyền gọi API trên máy chủ. Không triển khai Vite dev như dịch vụ công khai.

Phản ứng được lưu riêng theo bài, không sửa thư viện toàn cục. Engine kiểm tra mol và điều kiện nhiệt, lưu bản quy tắc trong tiến trình để khôi phục đúng sau tải lại. Chỉ hỗ trợ các chất có sẵn trong danh mục; thiếu chất sẽ báo rõ. Kiểm tra cân bằng nguyên tử không chứng minh phản ứng có thật: bản AI cần được giáo viên đối chiếu nguồn. Hiệu ứng suy ra từ pha sản phẩm; nhiệt phản ứng mới chưa được suy diễn. Tài khoản máy chủ lưu lớp, bài giao, bài nộp và đánh giá qua SQLite; tài khoản cục bộ giữ luồng cũ. Preview của AI Reaction Creator mở chính bàn Lab trống, không tự thêm hóa chất. Xem [hướng dẫn](docs/reaction-studio.md).

Kiểm thử Gemini dùng phản hồi giả lập, không gọi dịch vụ tính phí hay xác nhận khóa thực tế.

Đợt cải tiến kho và chuyển dung dịch: xem [phân tích kiến trúc, thay đổi và giới hạn](artifacts/lab-improvements.md).
Chọn bình nguồn → chọn bình đích → nhập **Thể tích rót (mL)** → **Rót dung dịch**.
Có thể kéo bình nguồn đến gần bình khác để chọn đích. Thao tác mới tự minh họa nghiêng bình; không cần xoay nguồn trước.
Đây là gạn dung dịch đồng nhất: chất rắn lắng và khí giữ ở nguồn. Chọn bình đích rồi **Trộn & quan sát** để chạy phản ứng.

MVP phòng thí nghiệm hóa học tương tác bằng tiếng Việt cho học sinh lớp 8–12.

## Chạy ứng dụng

Cần Node.js 22.22+ (backend quản trị sử dụng `node:sqlite`).

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị (thường là http://localhost:5173).
Trên PowerShell có chặn script, dùng `npm.cmd` thay cho `npm`.

```bash
npm test
npm run build
```

Kiểm tra luồng giao diện bằng Chrome đã cài trên máy:

```bash
npx playwright test
```

Bộ kiểm thử giao diện chạy trên cổng 5174, tự mở Vite nếu cần. Ảnh kiểm tra desktop, di động và bàn lab được lưu trong `artifacts/`.

## Luồng demo

- Mặc định là **Thực hành nhanh**: bấm **Chuẩn bị thí nghiệm** để có dụng cụ và lượng chất mẫu. Với thí nghiệm khí, bấm cổng **RA** rồi cổng **VÀO**, sau đó chọn **Bắt đầu phản ứng**. Không phải giữ chuột hoặc kéo ống. Có thể hủy điểm đầu và chọn lại; kéo nối vẫn được hỗ trợ.
- Chuyển sang **Tự lắp ráp** để mở đủ dụng cụ, góc xoay và thao tác lắp ráp. Chế độ nhanh ưu tiên hóa chất/dụng cụ liên quan đến bài; cấu hình giáo viên vẫn được giữ.
- Màu biểu diễn theo chất: CuSO₄ xanh lam; Cu(OH)₂ kết tủa xanh lam; Zn xám bạc; MnO₂ nâu đen; CaCO₃ trắng. Dung dịch không màu giữ trong suốt, chỉ có nét kính/mặt khum nhẹ. Có chú giải pha lỏng, chất rắn và bọt khí; lớp kết tủa được làm rõ để dễ quan sát, không dùng đo thể tích chất rắn.
- Bài trung hòa chuẩn bị NaOH và phenolphthalein để thấy màu hồng trước. Nút **Thêm HCl & chạy** thêm lượng HCl vừa đủ rồi bắt đầu tính phản ứng; chỉ thị trở về không màu. Gói chuẩn bị nhanh được tính bằng cùng các hàm thêm chất và phản ứng như thao tác thủ công.

- Học sinh: thư viện → chi tiết → thực hành → thêm dụng cụ → chọn hóa chất → trộn → ghi chép, xác nhận phương trình → nộp bài → xem kết quả.
- Hóa chất tính theo mmol. Dung dịch mặc định 1 M: 1 mmol = 1 mL. Thử Zn 10 mmol + HCl 20 mmol; CuSO₄ 10 mmol + NaOH 20 mmol; HCl 10 mmol + NaOH 10 mmol.
- Kéo dụng cụ từ kệ hoặc bấm để thêm. Kéo bình/ống nghiệm vào vùng giá để gắn; có thể dùng danh sách dụng cụ đích và nút “Gắn”. Dùng nút góc hoặc chế độ Xoay để xoay 15° mỗi lần. Nghiêng nguồn tối thiểu 30° để rót; tháo nút và tạm dừng phản ứng trước khi chuyển chất.
- Chọn **Nối ống dẫn**, kéo từ cổng RA màu vàng đến cổng VÀO màu xanh. Cũng có thể chạm hai cổng lần lượt hoặc dùng nút nối ở bảng thuộc tính. Cổng và đường ống đi theo góc/vị trí của dụng cụ.
- Thu hiđro: gắn bình phản ứng lên giá → thêm Zn và HCl → gắn nút một lỗ → chuẩn bị bình thu đầy nước và đảo 180° → nối ống → bắt đầu phản ứng. Bộ thu khí mẫu là cấu hình gợi ý có thể chỉnh sửa; tháo nút trước khi thêm chất rồi gắn lại.
- Khí thoát ra trước khi nối đúng không thể được hồi thu bằng thao tác sau đó. Mục tiêu thu khí cần tối thiểu 1 mmol và ít nhất 50% lượng đã sinh. Bình thu đầy thì phần khí tiếp theo thoát ra ngoài.
- Gia nhiệt: đặt cốc trên chân đế hoặc bình trên giá, đặt đèn dưới đáy 55–150 đơn vị mô hình, bật đèn và chỉnh công suất. Đèn bị chặn hoặc tự tắt khi bố trí sai, bình không có giá, bình kín thiếu đường thoát, hoặc gần hệ hiđro.
- Thí nghiệm **Oxi và vai trò của xúc tác**: H₂O₂ phân hủy chậm hơn khi không có MnO₂. MnO₂ tăng tốc quy tắc này nhưng không bị tiêu thụ. Gia nhiệt/khuấy thay đổi tốc độ quy ước, không thay đổi hệ số mol hay lượng sản phẩm tối đa.
- Giáo viên: chọn vai trò ở góc phải → tạo bài thực hành hoặc dùng mẫu → lưu nháp / xem thử / xuất bản → bài xuất hiện trong thư viện → báo cáo → xuất CSV.
- Xem thử lưu bài và đưa bài vào thư viện cục bộ. Thư viện mặc định có bốn thí nghiệm cho lớp 8–10; giáo viên có thể cấu hình bài cho lớp 11–12. Điều kiện thu khí chỉ áp dụng bài tạo H₂/O₂.

## Phạm vi mô phỏng

React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, React Konva và Lucide. Engine độc lập với React nằm trong `src/engine`. Bốn phản ứng được tính theo hệ số mol và chất giới hạn. `timeSimulation.ts` cập nhật lượng chất thực trong state từng bước; `connectionLogic.ts`, `heatingLogic.ts`, `catalystLogic.ts`, `observations.ts` tách lắp ráp, nhiệt, xúc tác và nhật ký. Tổ hợp có chất phản ứng ngoài quy tắc đã xác thực được báo chưa hỗ trợ, không suy diễn sản phẩm. CaCO₃ hiện chỉ có dữ liệu học tập, chưa có quy tắc phản ứng.

Hình vẽ hoàn toàn 2D: 18 loại dụng cụ/thiết bị, xoay và gắn giá, nút/phễu/nhiệt kế gắn miệng bình, ống cong có dòng khí, ngọn lửa, mức dung dịch, kẽm tan, xúc tác rắn và kết tủa lắng. HCl/NaOH giữ không màu khi không có chỉ thị; phenolphthalein tạo màu hồng trong vùng bazơ theo mô hình lý tưởng. Giá trị lượng chất trong bảng là state hiện tại, không phải nội suy từ đáp án tính sẵn.

Tốc độ dùng thời gian cơ sở sư phạm (6–60 giây), hệ số nhiệt/khuấy/xúc tác để so sánh định tính; không phải hằng số động học thực nghiệm. Phản ứng chỉ bắt đầu khi người học chọn “Trộn & quan sát”. Có thể tạm dừng/tiếp tục, nộp kết quả một phần. Tab nền tạm dừng tích phân; tải lại trang tiếp tục từ trạng thái đã lưu, không tính tiến độ khi ứng dụng đóng. Lưu theo giây và ngay khi thay ghi chép/rời trang. Hoàn tác áp dụng thao tác người dùng, không tạo hàng trăm bản ghi theo mỗi bước thời gian.

pH chỉ ước tính hệ HCl / NaOH / NaCl / H₂O ở 25°C, có xét tự điện li của nước và bỏ qua hoạt độ; không áp dụng hệ đồng/kẽm. Nhiệt trung hòa tăng theo lượng phản ứng thực ở mỗi bước, dùng 57,3 kJ/mol và dung dịch như nước; có mô hình nhiệt vào từ đèn và tỏa nhiệt ra môi trường đơn giản. Không tính nhiệt pha loãng, nhiệt dung dụng cụ hoặc nhiệt phản ứng H₂O₂. Nhiệt độ giới hạn 98°C; sôi, bay hơi, chuyển pha và phân hủy nhiệt ngoài quy tắc **chưa hỗ trợ trong MVP**.

Khí được chia thành lượng sinh ra, thu được và thoát ra. Thu khí yêu cầu nút, đường nối, bình thu chuẩn bị đầy nước và đảo 180° ±15°. Quy đổi thể tích dùng 24,5 L/mol ở xấp xỉ 25°C/1 atm; bỏ qua độ tan khí, hơi nước và áp suất đầu nước. Nút một lỗ chưa gắn ống được xem như lỗ thông, khí thoát ra; đây không phải mô hình bình chịu áp. Khi xoay, chất lỏng là hình giản lược, không tính thủy động lực học; không cho đảo bình phản ứng còn dung dịch vượt 60°, còn bình thu được phép đảo để thu khí.

Mô tả dụng cụ, tính chất, dạng chất, khối lượng mol và lưu ý an toàn nằm trong `src/engine/catalog.ts`. Người học có thể mở thẻ thông tin ngay ở kệ hoặc từ thành phần trong bình. Nút **Quan sát cận cảnh** mở hình phóng to của dụng cụ đang chọn, sử dụng chung dữ liệu và tiến độ phản ứng với bàn lab.

## Học liệu và các gói sử dụng

- `/materials`: 15 bài tự biên soạn cho lớp 8–12, chia theo chương chủ đề tham khảo; không phải bản số hóa hoặc mục lục chính thức của một bộ SGK.
- `/materials/:lessonId`: bài đọc, công thức, mục tiêu, câu hỏi tự kiểm tra, lưu bài và đánh dấu đã đọc. Mỗi bài có thể mở thí nghiệm liên quan.
- `/materials?tab=atlas`: từ điển dụng cụ và hóa chất; có thông tin về cấu tạo, ứng dụng, hình thái và an toàn.
- `/pricing`: gói Cá nhân 30.000đ/tháng, 150.000đ/6 tháng, 250.000đ/năm; Giáo viên 40.000đ/tháng, 170.000đ/6 tháng, 270.000đ/năm; Trường học liên hệ. Đây là các mức do chủ dự án cung cấp.
- Biểu mẫu đăng ký gói và nhu cầu trường học chỉ lưu demo vào `virtual-lab-plan-requests`. Không thu tiền, không gửi email và không kích hoạt thuê bao. Không nhập thông tin thanh toán. Tiến độ đọc và bài đã lưu nằm trong `virtual-lab-reading`.

Tham khảo nội dung hóa học: [Purdue University](https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch18/complex.php), [ACS Journal of Chemical Education](https://pubs.acs.org/jceda8/article/100/12/4791/400209/Copper-Oxygen-Compounds-and-Their-Reactivity-An), [Amrita Virtual Labs](https://pcv-amrt.vlabs.ac.in/exp/calorimetry-heat-neutralization/procedure.html), [CDC/ATSDR](https://wwwn.cdc.gov/TSP/PHS/PHS.aspx?phsid=246&toxid=45). Thẻ hóa chất dẫn đến nguồn tham khảo tương ứng.

Điểm dựa trên điều kiện do giáo viên chọn: sản phẩm đích, thu khí nếu có, ghi chép tối thiểu 10 ký tự và xác nhận phương trình. Tạo khí mà không thu đúng chỉ hoàn thành một phần mục tiêu. Không chấm theo một chuỗi cố định; xác nhận kiến thức là tự đánh giá, không phải chấm tự luận tự động. Thời gian là mục tiêu gợi ý, không tự khóa bài.

Tham khảo bổ sung về xúc tác: [University of Washington – H₂O₂/MnO₂](https://chem.washington.edu/lecture-demos/decomposition-h2o2-mno2), [University of Wisconsin – Điều chế oxi](https://www2.chem.wisc.edu/deptfiles/genchem/demonstrations/Gen_Chem_Pages/1819group1-8page/preparation_oxygen.htm).

## Dữ liệu

Đăng nhập chọn vai trò là demo, không có xác thực. Dữ liệu nằm trong LocalStorage (`virtual-lab-v1`), chỉ tồn tại trên cùng trình duyệt, không đồng bộ giữa máy / học sinh. Báo cáo phân biệt dữ liệu học sinh mẫu và các lần thử thực tế. Tên lớp và tiến độ lớp trong dashboard giáo viên là dữ liệu mẫu có nhãn. Phần kết quả học sinh phản ánh các lần thực hành thực tế.

`src/features/experiments/data.ts` chứa mẫu bài, `src/features/lab/labStore.ts` là điểm nối dữ liệu có thể thay bằng API Spring Boot / MySQL sau này. Để triển khai lên static hosting, build ra `dist` và cấu hình mọi đường dẫn SPA trả về `index.html`.
