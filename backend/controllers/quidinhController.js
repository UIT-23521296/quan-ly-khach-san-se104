const db = require("../config/db");

// --- 1. LOẠI PHÒNG ---
exports.getLoaiPhong = async (req, res) => {
    try {
        const sql = `
            SELECT lp.*, 
            (SELECT COUNT(*) FROM phong WHERE MaLoaiPhong = lp.MaLoaiPhong) as CoDuLieu 
            FROM loaiphong lp 
            ORDER BY lp.MaLoaiPhong
        `;
        const [rows] = await db.promise().query(sql);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createLoaiPhong = async (req, res) => {
    try {
        const { maLoai, tenLoai, donGia } = req.body;
        await db.promise().query("INSERT INTO loaiphong (MaLoaiPhong, TenLoaiPhong, DonGia) VALUES (?, ?, ?)", [maLoai, tenLoai, donGia]);
        res.json({ message: "Thêm thành công" });
    } catch (err) { res.status(500).json({ message: "Lỗi: Mã loại phòng có thể đã tồn tại" }); }
};

exports.updateLoaiPhong = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenLoai, donGia, dangSuDung } = req.body;
        await db.promise().query(
            "UPDATE loaiphong SET TenLoaiPhong = ?, DonGia = ?, DangSuDung = ? WHERE MaLoaiPhong = ?", 
            [tenLoai, donGia, dangSuDung, id]
        );
        res.json({ message: "Cập nhật thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteLoaiPhong = async (req, res) => {
    try {
        const { id } = req.params;
        // Kiểm tra xem đã có phòng nào thuộc loại này chưa
        const [check] = await db.promise().query("SELECT COUNT(*) as count FROM phong WHERE MaLoaiPhong = ?", [id]);
        
        if (check[0].count > 0) {
            return res.status(400).json({ 
                error: "DATA_EXIST", 
                message: "Không thể xóa vì đã có phòng thuộc loại này. Hãy chuyển sang 'Ngưng hoạt động'." 
            });
        }

        await db.promise().query("DELETE FROM loaiphong WHERE MaLoaiPhong = ?", [id]);
        res.json({ message: "Xóa thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- 2. LOẠI KHÁCH ---
exports.getLoaiKhach = async (req, res) => {
    try {
        const sql = `
            SELECT lk.*, 
            (SELECT COUNT(*) FROM khachhang WHERE MaLoaiKhach = lk.MaLoaiKhach) as CoDuLieu 
            FROM loaikhach lk 
            ORDER BY lk.MaLoaiKhach
        `;
        const [rows] = await db.promise().query(sql);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createLoaiKhach = async (req, res) => {
    try {
        const { maLoai, tenLoai, heSo } = req.body;
        // Mặc định DangSuDung = 1 khi tạo mới
        await db.promise().query(
            "INSERT INTO loaikhach (MaLoaiKhach, TenLoaiKhach, HeSoPhuThu, DangSuDung) VALUES (?, ?, ?, 1)", 
            [maLoai, tenLoai, heSo]
        );
        res.json({ message: "Thêm loại khách thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi: Mã loại khách có thể đã tồn tại" }); 
    }
};

exports.updateLoaiKhach = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenLoai, heSo, dangSuDung } = req.body;
        await db.promise().query(
            "UPDATE loaikhach SET TenLoaiKhach = ?, HeSoPhuThu = ?, DangSuDung = ? WHERE MaLoaiKhach = ?", 
            [tenLoai, heSo, dangSuDung, id]
        );
        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
};

exports.deleteLoaiKhach = async (req, res) => {
    try {
        const { id } = req.params;
        // Kiểm tra ràng buộc dữ liệu trước khi xóa
        const [check] = await db.promise().query("SELECT COUNT(*) as count FROM khachhang WHERE MaLoaiKhach = ?", [id]);
        
        if (check[0].count > 0) {
            return res.status(400).json({ 
                error: "DATA_EXIST", 
                message: "Không thể xóa vì đã có khách hàng thuộc loại này." 
            });
        }

        await db.promise().query("DELETE FROM loaikhach WHERE MaLoaiKhach = ?", [id]);
        res.json({ message: "Xóa thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
};

// --- 3. PHỤ THU ---
exports.getPhuThu = async (req, res) => {
    try {
        // Phụ thu thì không có bảng liên kết trực tiếp (vì lưu giá trị vào hóa đơn), 
        // nên ta giả định CoDuLieu = 0 để luôn cho phép xóa nếu muốn, 
        // hoặc bạn có thể chỉ dùng tính năng Ngưng áp dụng.
        const [rows] = await db.promise().query("SELECT * FROM tilephuthu ORDER BY KhachThu");
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updatePhuThu = async (req, res) => {
    try {
        const { khachThu, tiLe, dangSuDung } = req.body; // Thêm dangSuDung
        // Upsert cập nhật cả trạng thái
        const sql = `INSERT INTO tilephuthu (KhachThu, TiLePhuThu, DangSuDung) VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE TiLePhuThu = ?, DangSuDung = ?`;
        await db.promise().query(sql, [khachThu, tiLe, dangSuDung, tiLe, dangSuDung]);
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

// --- 4. THAM SỐ ---
exports.getThamSo = async (req, res) => {
    try { const [rows] = await db.promise().query("SELECT * FROM thamso LIMIT 1"); res.json(rows[0]); } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateThamSo = async (req, res) => {
    try {
        const { soKhachToiDa, soKhachKhongTinhPhuThu } = req.body;
        await db.promise().query("UPDATE thamso SET SoKhachToiDa = ?, SoKhachKhongTinhPhuThu = ?", [soKhachToiDa, soKhachKhongTinhPhuThu]);
        res.json({ message: "Cập nhật tham số thành công" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};