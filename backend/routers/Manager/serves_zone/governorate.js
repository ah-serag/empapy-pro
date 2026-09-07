const express = require("express");
const router = express.Router();
const governoratesController = require("../../../controlls/Manager/serves_zone/governorate");
const authenticate = require("../../../middleware/auth/authenticate")
const authorize = require("../../../middleware/auth/authorize")
const attachUser = require("../../../middleware/auth/atachUser")




router.post("/",authenticate , attachUser ,authorize("superadmin", "admin") , governoratesController.createGovernorate);
router.get("/",authenticate , attachUser ,authorize("superadmin", "admin") , governoratesController.getAllGovernorates);

router.get("/all" , authenticate , attachUser ,authorize("superadmin", "admin") ,  governoratesController.getGovernoratesAndZones);

router.get("/:id",authenticate , attachUser ,authorize("superadmin", "admin") , governoratesController.getGovernorateById);
router.put("/:id",authenticate , attachUser ,authorize("superadmin", "admin") , governoratesController.updateGovernorate);
router.delete("/:id",authenticate , attachUser ,authorize("superadmin", "admin") , governoratesController.deleteGovernorate);


module.exports = router;