


const express = require('express');
const router = express.Router();
const authControll  = require("../controlls/auth_con")
const authenticate = require("../middleware/auth/authenticate")
const authorize = require("../middleware/auth/authorize")
const attachUser = require("../middleware/auth/atachUser")

router.post("/register" , authControll.register)
router.post("/sign_in" ,authControll.sign_in )
router.get("/refresh" ,authControll.refresh )
router.post("/logout" , authControll.logOut)


router.post("/createTeamMember" ,
authenticate , attachUser ,authorize("superadmin", "admin")   ,   authControll.createTeamMember  )

router.get(
  "/users", 
  authenticate , attachUser ,authorize("superadmin", "admin")
, 
  authControll.getUsers
);

router.get(
  "/users-list", 
  authenticate , attachUser ,authorize("superadmin", "admin"), 
  authControll.getUsersForDropdown
);









router.patch("/users/:id/status", authenticate , attachUser ,authorize("superadmin", "admin"), authControll.toggleUserStatus);
router.delete("/users/:id",authenticate , attachUser , authorize("superadmin", "admin"), authControll.deleteUser);



module.exports = router




