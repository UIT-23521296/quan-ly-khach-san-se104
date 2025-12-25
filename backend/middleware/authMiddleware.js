// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (!header) return res.status(401).json({ message: "Thiếu token" });

  const [type, token] = String(header).split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authorization phải dạng: Bearer <token>" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Chuẩn hóa để roleMiddleware luôn chạy đúng
    req.user = {
      id: decoded.id ?? decoded.MaNV ?? decoded.userId,
      username: decoded.username ?? decoded.Username,
      hoTen: decoded.hoTen ?? decoded.HoTen,
      vaiTro: decoded.vaiTro ?? decoded.VaiTro,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token hết hạn hoặc không hợp lệ" });
  }
};
