const express = require("express");
const router = express.Router();
const TelegramController = require("../controllers/telegramController");
const apiKeyAuth = require("../middlewares/authMiddleware");

router.use(express.json());

// Rute untuk menangani webhook Telegram
router.post("/webhook", TelegramController.handleUpdate);

// Customisasi debug CURD Webhook telegram
router.post("/set-webhook", apiKeyAuth, TelegramController.setWebhook);
router.get("/info-webhook", apiKeyAuth, TelegramController.getWebhookInfo);
router.delete("/delete-webhook", apiKeyAuth, TelegramController.deleteWebhook);

module.exports = router;
