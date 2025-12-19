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
    (SoPhieu, MaPhong, TenPhong_LuuTru, NgayBatDauThue, NgayDuKienTra, TrangThaiLuuTru, GhiChu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
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
      COALESCE(pt.TenPhong_LuuTru, p.TenPhong) AS TenPhong,
      pt.NgayBatDauThue,
      pt.NgayDuKienTra,
      pt.TrangThaiLuuTru,
      pt.GhiChu,
      COALESCE(hd.TrangThaiThanhToan, 'CHUA_THANH_TOAN') AS TrangThaiThanhToan,
      kh.HoTen,
      kh.MaKH,
      kh.MaLoaiKhach,
      kh.DiaChi,
      lk.TenLoaiKhach,
      kh.CMND,
      kh.SDT
    FROM phieuthue pt
    JOIN phong p ON pt.MaPhong = p.MaPhong
    JOIN ct_phieuthue ct ON pt.SoPhieu = ct.SoPhieu
    JOIN khachhang kh ON ct.MaKH = kh.MaKH
    JOIN loaikhach lk ON kh.MaLoaiKhach = lk.MaLoaiKhach
    LEFT JOIN hoadon hd ON pt.SoPhieu = hd.SoPhieu 
    ORDER BY pt.NgayBatDauThue DESC
  `;
  return db.promise().query(sql);
};

// 6️⃣ Cập nhật phiếu thuê
exports.updatePhieu = (soPhieu, ngayDuKienTra, ghiChu) => {
  const sql = `UPDATE phieuthue SET NgayDuKienTra = ?, GhiChu = ? WHERE SoPhieu = ?`;
  return db.promise().query(sql, [ngayDuKienTra, ghiChu, soPhieu]);
};

// 7️⃣ Cập nhật thông tin khách hàng
exports.updateKhachHang = (maKH, hoTen, cmnd, sdt, diaChi, maLoaiKhach) => {
  const sql = `UPDATE khachhang SET HoTen = ?, CMND = ?, SDT = ?, DiaChi = ?, MaLoaiKhach = ? WHERE MaKH = ?`;
  return db.promise().query(sql, [hoTen, cmnd, sdt, diaChi, maLoaiKhach, maKH]);
};
