const express = require("express");
const router = express.Router();

// ✅ Khai báo biến là "controller"
const controller = require("../controllers/phieuthueController");

// Lấy danh sách
router.get("/", controller.getAllPhieuThue);

// Tạo mới
router.post("/", controller.createPhieuThue);

// Cập nhật (Sửa)
router.put("/:soPhieu", controller.updatePhieuThue);

// Trả phòng
router.put("/:soPhieu/checkout", controller.checkOut);

// Hủy phiếu
router.put("/:soPhieu/huy", controller.huyPhieu);

module.exports = router;