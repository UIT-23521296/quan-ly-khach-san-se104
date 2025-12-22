const db = require("../config/db");
const hoadonModel = require("../models/hoadonModel");
const { v4: uuidv4 } = require("uuid");

// --- HÀM LOGIC TÍNH TIỀN TRUNG TÂM ---
const calculateBill = async (soPhieu) => {
    // 1. Lấy thông tin phiếu & Tham số quy định (Giữ nguyên)
    const sqlBase = `
        SELECT pt.SoPhieu, pt.MaPhong, pt.NgayBatDauThue, pt.NgayDuKienTra, 
               p.TenPhong, lp.DonGia, lp.TenLoaiPhong,
               ts.SoKhachKhongTinhPhuThu, -- VD: 2
               (SELECT HoTen FROM khachhang WHERE MaKH = (SELECT MaKH FROM ct_phieuthue WHERE SoPhieu = pt.SoPhieu LIMIT 1)) as TenKhachDaiDien,
               (SELECT DiaChi FROM khachhang WHERE MaKH = (SELECT MaKH FROM ct_phieuthue WHERE SoPhieu = pt.SoPhieu LIMIT 1)) as DiaChi
        FROM phieuthue pt
        JOIN phong p ON pt.MaPhong = p.MaPhong
        JOIN loaiphong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
        CROSS JOIN thamso ts 
        WHERE pt.SoPhieu = ?
    `;
    
    const [rows] = await db.promise().query(sqlBase, [soPhieu]);
    if (rows.length === 0) throw new Error("Phiếu thuê không tồn tại");
    const data = rows[0];

    // 2. Đếm số khách thực tế
    const sqlKhach = `
        SELECT lk.MaLoaiKhach, lk.HeSoPhuThu 
        FROM ct_phieuthue ct
        JOIN khachhang kh ON ct.MaKH = kh.MaKH
        JOIN loaikhach lk ON kh.MaLoaiKhach = lk.MaLoaiKhach
        WHERE ct.SoPhieu = ?
    `;
    const [dsKhach] = await db.promise().query(sqlKhach, [soPhieu]);
    const soLuongKhach = dsKhach.length;

    // 3. Tính số ngày
    const ngayBatDau = new Date(data.NgayBatDauThue);
    const ngayKetThuc = data.NgayDuKienTra ? new Date(data.NgayDuKienTra) : new Date(); 
    let soNgay = Math.ceil((Math.abs(ngayKetThuc - ngayBatDau)) / (1000 * 60 * 60 * 24));
    if (soNgay <= 0) soNgay = 1;

    // --- 4. Tính tiền ---
    
    // A. Hệ số khách nước ngoài
    let heSoKhach = 1.0;
    if (dsKhach.length > 0) {
        heSoKhach = Math.max(...dsKhach.map(k => k.HeSoPhuThu));
    }

    // B. Phụ thu số lượng khách (TRA BẢNG TRỰC TIẾP)
    let tiLePhuThu = 0;
    const soKhachMienPhi = data.SoKhachKhongTinhPhuThu; // VD: 2
    const soKhachDuRa = soLuongKhach - soKhachMienPhi;  // VD: 4 - 2 = 2 khách dư

    if (soKhachDuRa > 0) {
        // Query trực tiếp: "Nếu dư X người thì tỉ lệ là bao nhiêu?"
        const [resTiLe] = await db.promise().query(
            "SELECT TiLePhuThu FROM tilephuthu WHERE KhachThu = ?", 
            [soKhachDuRa]
        );
        
        if (resTiLe.length > 0) {
            // Trường hợp 1: Có trong bảng (VD: dư 1 hoặc 2 người)
            tiLePhuThu = parseFloat(resTiLe[0].TiLePhuThu);
        } else {
            // Trường hợp 2: Số khách dư vượt quá bảng (VD: dư 5 người mà bảng chỉ có 2 dòng)
            // Lấy dòng có KhachThu lớn nhất làm mốc (hoặc bạn có thể return lỗi)
            const [maxRes] = await db.promise().query(
                "SELECT TiLePhuThu FROM tilephuthu ORDER BY KhachThu DESC LIMIT 1"
            );
            if (maxRes.length > 0) {
                tiLePhuThu = parseFloat(maxRes[0].TiLePhuThu);
            }
        }
    }

    // 5. Tính tổng tiền
    const donGia = parseFloat(data.DonGia);
    const thanhTien = (donGia * soNgay * (1 + tiLePhuThu)) * heSoKhach;

    return {
        ...data,
        SoNgay: soNgay,
        SoKhach: soLuongKhach,
        TiLePhuThu: tiLePhuThu, 
        HeSoKhach: heSoKhach,
        ThanhTien: Math.round(thanhTien)
    };
};

