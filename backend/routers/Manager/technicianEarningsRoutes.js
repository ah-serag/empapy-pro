const express = require('express');
const router = express.Router();
const { getTechnicianEarnings ,approveTechnicianEarning , cancelTechnicianEarning , getPendingSettlements , executeSettlement ,
    getPayrollSettlements
} = require('../../controlls/Manager/technicianEarningsController');


const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")



router.get('/settlements/:technician_id' , authenticate , attachUser ,authorize("superadmin", "admin"), getPendingSettlements);
router.post('/settlements', authenticate , attachUser ,authorize("superadmin", "admin") , executeSettlement); 


router.get('/',authenticate , attachUser ,authorize("superadmin", "admin"), getTechnicianEarnings);
router.patch('/:id/approve',authenticate , attachUser ,authorize("superadmin", "admin"), approveTechnicianEarning);
router.patch('/:id/cancel',authenticate , attachUser ,authorize("superadmin", "admin"), cancelTechnicianEarning); 


router.get('/settlements-history',authenticate , attachUser ,authorize("superadmin", "admin") , getPayrollSettlements);


module.exports = router;