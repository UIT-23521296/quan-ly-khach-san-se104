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

router.get("/", allow("Admin", "User"), getAllRooms);
router.get("/:id", allow("Admin", "User"), getRoomById);

router.post("/", allow("Admin"), createRoom);
router.put("/:id", allow("Admin"), updateRoom);
router.delete("/:id", allow("Admin"), deleteRoom);

router.put("/:id/maintenance", allow("Admin"), toggleMaintenance);
router.put("/:id/business", allow("Admin"), toggleBusinessStatus);

module.exports = router;
