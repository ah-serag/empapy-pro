const express = require('express');
const router = express.Router();

const assignmentsControlls = require("./../../controlls/Manager/assignment_con")

const authenticate = require("../../middleware/auth/authenticate")
const authorize = require("../../middleware/auth/authorize")
const attachUser = require("../../middleware/auth/atachUser")



router.get("/",authenticate , attachUser ,authorize("superadmin", "admin"), assignmentsControlls.getAll);
router.get("/:id",authenticate , attachUser ,authorize("superadmin", "admin"), assignmentsControlls.getById);

router.post("/",authenticate , attachUser ,authorize("superadmin", "admin"), assignmentsControlls.create);

router.post('/cancel',authenticate , attachUser ,authorize("superadmin", "admin") , assignmentsControlls.cancelAssignment);


 router.get("/:bookingRef/assignment-Members",authenticate , attachUser ,authorize("superadmin", "admin"), assignmentsControlls.getMembersAssignments);



module.exports = router;
