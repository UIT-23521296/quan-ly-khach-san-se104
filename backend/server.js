// backend/server.js
require("dotenv").config(); // Đọc file .env

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 9999;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối DB
require("./config/db");

// ==== ROUTES ====
const authRoutes = require("./routes/authRoutes");
const phongRoutes = require("./routes/phongRoutes");
const thamSoRoutes = require("./routes/thamSoRoutes");
const loaiphongRoutes = require("./routes/loaiphongRoutes");
const phieuthueRoutes = require("./routes/phieuthueRoutes");
const loaikhachRoutes = require("./routes/loaikhachRoutes");
const hoadonRoutes = require("./routes/hoadonRoutes");
const baocaoRoutes = require("./routes/baocaoRoutes");

// ==== SỬ DỤNG ROUTES ====
app.use("/api/auth", authRoutes);
app.use("/api/phong", phongRoutes);
app.use("/api/thamso", thamSoRoutes);
app.use("/api/loaiphong", loaiphongRoutes);
app.use("/api/phieuthue", phieuthueRoutes);
app.use("/api/loaikhach", loaikhachRoutes);
app.use("/api/hoadon", hoadonRoutes);
app.use("/api/baocao", baocaoRoutes);

// Test API
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend đang chạy!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
