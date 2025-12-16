// const db = require("../config/db");

// exports.getAll = () => {
//   const sql = `
//     SELECT MaLoaiKhach, TenLoaiKhach, HeSoPhuThu
//     FROM loaikhach
//   `;
//   return db.promise().query(sql);
// };
const db = require("../config/db");

exports.getAll = () => {
  const sql = "SELECT * FROM loaikhach";
  return db.promise().query(sql);
};
