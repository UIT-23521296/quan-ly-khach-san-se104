// createAdmin.js
const bcrypt = require("bcryptjs");
const db = require("./config/db");

(async () => {
  const username = "admin";
  const password = "admin123";
  const hoTen = "Quản Trị Hệ Thống";
  const vaiTro = "Admin";

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO Users (Username, Password, HoTen, VaiTro) VALUES (?, ?, ?, ?)",
    [username, hashedPassword, hoTen, vaiTro],
    (err, result) => {
      if (err) {
        console.error("❌ Lỗi tạo admin:", err);
        process.exit();
      }

      console.log("✅ Tạo tài khoản admin thành công!");
      process.exit();
    }
  );
})();
