const express = require("express");
const router = express.Router();
const controller = require("../controllers/hoadonController");

// Các route cho HÓA ĐƠN

// Lấy tất cả hóa đơn
router.get("/", controller.getAllHoaDon);

// Xem trước hóa đơn theo số phiếu thuê
router.get("/preview/:soPhieu", controller.previewHoaDon);

// Lấy chi tiết hóa đơn theo số hóa đơn
router.get("/:soHoaDon", controller.getHoaDonDetail);

// Tạo và thanh toán hóa đơn
router.post("/pay", controller.createAndPay);

module.exports = router;