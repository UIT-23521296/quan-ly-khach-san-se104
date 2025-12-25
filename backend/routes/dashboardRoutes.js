const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");

router.get("/stats", auth, allow("Admin","User"), controller.getDashboardStats);

module.exports = router;