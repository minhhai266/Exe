# Đăng nhập bằng Google

Ứng dụng dùng Google Identity Services với nút Google chính thức và thư viện `google-auth-library` để xác minh ID token ở máy chủ. Không cần Client Secret hoặc quyền truy cập Gmail/Drive.

## Cấu hình

1. Trong [Google Cloud Console](https://console.cloud.google.com/apis/credentials), tạo OAuth client loại **Web application** và cấu hình trang đồng ý OAuth. Nếu ứng dụng đang ở chế độ Testing, thêm tài khoản thử nghiệm được phép đăng nhập.
2. Thêm địa chỉ thực tế của ứng dụng vào **Authorized JavaScript origins**, gồm giao thức, tên miền và cổng. Ví dụ: `http://localhost:5173`, `http://localhost:5174`, `http://127.0.0.1:5174` hoặc tên miền HTTPS khi triển khai. Mỗi origin là một mục riêng, không có đường dẫn `/login`. Luồng popup hiện tại không cần redirect URI.
3. Thêm vào `.env.local` tại thư mục dự án:

   ```dotenv
   GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
   ```

4. Khởi động lại Vite. Mở `/login` hoặc `/register`. Tài khoản Google mới tại `/login` mặc định là học sinh; tại `/register` có thể chọn học sinh hoặc giáo viên trước khi bấm nút Google. Tài khoản đã tồn tại giữ nguyên vai trò.
5. Khi triển khai, chạy cả máy chủ API và dùng HTTPS; đặt `ADMIN_SECURE_COOKIES=1` khi dùng HTTPS reverse proxy. Chỉ tải thư mục `dist` lên hosting tĩnh sẽ không cung cấp API đăng nhập.

## Hành vi tài khoản

- Tài khoản Google được lưu trong SQLite cùng với liên kết bằng `sub` của Google; không lưu ID token. Phiên dùng cookie HttpOnly, SameSite=Strict, thời hạn 8 giờ.
- Mỗi lượt đăng nhập dùng nonce một lần, hết hạn sau 5 phút. Máy chủ xác minh chữ ký Google, audience, issuer, thời hạn, nonce và email đã xác minh; yêu cầu đăng nhập phải cùng nguồn.
- Tài khoản cá nhân không thuộc một trường và không có quyền quản trị trường/hệ thống. Không tự liên kết với tài khoản nhà trường hoặc quản trị có cùng email.
- Tài khoản email/mật khẩu cục bộ hiện có vẫn hoạt động độc lập; không tự chuyển lịch sử cục bộ sang một tài khoản Google mới.
- Đăng nhập cùng Google trên thiết bị khác sẽ nhận cùng ID tài khoản; các dữ liệu học tập vốn lưu trên trình duyệt vẫn nằm trên thiết bị đó.
- Thiếu Client ID hoặc không tải được Google: hiển thị trạng thái rõ ràng, giữ đăng nhập bằng mật khẩu hoạt động. Không giả lập đăng nhập thành công.

Tài liệu gốc: [xác minh ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [thiết lập Client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
