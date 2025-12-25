const db = require("../config/db");

// --- 1. LOẠI PHÒNG ---
exports.getLoaiPhong = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM loaiphong ORDER BY MaLoaiPhong");
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createLoaiPhong = async (req, res) => {
    try {
        const { maLoai, tenLoai, donGia } = req.body;
        // --- SỬA: Bỏ cột DangSuDung trong câu INSERT ---
        await db.promise().query(
            "INSERT INTO loaiphong (MaLoaiPhong, TenLoaiPhong, DonGia) VALUES (?, ?, ?)", 
            [maLoai, tenLoai, donGia]
        );
        res.json({ message: "Thêm thành công" });
    } catch (err) { res.status(500).json({ message: "Lỗi: Mã loại phòng có thể đã tồn tại" }); }
};

// ... (Hàm updateLoaiPhong, deleteLoaiPhong GIỮ NGUYÊN) ...
exports.updateLoaiPhong = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenLoai, donGia } = req.body;
        await db.promise().query("UPDATE loaiphong SET TenLoaiPhong = ?, DonGia = ? WHERE MaLoaiPhong = ?", [tenLoai, donGia, id]);
        res.json({ message: "Cập nhật thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteLoaiPhong = async (req, res) => {
    try {
        const { id } = req.params;
        const [check] = await db.promise().query("SELECT COUNT(*) as count FROM phong WHERE MaLoaiPhong = ?", [id]);
        if (check[0].count > 0) return res.status(400).json({ message: `Không thể xóa: Đang có ${check[0].count} phòng thuộc loại này.` });
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
        // --- SỬA: Bỏ cột DangSuDung ---
        await db.promise().query(
            "INSERT INTO loaikhach (MaLoaiKhach, TenLoaiKhach, HeSoPhuThu) VALUES (?, ?, ?)", 
            [maLoai, tenLoai, heSo]
        );
        res.json({ message: "Thêm thành công" });
    } catch (err) { res.status(500).json({ message: "Lỗi: Mã loại khách có thể đã tồn tại" }); }
};

// ... (Hàm updateLoaiKhach, deleteLoaiKhach GIỮ NGUYÊN) ...
exports.updateLoaiKhach = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenLoai, heSo } = req.body;
        await db.promise().query("UPDATE loaikhach SET TenLoaiKhach = ?, HeSoPhuThu = ? WHERE MaLoaiKhach = ?", [tenLoai, heSo, id]);
        res.json({ message: "Cập nhật thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteLoaiKhach = async (req, res) => {
    try {
        const { id } = req.params;
        const [check] = await db.promise().query("SELECT COUNT(*) as count FROM khachhang WHERE MaLoaiKhach = ?", [id]);
        if (check[0].count > 0) return res.status(400).json({ message: `Không thể xóa: Đang có khách hàng thuộc loại này.` });
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
        // --- SỬA: Bỏ cột DangSuDung ---
        const sql = `INSERT INTO tilephuthu (KhachThu, TiLePhuThu) VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE TiLePhuThu = ?`;
        await db.promise().query(sql, [khachThu, tiLe, tiLe]);
        res.json({ message: "Lưu thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deletePhuThu = async (req, res) => {
    try {
        const { id } = req.params;
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