const express = require("express");
const router = express.Router();

// ✅ FIX đường dẫn middleware
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");

// ✅ FIX đường dẫn controller
const controller = require("../controllers/quidinhController");

router.use(auth);

// quyền
const CAN_VIEW = allow("Admin", "Manage", "User");
const ADMIN_ONLY = allow("Admin");

// ===== LOẠI PHÒNG =====
router.get("/loaiphong", CAN_VIEW, controller.getLoaiPhong);
router.post("/loaiphong", ADMIN_ONLY, controller.createLoaiPhong);
router.put("/loaiphong/:id", ADMIN_ONLY, controller.updateLoaiPhong);
router.delete("/loaiphong/:id", ADMIN_ONLY, controller.deleteLoaiPhong);

// ===== LOẠI KHÁCH =====
router.get("/loaikhach", CAN_VIEW, controller.getLoaiKhach);
router.post("/loaikhach", ADMIN_ONLY, controller.createLoaiKhach);
router.put("/loaikhach/:id", ADMIN_ONLY, controller.updateLoaiKhach);
router.delete("/loaikhach/:id", ADMIN_ONLY, controller.deleteLoaiKhach);

// ===== PHỤ THU =====
router.get("/phuthu", CAN_VIEW, controller.getPhuThu);
router.post("/phuthu", ADMIN_ONLY, controller.updatePhuThu);
router.delete("/phuthu/:id", ADMIN_ONLY, controller.deletePhuThu);

// ===== THAM SỐ =====
router.get("/thamso", CAN_VIEW, controller.getThamSo);
router.put("/thamso", ADMIN_ONLY, controller.updateThamSo);

module.exports = router;
