const express = require('express');
const router = express.Router();
const { getAdvances, createAdvance  , cancelAdvance } = require('../../controlls/Manager/advanceController');


const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")


router.get('/',authenticate , attachUser ,authorize("superadmin", "admin"), getAdvances); 

router.post('/',authenticate , attachUser ,authorize("superadmin", "admin"), createAdvance); 

router.put('/:id/cancel',authenticate , attachUser ,authorize("superadmin", "admin"), cancelAdvance); 





module.exports = router;




































