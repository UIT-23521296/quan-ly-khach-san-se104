// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
const controller = require("../controllers/userController");

router.use(auth, allow("Admin"));

router.get("/", controller.getAllUsers);
router.post("/", controller.createUser);
router.put("/:id", controller.updateUser);
router.delete("/:id", controller.deleteUser);

module.exports = router;