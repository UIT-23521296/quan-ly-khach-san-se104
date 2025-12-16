const db = require("../config/db");

/* =========================
   PHIẾU THUÊ PHÒNG MODEL
   ========================= */

// 1️⃣ Thêm khách hàng
exports.insertKhachHang = (data) => {
  const sql = `
    INSERT INTO khachhang 
    (MaKH, HoTen, MaLoaiKhach, CMND, DiaChi, SDT)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  return db.promise().query(sql, data);
};

// 2️⃣ Thêm phiếu thuê
exports.insertPhieuThue = (data) => {
  const sql = `
    INSERT INTO phieuthue
    (SoPhieu, MaPhong, NgayBatDauThue, NgayDuKienTra)
    VALUES (?, ?, ?, ?)
  `;
  return db.promise().query(sql, data);
};

// 3️⃣ Gắn khách vào phiếu thuê
exports.insertCTPhieuThue = (data) => {
  const sql = `
    INSERT INTO ct_phieuthue
    (SoPhieu, MaKH)
    VALUES (?, ?)
  `;
  return db.promise().query(sql, data);
};

// 4️⃣ Cập nhật trạng thái phòng
exports.updateTinhTrangPhong = (data) => {
  const sql = `
    UPDATE phong
    SET TinhTrang = ?
    WHERE MaPhong = ?
  `;
  return db.promise().query(sql, data);
};

// 5️⃣ Lấy danh sách phiếu thuê
exports.getAll = () => {
  const sql = `
    SELECT 
      pt.SoPhieu,
      pt.MaPhong,
      p.TenPhong,
      pt.NgayBatDauThue,
      pt.NgayDuKienTra,
      kh.HoTen,
      lk.TenLoaiKhach,
      kh.CMND,
      kh.SDT
    FROM phieuthue pt
    JOIN phong p ON pt.MaPhong = p.MaPhong
    JOIN ct_phieuthue ct ON pt.SoPhieu = ct.SoPhieu
    JOIN khachhang kh ON ct.MaKH = kh.MaKH
    JOIN loaikhach lk ON kh.MaLoaiKhach = lk.MaLoaiKhach
    ORDER BY pt.NgayBatDauThue DESC
  `;
  return db.promise().query(sql);
};