// API 1: Preview hóa đơn (Để hiện lên Modal)
exports.previewHoaDon = async (req, res) => {
    try {
        const bill = await calculateBill(req.params.soPhieu);
        res.json(bill);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// API 2: Thanh toán & Lưu DB
exports.createAndPay = async (req, res) => {
    const { soPhieu, tienKhachDua } = req.body; // Chỉ cần nhận tiền khách đưa
    const conn = await db.promise().getConnection();
    
    try {
        await conn.beginTransaction();

        // Tính lại lần cuối để chốt số liệu
        const bill = await calculateBill(soPhieu);
        
        // Tạo mã hóa đơn
        const soHoaDon = "HD" + Date.now();

        // 1. Insert Hóa Đơn
        await conn.query(
            `INSERT INTO hoadon (SoHoaDon, NgayLap, TenKhachHangCoQuan, DiaChi, TriGia, SoPhieu, TrangThaiThanhToan)
             VALUES (?, NOW(), ?, ?, ?, ?, 'DA_THANH_TOAN')`,
            [soHoaDon, bill.TenKhachDaiDien, bill.DiaChi, bill.ThanhTien, soPhieu]
        );

        // 2. Insert Chi Tiết Hóa Đơn
        const maCTHD = uuidv4();
        await conn.query(
            `INSERT INTO ct_hoadon (MaCTHD, SoHoaDon, MaPhong, SoNgayThue, DonGia, SoKhach, KhachNuocNgoai, PhuThu, ThanhTien)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                maCTHD, 
                soHoaDon, 
                bill.MaPhong, 
                bill.SoNgay, 
                bill.DonGia, 
                bill.SoKhach, 
                bill.HeSoKhach > 1 ? 1 : 0, // 1 là có khách NN, 0 là không
                bill.TiLePhuThu, 
                bill.ThanhTien
            ]
        );

        // 3. Update Phiếu Thuê -> Đã thanh toán, set ngày trả thực tế là NOW()
        await conn.query(
            "UPDATE phieuthue SET TrangThaiLuuTru = 'DA_THANH_TOAN', NgayDuKienTra = NOW() WHERE SoPhieu = ?", 
            [soPhieu]
        );

        // 4. Update Phòng -> Trống
        await conn.query("UPDATE phong SET TinhTrang = 'Trống' WHERE MaPhong = ?", [bill.MaPhong]);

        await conn.commit();
        res.json({ message: "Thanh toán thành công!", soHoaDon });

    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: "Lỗi thanh toán: " + err.message });
    } finally {
        conn.release();
    }
};

// API 3: Lấy danh sách hóa đơn
exports.getAllHoaDon = async (req, res) => {
    try {
        const [rows] = await hoadonModel.getAll();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// API 4: Lấy chi tiết hóa đơn theo Số Hóa Đơn
exports.getHoaDonDetail = async (req, res) => {
  try {
    const { soHoaDon } = req.params;
    const [rows] = await hoadonModel.getById(soHoaDon);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// API 5: Xóa hóa đơn (Xóa chi tiết trước -> Xóa hóa đơn sau)
exports.deleteHoaDon = async (req, res) => {
    const { soHoaDon } = req.params;
    const conn = await db.promise().getConnection();

    try {
        await conn.beginTransaction();

        // 1. Xóa Chi Tiết Hóa Đơn trước (Do ràng buộc khóa ngoại)
        await conn.query("DELETE FROM ct_hoadon WHERE SoHoaDon = ?", [soHoaDon]);

        // 2. Xóa Hóa Đơn
        const [result] = await conn.query("DELETE FROM hoadon WHERE SoHoaDon = ?", [soHoaDon]);

        if (result.affectedRows === 0) {
            // Nếu không xóa được dòng nào (ID không tồn tại)
            await conn.rollback();
            return res.status(404).json({ message: "Hóa đơn không tồn tại" });
        }

        await conn.commit();
        res.json({ message: "Xóa hóa đơn thành công!" });

    } catch (err) {
        await conn.rollback();
        console.error("Lỗi xóa hóa đơn:", err);
        res.status(500).json({ message: "Lỗi server: " + err.message });
    } finally {
        conn.release();
    }
};