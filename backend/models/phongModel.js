const db = require("../config/db");

exports.getAll = () => {
  const sql = `
    SELECT 
        p.*, 
        lp.TenLoaiPhong, 
        lp.DonGia,
        lp.DangSuDung AS TrangThaiLoaiPhong, 
        pt.NgayBatDauThue,
        pt.NgayDuKienTra,
        (SELECT COUNT(*) FROM phieuthue WHERE MaPhong = p.MaPhong) AS CoLichSu,
        (SELECT kh.HoTen FROM khachhang kh JOIN ct_phieuthue ct ON kh.MaKH = ct.MaKH WHERE ct.SoPhieu = pt.SoPhieu LIMIT 1) AS TenKhach,
        (SELECT kh.SDT FROM khachhang kh JOIN ct_phieuthue ct ON kh.MaKH = ct.MaKH WHERE ct.SoPhieu = pt.SoPhieu LIMIT 1) AS SDTKhach
    FROM PHONG p
    JOIN LOAIPHONG lp ON p.MaLoaiPhong = lp.MaLoaiPhong
    LEFT JOIN PHIEUTHUE pt ON p.MaPhong = pt.MaPhong AND pt.TrangThaiLuuTru = 'DANG_THUE'
  `;
  return db.promise().query(sql);
};

exports.create = (data) => {
  const sql = `
    INSERT INTO PHONG (MaPhong, TenPhong, MaLoaiPhong, TinhTrang, GhiChu)
    VALUES (?, ?, ?, ?, ?)
  `;
  return db.promise().query(sql, data);
};

// Cập nhật thông tin phòng (không bao gồm tên phòng)
exports.updateInfo = (tenPhong, maLoaiPhong, ghiChu, maPhong) => {
  const sql = `UPDATE PHONG SET TenPhong = ?, MaLoaiPhong = ?, GhiChu = ? WHERE MaPhong = ?`;
  return db.promise().query(sql, [tenPhong, maLoaiPhong, ghiChu, maPhong]);
};

// Hàm riêng để cập nhật trạng thái (Dùng cho Bảo trì)
exports.updateStatus = (tinhTrang, maPhong) => {
  const sql = `UPDATE PHONG SET TinhTrang = ? WHERE MaPhong = ?`;
  return db.promise().query(sql, [tinhTrang, maPhong]);
};

exports.findByMaPhong = (MaPhong) => {
  const sql = `SELECT 1 FROM PHONG WHERE MaPhong = ? LIMIT 1`;
  return db.promise().query(sql, [MaPhong]);
};

exports.delete = (id) => {
  const sql = `DELETE FROM PHONG WHERE MaPhong = ?`;
  return db.promise().query(sql, [id]);
};
