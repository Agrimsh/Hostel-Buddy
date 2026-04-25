const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.get("/history", chatController.getHistory);
router.get("/conversations", chatController.getConversations);

module.exports = router;
