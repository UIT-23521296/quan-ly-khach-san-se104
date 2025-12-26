// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");
const controller = require("../controllers/userController");

// ✅ chỉ xác thực chung, không chặn role ở mức router nữa
router.use(auth);

/* ===================== MANAGE ZONE ===================== */

router.get("/managed", allow("Admin", "Manage"), controller.getManagedUsers);
router.post("/managed", allow("Admin", "Manage"), controller.createManagedUser);
router.put("/managed/:id", allow("Admin", "Manage"), controller.updateManagedUser);
router.delete("/managed/:id", allow("Admin", "Manage"), controller.deleteManagedUser);

/* ===================== ADMIN ZONE ===================== */

router.get("/", allow("Admin"), controller.getAllUsers);
router.post("/", allow("Admin"), controller.createUser);
router.put("/:id", allow("Admin"), controller.updateUser);
router.delete("/:id", allow("Admin"), controller.deleteUser);

module.exports = router;
