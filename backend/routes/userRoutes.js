const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getAllUsers);
router.put("/update", userController.updateProfile); // <-- Double check 'updateProfile' match here!

module.exports = router;
