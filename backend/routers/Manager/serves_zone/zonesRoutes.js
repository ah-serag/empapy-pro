const express = require("express");
const router = express.Router();
const zoneController = require("../../../controlls/Manager/serves_zone/zones");
const authenticate = require("../../../middleware/auth/authenticate")
const authorize = require("../../../middleware/auth/authorize")
const attachUser = require("../../../middleware/auth/atachUser")


router.post("/", authenticate , attachUser ,authorize("superadmin", "admin") , zoneController.createZone);
router.get("/", authenticate , attachUser ,authorize("superadmin", "admin") , zoneController.getAllZones);
router.get("/:id", authenticate , attachUser ,authorize("superadmin", "admin") , zoneController.getZoneById);
router.put("/:id", authenticate , attachUser ,authorize("superadmin", "admin") , zoneController.updateZone);
router.delete("/:id", authenticate , attachUser ,authorize("superadmin", "admin") , zoneController.deleteZone);



module.exports = router;



