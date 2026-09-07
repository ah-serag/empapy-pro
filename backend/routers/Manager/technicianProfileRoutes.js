const express = require('express');
const router = express.Router();
const { 
  upsertTechnicianProfile, 
  getAllTechnicianProfiles 
} = require('../../controlls/Manager/technicianProfileController');


const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")

router.post('/technician-profiles',authenticate , attachUser ,authorize("superadmin", "admin"), upsertTechnicianProfile);
router.get('/technician-profiles',authenticate , attachUser ,authorize("superadmin", "admin"), getAllTechnicianProfiles);

module.exports = router;