const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController"); // Make sure this path is 100% correct!

router.post("/send", chatController.sendMessage);
router.get("/history", chatController.getChatHistory);

router.post("/groups/create", chatController.createGroup);
router.post("/groups/send", chatController.sendGroupMessage);
router.get("/groups/history", chatController.getGroupHistory);
router.get("/groups/list", chatController.getUserGroups);

module.exports = router;
