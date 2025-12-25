const express = require("express");
const router = express.Router();
const controller = require("../controllers/quidinhController");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
router.use(auth, allow("Admin"));

// Loại phòng
router.get("/loaiphong", controller.getLoaiPhong);
router.post("/loaiphong", controller.createLoaiPhong);
router.put("/loaiphong/:id", controller.updateLoaiPhong);
router.delete("/loaiphong/:id", controller.deleteLoaiPhong);

// Loại khách
router.get("/loaikhach", controller.getLoaiKhach);
router.post("/loaikhach", controller.createLoaiKhach);
router.put("/loaikhach/:id", controller.updateLoaiKhach);
router.delete("/loaikhach/:id", controller.deleteLoaiKhach);

// Phụ thu
router.get("/phuthu", controller.getPhuThu);
router.post("/phuthu", controller.updatePhuThu);
router.delete("/phuthu/:id", controller.deletePhuThu);

// Tham số
router.get("/thamso", controller.getThamSo);
router.put("/thamso", controller.updateThamSo);

module.exports = router;