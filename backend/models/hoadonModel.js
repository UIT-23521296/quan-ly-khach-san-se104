const db = require("../config/db");


// --- HÓA ĐƠN MODEL ---
exports.createHoaDon = (data) => {
  const sql = `
    INSERT INTO hoadon (SoHoaDon, NgayLap, TenKhachHangCoQuan, DiaChi, TriGia, SoPhieu, TrangThaiThanhToan)
    VALUES (?, NOW(), ?, ?, ?, ?, 'DA_THANH_TOAN')
  `;
  return db.promise().query(sql, data);
};

// --- CHI TIẾT HÓA ĐƠN MODEL ---
exports.createCT_HoaDon = (data) => {
  const sql = `
    INSERT INTO ct_hoadon (MaCTHD, SoHoaDon, MaPhong, SoNgayThue, DonGia, SoKhach, KhachNuocNgoai, PhuThu, ThanhTien)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return db.promise().query(sql, data);
};

// --- TRUY VẤN HÓA ĐƠN ---
exports.getById = (soHoaDon) => {
  const sql = `
    SELECT 
      hd.SoHoaDon, hd.NgayLap, hd.TenKhachHangCoQuan, hd.DiaChi, hd.TriGia,
      ct.SoNgayThue, ct.DonGia, ct.SoKhach, ct.KhachNuocNgoai, ct.PhuThu, ct.ThanhTien,
      pt.TenPhong_LuuTru, pt.SoPhieu, pt.NgayBatDauThue, pt.NgayDuKienTra,
      lp.TenLoaiPhong -- Lấy thêm tên loại phòng để hiển thị cho đẹp
    FROM hoadon hd
    JOIN ct_hoadon ct ON hd.SoHoaDon = ct.SoHoaDon
    JOIN phieuthue pt ON hd.SoPhieu = pt.SoPhieu
    JOIN phong p ON pt.MaPhong = p.MaPhong
    LEFT JOIN loaiphong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
    WHERE hd.SoHoaDon = ?
  `;
  return db.promise().query(sql, [soHoaDon]);
};

// --- TRUY VẤN TẤT CẢ HÓA ĐƠN ---
exports.getAll = () => {
  const sql = `
    SELECT hd.*, pt.TenPhong_LuuTru,
      (SELECT kh.SDT FROM khachhang kh JOIN ct_phieuthue ct ON kh.MaKH = ct.MaKH WHERE ct.SoPhieu = hd.SoPhieu LIMIT 1) AS SDT
    FROM hoadon hd
    LEFT JOIN phieuthue pt ON hd.SoPhieu = pt.SoPhieu
    ORDER BY hd.NgayLap DESC
  `;
  return db.promise().query(sql);
};