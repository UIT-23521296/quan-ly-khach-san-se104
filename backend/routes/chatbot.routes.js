const express = require("express");
const router = express.Router();
const { askDatabase } = require("../services/chatbot.service");

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await askDatabase(question);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi chatbot" });
  }
});

module.exports = router;
