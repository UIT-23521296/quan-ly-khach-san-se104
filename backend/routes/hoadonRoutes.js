const express = require("express");
const router = express.Router();
const controller = require("../controllers/hoadonController");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
router.use(auth);

// Các route cho HÓA ĐƠN

// Lấy tất cả hóa đơn
router.get("/", allow("Admin","User"), controller.getAllHoaDon);

// Xem trước hóa đơn theo số phiếu thuê
router.get("/preview/:soPhieu", allow("Admin","User"), controller.previewHoaDon);

// Lấy chi tiết hóa đơn theo số hóa đơn
router.get("/:soHoaDon", allow("Admin","User"), controller.getHoaDonDetail);

// Tạo và thanh toán hóa đơn
router.post("/pay", allow("Admin","User"), controller.createAndPay);

// Xóa hóa đơn
router.delete("/:soHoaDon", allow("Admin"), controller.deleteHoaDon);

module.exports = router;