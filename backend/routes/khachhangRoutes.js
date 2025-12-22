const express = require("express");
const router = express.Router();
const controller = require("../controllers/khachhangController");

router.get("/", controller.getAllCustomers);
router.put("/:id", controller.updateCustomer);
router.delete("/:id", controller.deleteCustomer);

module.exports = router;