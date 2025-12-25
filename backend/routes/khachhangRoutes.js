const express = require("express");
const router = express.Router();
const controller = require("../controllers/khachhangController");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
router.use(auth);

router.get("/", allow("Admin","User"), controller.getAllCustomers);
router.put("/:id", allow("Admin","User"), controller.updateCustomer);
router.delete("/:id", allow("Admin"), controller.deleteCustomer);

module.exports = router;