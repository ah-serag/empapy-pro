const express = require("express");
const router = express.Router();
const serviceController = require("../../../controlls/Manager/serves_zone/serves");
const authenticate = require("../../../middleware/auth/authenticate")
const authorize = require("../../../middleware/auth/authorize")
const attachUser = require("../../../middleware/auth/atachUser")

router.post("/categories", authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.createCategory);
router.get("/categories/:id",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.getCategoryById);
router.put("/categories/:id",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.updateCategory);
router.delete("/categories/:id",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.deleteCategory);

router.post("/services",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.createService);
router.get("/services",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.getAllServices);
router.get("/services/:id",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.getServiceById);
router.put("/services/:id",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.updateService);
router.delete("/services/:id",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.deleteService);

router.get("/all",authenticate , attachUser ,authorize("superadmin", "admin") , serviceController.getCategoriesAndServices);

module.exports = router;