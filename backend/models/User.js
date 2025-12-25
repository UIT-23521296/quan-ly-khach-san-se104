// backend/models/User.js
const db = require("../config/db");

const User = {
  // ========== CALLBACK APIs (giữ tương thích với authRoutes hiện tại) ==========
  findByUsername: (username, callback) => {
    const sql = "SELECT * FROM Users WHERE Username = ?";
    db.query(sql, [username], callback);
  },

  create: (userData, callback) => {
    const sql =
      "INSERT INTO Users (Username, Password, HoTen, VaiTro) VALUES (?, ?, ?, ?)";
    db.query(
      sql,
      [userData.username, userData.password, userData.hoTen, userData.vaiTro],
      callback
    );
  },

  getAll: (callback) => {
    const sql = "SELECT MaNV, Username, HoTen, VaiTro, NgayTao FROM Users";
    db.query(sql, callback);
  },

  // ========== PROMISE APIs (mới - dùng cho controllers quản lý nhân viên) ==========
  getAllAsync: async () => {
    const [rows] = await db
      .promise()
      .query("SELECT MaNV, Username, HoTen, VaiTro, NgayTao FROM Users");
    return rows;
  },

  findByIdAsync: async (id) => {
    const [rows] = await db
      .promise()
      .query("SELECT MaNV, Username, HoTen, VaiTro, NgayTao FROM Users WHERE MaNV = ?", [id]);
    return rows[0] || null;
  },

  existsUsernameAsync: async (username) => {
    const [rows] = await db
      .promise()
      .query("SELECT 1 FROM Users WHERE Username = ? LIMIT 1", [username]);
    return rows.length > 0;
  },

  updateInfoAsync: async (id, { hoTen, vaiTro }) => {
    const sql = "UPDATE Users SET HoTen = ?, VaiTro = ? WHERE MaNV = ?";
    const [result] = await db.promise().query(sql, [hoTen, vaiTro, id]);
    return result;
  },

  updatePasswordAsync: async (id, hashedPassword) => {
    const sql = "UPDATE Users SET Password = ? WHERE MaNV = ?";
    const [result] = await db.promise().query(sql, [hashedPassword, id]);
    return result;
  },

  deleteByIdAsync: async (id) => {
    const [result] = await db.promise().query("DELETE FROM Users WHERE MaNV = ?", [id]);
    return result;
  },
};

module.exports = User;
