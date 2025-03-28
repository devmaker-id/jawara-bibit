const express = require("express");
const router = express.Router();
const OnuController = require("../controllers/onuController");

router.use(express.json());

router.get("/", OnuController.getAllOnu);
router.post("/get-onu", OnuController.getOnuByInet);
router.post("/reboot-onu", OnuController.rebootOnu);

module.exports = router;
