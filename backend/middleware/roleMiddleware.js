module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }
    if (!allowedRoles.includes(req.user.vaiTro)) {
      return res.status(403).json({ error: "Không có quyền truy cập" });
    }
    next();
  };
};
