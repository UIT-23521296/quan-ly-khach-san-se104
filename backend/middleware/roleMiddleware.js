module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.vaiTro)) {
      return res.status(403).json({ error: "Không có quyền truy cập" });
    }
    next();
  };
};
