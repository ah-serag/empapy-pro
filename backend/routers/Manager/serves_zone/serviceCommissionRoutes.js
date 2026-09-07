const express = require('express');
const router = express.Router();
const { 
  upsertServiceCommission, 
  getAllServiceCommissions 
} = require('../../../controlls/Manager/serves_zone/serviceCommissionController');

const authenticate = require("../../../middleware/auth/authenticate")
const authorize = require("../../../middleware/auth/authorize")
const attachUser = require("../../../middleware/auth/atachUser")


router.post('/',authenticate , attachUser ,authorize("superadmin", "admin") , upsertServiceCommission);
router.get('/',authenticate , attachUser ,authorize("superadmin", "admin") , getAllServiceCommissions);
 
module.exports = router;