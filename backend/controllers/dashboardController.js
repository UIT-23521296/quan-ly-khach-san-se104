const db = require("../config/db");

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Thống kê số lượng phòng theo tình trạng
        // Dựa vào bảng 'phong'
        const [roomStats] = await db.promise().query(`
            SELECT TinhTrang, COUNT(*) as SoLuong 
            FROM phong 
            GROUP BY TinhTrang
        `);

        // 2. Thống kê Doanh thu (Hôm nay & Tháng này)
        // Dựa vào bảng 'hoadon'
        const [revenueStats] = await db.promise().query(`
            SELECT 
                SUM(CASE WHEN NgayLap = CURDATE() THEN TriGia ELSE 0 END) as DoanhThuNgay,
                SUM(CASE WHEN MONTH(NgayLap) = MONTH(CURRENT_DATE()) AND YEAR(NgayLap) = YEAR(CURRENT_DATE()) THEN TriGia ELSE 0 END) as DoanhThuThang
            FROM hoadon
        `);

        // 3. Tổng số khách hàng
        // Dựa vào bảng 'khachhang'
        const [custStats] = await db.promise().query("SELECT COUNT(*) as TongKhach FROM khachhang");

        // 4. Lấy 5 hóa đơn mới nhất
        const [recentInvoices] = await db.promise().query(`
            SELECT SoHoaDon, TenKhachHangCoQuan, NgayLap, TriGia 
            FROM hoadon 
            ORDER BY NgayLap DESC, SoHoaDon DESC 
            LIMIT 5
        `);

        // Chuẩn hóa dữ liệu phòng (đảm bảo luôn có đủ key dù DB chưa có dữ liệu)
        const statusMap = { 'Trống': 0, 'Đã thuê': 0, 'Bảo trì': 0, 'Ngưng kinh doanh': 0 };
        roomStats.forEach(item => {
            if (statusMap.hasOwnProperty(item.TinhTrang)) {
                statusMap[item.TinhTrang] = item.SoLuong;
            }
        });

        // Trả về JSON tổng hợp
        res.json({
            rooms: statusMap,
            revenue: {
                today: revenueStats[0].DoanhThuNgay || 0,
                month: revenueStats[0].DoanhThuThang || 0
            },
            totalCustomers: custStats[0].TongKhach,
            recentInvoices
        });

    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).json({ message: "Lỗi lấy dữ liệu thống kê" });
    }
};