const db = require("../config/db");

const User = {
  // Tìm user theo username
  findByUsername: (username, callback) => {
    const sql = "SELECT * FROM Users WHERE Username = ?";
    db.query(sql, [username], callback);
  },

  // Tạo user mới (Admin tạo tài khoản)
  create: (userData, callback) => {
    const sql =
      "INSERT INTO Users (Username, Password, HoTen, VaiTro) VALUES (?, ?, ?, ?)";

    db.query(
      sql,
      [userData.username, userData.password, userData.hoTen, userData.vaiTro],
      callback
    );
  },

  // Lấy danh sách user
  getAll: (callback) => {
    const sql = "SELECT MaNV, Username, HoTen, VaiTro, NgayTao FROM Users";
    db.query(sql, callback);
  },
};

module.exports = User;
