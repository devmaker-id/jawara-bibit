const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const apiKeyAuth = require("../middlewares/authMiddleware");

router.use(express.json());

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.post("/me", apiKeyAuth, userController.userInfo);

module.exports = router;
