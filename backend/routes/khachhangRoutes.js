const express = require("express");
const router = express.Router();
const controller = require("../controllers/khachhangController");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
router.use(auth);

router.get("/", allow("Admin", "Manage", "User"), controller.getAllCustomers);
router.put("/:id", allow("Admin", "Manage", "User"), controller.updateCustomer);
router.delete("/:id", allow("Admin", "Manage"), controller.deleteCustomer);

module.exports = router;