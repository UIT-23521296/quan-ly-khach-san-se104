const express = require("express");
const router = express.Router();
const controller = require("../controllers/hoadonController");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
router.use(auth);

// Các route cho HÓA ĐƠN

// Lấy tất cả hóa đơn
router.get("/", allow("Admin", "Manage","User"), controller.getAllHoaDon);

// Xem trước hóa đơn theo số phiếu thuê
router.get("/preview/:soPhieu", allow("Admin", "Manage","User"), controller.previewHoaDon);

// Lấy chi tiết hóa đơn theo số hóa đơn
router.get("/:soHoaDon", allow("Admin", "Manage","User"), controller.getHoaDonDetail);

// Tạo và thanh toán hóa đơn
router.post("/pay", allow("Admin", "Manage","User"), controller.createAndPay);

// Xóa hóa đơn
router.delete("/:soHoaDon", allow("Admin", "Manage"), controller.deleteHoaDon);

module.exports = router;