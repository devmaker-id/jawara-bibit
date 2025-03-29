const express = require("express");
const router = express.Router();
const OltController = require("../controllers/oltController");
const apiKeyAuth = require("../middlewares/authMiddleware");

router.use(express.json());
router.post("/log", apiKeyAuth, OltController.sysLogServer);
router.post("/system-info", apiKeyAuth, OltController.oltInfo);
router.post("/int-network", apiKeyAuth, OltController.intNetwork);

module.exports = router;
