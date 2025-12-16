const express = require("express");
const router = express.Router();
const phieuThueController = require("../controllers/phieuthueController");

// Tạo phiếu thuê phòng
router.post("/", phieuThueController.createPhieuThue);

// (tuỳ chọn) lấy danh sách phiếu thuê
router.get("/", phieuThueController.getAllPhieuThue);

module.exports = router;
