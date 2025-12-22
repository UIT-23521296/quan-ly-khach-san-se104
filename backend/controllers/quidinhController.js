const db = require("../config/db");

// --- 1. LOẠI PHÒNG ---
exports.getLoaiPhong = async (req, res) => {
    try {
        // Không cần lấy cột CoDuLieu để ẩn hiện nút nữa, vì nút Xóa luôn hiện
        const [rows] = await db.promise().query("SELECT * FROM loaiphong ORDER BY MaLoaiPhong");
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createLoaiPhong = async (req, res) => {
    try {
        const { maLoai, tenLoai, donGia } = req.body;
        // Mặc định DangSuDung = 1 (nếu DB yêu cầu)
        await db.promise().query("INSERT INTO loaiphong (MaLoaiPhong, TenLoaiPhong, DonGia, DangSuDung) VALUES (?, ?, ?, 1)", [maLoai, tenLoai, donGia]);
        res.json({ message: "Thêm thành công" });
    } catch (err) { res.status(500).json({ message: "Lỗi: Mã loại phòng có thể đã tồn tại" }); }
};

exports.updateLoaiPhong = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenLoai, donGia } = req.body;
        // Chỉ cập nhật Tên và Đơn giá
        await db.promise().query(
            "UPDATE loaiphong SET TenLoaiPhong = ?, DonGia = ? WHERE MaLoaiPhong = ?", 
            [tenLoai, donGia, id]
        );
        res.json({ message: "Cập nhật thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteLoaiPhong = async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Kiểm tra ràng buộc khóa ngoại (Bảng Phong)
        const [check] = await db.promise().query("SELECT COUNT(*) as count FROM phong WHERE MaLoaiPhong = ?", [id]);
        
        if (check[0].count > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa: Đang có ${check[0].count} phòng thuộc loại này. Vui lòng xóa các phòng đó trước.` 
            });
        }

        // 2. Nếu không có ràng buộc -> Xóa
        await db.promise().query("DELETE FROM loaiphong WHERE MaLoaiPhong = ?", [id]);
        res.json({ message: "Xóa thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- 2. LOẠI KHÁCH ---
exports.getLoaiKhach = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM loaikhach ORDER BY MaLoaiKhach");
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createLoaiKhach = async (req, res) => {
    try {
        const { maLoai, tenLoai, heSo } = req.body;
        await db.promise().query(
            "INSERT INTO loaikhach (MaLoaiKhach, TenLoaiKhach, HeSoPhuThu, DangSuDung) VALUES (?, ?, ?, 1)", 
            [maLoai, tenLoai, heSo]
        );
        res.json({ message: "Thêm thành công" });
    } catch (err) { res.status(500).json({ message: "Lỗi: Mã loại khách có thể đã tồn tại" }); }
};

exports.updateLoaiKhach = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenLoai, heSo } = req.body;
        await db.promise().query(
            "UPDATE loaikhach SET TenLoaiKhach = ?, HeSoPhuThu = ? WHERE MaLoaiKhach = ?", 
            [tenLoai, heSo, id]
        );
        res.json({ message: "Cập nhật thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteLoaiKhach = async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Kiểm tra ràng buộc (Bảng KhachHang)
        const [check] = await db.promise().query("SELECT COUNT(*) as count FROM khachhang WHERE MaLoaiKhach = ?", [id]);
        
        if (check[0].count > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa: Đang có ${check[0].count} khách hàng thuộc loại này trong lịch sử.` 
            });
        }

        await db.promise().query("DELETE FROM loaikhach WHERE MaLoaiKhach = ?", [id]);
        res.json({ message: "Xóa thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- 3. PHỤ THU ---
exports.getPhuThu = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM tilephuthu ORDER BY KhachThu");
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updatePhuThu = async (req, res) => {
    try {
        const { khachThu, tiLe } = req.body;
        // Dùng ON DUPLICATE KEY UPDATE để vừa Thêm vừa Sửa
        const sql = `INSERT INTO tilephuthu (KhachThu, TiLePhuThu, DangSuDung) VALUES (?, ?, 1) 
                     ON DUPLICATE KEY UPDATE TiLePhuThu = ?`;
        await db.promise().query(sql, [khachThu, tiLe, tiLe]);
        res.json({ message: "Lưu thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deletePhuThu = async (req, res) => {
    try {
        const { id } = req.params;
        // Phụ thu thường ít ràng buộc cứng (vì giá trị copy vào hóa đơn), nhưng nếu muốn chắc chắn thì xóa thẳng.
        await db.promise().query("DELETE FROM tilephuthu WHERE KhachThu = ?", [id]);
        res.json({ message: "Xóa thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- 4. THAM SỐ (GIỮ NGUYÊN) ---
exports.getThamSo = async (req, res) => {
    try { const [rows] = await db.promise().query("SELECT * FROM thamso LIMIT 1"); res.json(rows[0]); } 
    catch (err) { res.status(500).json({ message: err.message }); }
};
exports.updateThamSo = async (req, res) => {
    try {
        const { SoKhachToiDa, SoKhachKhongTinhPhuThu } = req.body;
        await db.promise().query("UPDATE thamso SET SoKhachToiDa = ?, SoKhachKhongTinhPhuThu = ?", [SoKhachToiDa, SoKhachKhongTinhPhuThu]);
        res.json({ message: "Cập nhật tham số thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};