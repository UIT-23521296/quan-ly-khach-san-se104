const express = require("express");
const router = express.Router();
const loaikhachController = require("../controllers/loaikhachController");

router.get("/", loaikhachController.getAllLoaiKhach);

module.exports = router;
