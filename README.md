# Quản lý chi tiêu — Phiên bản 3.0 Premium Reports

Ứng dụng web quản lý thu chi cá nhân, thiết kế mobile-first, lưu cục bộ và hỗ trợ PWA/offline.

## Chức năng
- Dashboard: số dư, thu/chi tháng, dòng tiền 7 ngày và giao dịch gần đây.
- Thêm, sửa, xóa khoản thu và chi; danh mục mặc định.
- Tìm kiếm giao dịch theo danh mục/ghi chú; lọc theo loại và khoảng ngày.
- Thống kê cơ cấu chi tiêu, biểu đồ 7 ngày và so sánh với tháng trước.
- Báo cáo theo tháng tùy chọn: tổng thu, tổng chi, dòng tiền ròng, số lượng giao dịch và tổng hợp theo ngày.
- Xuất CSV riêng cho kỳ báo cáo, có dòng tổng hợp thu/chi/ròng.
- Ngân sách tổng tháng và ngân sách riêng theo danh mục.
- Mục tiêu tiết kiệm và ghi nhận đóng góp.
- Xuất CSV; sao lưu/khôi phục toàn bộ dữ liệu JSON.
- Lưu dữ liệu bằng localStorage; không cần tài khoản.
- PWA: manifest và service worker cache vỏ ứng dụng.

## Chạy thử trên máy tính
1. Giải nén ZIP.
2. Mở terminal tại thư mục dự án.
3. Chạy `python -m http.server 8000`.
4. Truy cập `http://localhost:8000`.

Để kiểm tra PWA/offline, phải chạy qua `localhost` hoặc HTTPS; không mở trực tiếp bằng `file://`.

## Cài trên điện thoại
Đưa thư mục lên hosting HTTPS (GitHub Pages, Netlify, Vercel...). Mở URL trên Chrome Android hoặc Safari iOS rồi chọn thêm vào màn hình chính.

## Lưu trữ và an toàn dữ liệu
- Dữ liệu được lưu trong localStorage của trình duyệt trên thiết bị hiện tại; không tự đồng bộ giữa các thiết bị.
- Xuất JSON định kỳ để sao lưu đầy đủ; CSV phù hợp cho bảng tính.
- Khôi phục JSON sẽ thay thế dữ liệu hiện tại sau khi xác nhận.
- Dữ liệu nhập được kiểm tra cấu trúc, loại giao dịch, ngày tháng và số tiền nguyên VNĐ.
- Không nhập thông tin tài khoản ngân hàng, mật khẩu hoặc dữ liệu nhạy cảm vào ghi chú.
- Xóa dữ liệu website/trình duyệt có thể làm mất dữ liệu chưa sao lưu.

## Giới hạn hiện tại
- Chưa có đăng nhập, đồng bộ đám mây, mã hóa dữ liệu hoặc nhiều ví.
- Ngân sách theo danh mục đang áp dụng theo tháng hiện tại; ngân sách tổng cũng là hạn mức tháng.
- Giao dịch tiết kiệm được theo dõi trong mục tiêu riêng, chưa tự động tạo giao dịch chuyển tiền.
- Service Worker cache tài nguyên giao diện; dữ liệu vẫn phụ thuộc bộ nhớ trình duyệt.
- Biểu đồ dùng CSS/HTML đơn giản, không cần thư viện ngoài.

## Kiểm tra nhanh sau khi cài
1. Thêm một khoản thu 1.000.000 ₫ và một khoản chi 100.000 ₫.
2. Kiểm tra số dư thay đổi ròng +900.000 ₫.
3. Đặt ngân sách tổng 500.000 ₫ và hạn mức Ăn uống 100.000 ₫.
4. Thêm khoản chi Ăn uống 120.000 ₫, kiểm tra cảnh báo vượt 20.000 ₫.
5. Tìm giao dịch theo ghi chú, lọc theo ngày.
6. Xuất JSON, xóa dữ liệu thử nghiệm rồi khôi phục để xác nhận dữ liệu được phục hồi.
7. Tắt mạng sau khi đã tải ứng dụng ít nhất một lần để kiểm tra phần giao diện offline.

## Lộ trình tiếp theo
- Giai đoạn 3: chuyển lớp lưu trữ sang IndexedDB, bổ sung nhập/xuất có kiểm soát, cải thiện cập nhật PWA và kiểm thử đa thiết bị.
- Giai đoạn 4: hoàn thiện khả năng truy cập, hiệu năng, kiểm thử dữ liệu và triển khai chính thức.


## Phiên bản 3.0 Premium Reports
- Làm mới khu vực thống kê theo phong cách premium dashboard.
- Chọn tháng lịch sử để xem KPI và bảng thu/chi/ròng theo ngày.
- Xuất báo cáo CSV theo tháng đã chọn.
- Giữ nguyên dữ liệu localStorage và các chức năng thu chi, ngân sách, tiết kiệm, sao lưu/khôi phục.
- Cập nhật cache Service Worker để trình duyệt nhận bản giao diện mới.
