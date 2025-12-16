const phieuThueModel = require("../models/phieuthueModel");
const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// =======================
// TẠO PHIẾU THUÊ PHÒNG
// =======================
exports.createPhieuThue = async (req, res) => {
  const { MaPhong, NgayBatDauThue, NgayDuKienTra, danhSachKhach } = req.body;

  /* =======================
     1️⃣ VALIDATE CƠ BẢN
  ======================= */
  if (!MaPhong || !NgayBatDauThue || !NgayDuKienTra) {
    return res.status(400).json({
      message: "Thiếu thông tin phiếu thuê",
    });
  }

  if (!Array.isArray(danhSachKhach) || danhSachKhach.length === 0) {
    return res.status(400).json({
      message: "Chưa có khách hàng",
    });
  }

  for (const k of danhSachKhach) {
    if (!k.HoTen || !k.MaLoaiKhach || !k.CMND) {
      return res.status(400).json({
        message: "Thiếu thông tin khách bắt buộc",
      });
    }
  }

  /* =======================
     2️⃣ CHECK NGÀY THUÊ
  ======================= */
  const startDate = new Date(NgayBatDauThue);
  const endDate = new Date(NgayDuKienTra);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      message: "Ngày thuê không hợp lệ",
    });
  }

  if (startDate >= endDate) {
    return res.status(400).json({
      message: "Ngày dự kiến trả phải sau ngày bắt đầu thuê",
    });
  }

  /* =======================
     3️⃣ TRANSACTION
  ======================= */
  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    const SoPhieu = "PT" + Date.now();

    // 👉 Thêm phiếu thuê
    await conn.query(
      `
      INSERT INTO phieuthue
      (SoPhieu, MaPhong, NgayBatDauThue, NgayDuKienTra)
      VALUES (?, ?, ?, ?)
    `,
      [SoPhieu, MaPhong, NgayBatDauThue, NgayDuKienTra]
    );

    // 👉 Thêm từng khách + gắn vào phiếu thuê
    for (const k of danhSachKhach) {
      const MaKH = uuidv4();

      await conn.query(
        `
        INSERT INTO khachhang
        (MaKH, HoTen, MaLoaiKhach, CMND, DiaChi, SDT)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [MaKH, k.HoTen, k.MaLoaiKhach, k.CMND, k.DiaChi, k.SDT]
      );

      await conn.query(
        `
        INSERT INTO ct_phieuthue
        (SoPhieu, MaKH)
        VALUES (?, ?)
      `,
        [SoPhieu, MaKH]
      );
    }

    // 👉 Update trạng thái phòng
    await conn.query(
      `UPDATE phong SET TinhTrang = 'Đã thuê' WHERE MaPhong = ?`,
      [MaPhong]
    );

    await conn.commit();

    res.json({
      message: "Lập phiếu thuê phòng thành công",
      SoPhieu,
    });
  } catch (error) {
    await conn.rollback();
    console.error("❌ Lỗi tạo phiếu thuê:", error);
    res.status(500).json({
      message: "Lỗi server khi tạo phiếu thuê",
    });
  } finally {
    conn.release();
  }
};

// =======================
// LẤY DANH SÁCH PHIẾU THUÊ
// =======================
exports.getAllPhieuThue = async (req, res) => {
  try {
    const [rows] = await phieuThueModel.getAll();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Không lấy được danh sách phiếu thuê",
    });
  }
};
