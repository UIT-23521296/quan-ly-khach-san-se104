const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
router.use(auth);

// ✅ Khai báo biến là "controller"
const controller = require("../controllers/phieuthueController");

// Lấy danh sách
router.get("/", allow("Admin", "Manage","User"), controller.getAllPhieuThue);

// Tạo mới
router.post("/", allow("Admin", "Manage","User"), controller.createPhieuThue);

// Cập nhật (Sửa)
router.put("/:soPhieu", allow("Admin", "Manage","User"), controller.updatePhieuThue);

// Trả phòng
router.put("/:soPhieu/checkout", allow("Admin", "Manage","User"), controller.checkOut);

// Hủy phiếu
router.put("/:soPhieu/huy", allow("Admin", "Manage","User"), controller.huyPhieu);

// Xóa phiếu
router.delete("/:id", allow("Admin", "Manage"), controller.deletePhieu);

module.exports = router;