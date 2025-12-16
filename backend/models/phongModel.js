const db = require("../config/db");

exports.getAll = () => {
  const sql = `
    SELECT p.*, lp.TenLoaiPhong, lp.DonGia
    FROM PHONG p
    JOIN LOAIPHONG lp ON p.MaLoaiPhong = lp.MaLoaiPhong
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

exports.update = (data) => {
  const sql = `
    UPDATE PHONG
    SET TenPhong = ?, MaLoaiPhong = ?, TinhTrang = ?, GhiChu = ?
    WHERE MaPhong = ?
  `;
  return db.promise().query(sql, data);
};
exports.findByMaPhong = (MaPhong) => {
  const sql = `SELECT 1 FROM PHONG WHERE MaPhong = ? LIMIT 1`;
  return db.promise().query(sql, [MaPhong]);
};

exports.delete = (id) => {
  const sql = `DELETE FROM PHONG WHERE MaPhong = ?`;
  return db.promise().query(sql, [id]);
};
