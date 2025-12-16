const express = require("express");
const router = express.Router();
const phongController = require("../controllers/phongController");

// Lấy danh sách phòng
router.get("/", phongController.getAllRooms);

// Thêm phòng
router.post("/", phongController.createRoom);

// Cập nhật phòng
router.put("/:id", phongController.updateRoom);

// Xóa phòng
router.delete("/:id", phongController.deleteRoom);

module.exports = router;
