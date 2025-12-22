const express = require("express");
const router = express.Router();
const controller = require("../controllers/baocaoController");

// Báo cáo doanh thu theo tháng
router.get("/doanhthu", controller.getDoanhThuThang);

// Lưu báo cáo doanh thu
router.post("/save", controller.saveReport);

// Lấy các báo cáo đã lưu
router.get("/saved", controller.getSavedReport);

// Xóa báo cáo đã lưu
router.delete("/delete", controller.deleteReport);

module.exports = router;