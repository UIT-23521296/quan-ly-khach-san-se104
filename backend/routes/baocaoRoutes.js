//backend/routes/baocaoRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/baocaoController");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
router.use(auth, allow("Admin", "Manage"));

// API: Lấy dữ liệu Live để preview
router.get("/doanhthu", controller.getDoanhThuThang); 

// --- API: LƯU BÁO CÁO  ---
router.post("/save", controller.saveReport);          

// --- API: LẤY DANH SÁCH BÁO CÁO ĐÃ LƯU ---
router.get("/list", controller.getSavedReportsList);  

// --- API: XEM CHI TIẾT 1 BÁO CÁO ---
router.get("/detail/:id", controller.getReportDetail);

// --- API: XÓA BÁO CÁO ---
router.delete("/:id", controller.deleteReport);

module.exports = router;