const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/roleMiddleware");

const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  toggleMaintenance,
  toggleBusinessStatus,
} = require("../controllers/phongController");

router.use(auth);

router.get("/", allow("Admin", "Manage", "User"), getAllRooms);
router.get("/:id", allow("Admin", "Manage", "User"), getRoomById);

router.post("/", allow("Admin", "Manage"), createRoom);
router.put("/:id", allow("Admin", "Manage"), updateRoom);
router.delete("/:id", allow("Admin", "Manage"), deleteRoom);

router.put("/:id/maintenance", allow("Admin", "Manage"), toggleMaintenance);
router.put("/:id/business", allow("Admin", "Manage"), toggleBusinessStatus);

module.exports = router;
