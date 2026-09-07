


const express = require('express');
const router = express.Router();
const finetechnicianFinanceControll = require('../../controlls/Manager/technicianFinanceController') ;


const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")


router.get('/expenses',authenticate , attachUser ,authorize("superadmin", "admin"), finetechnicianFinanceControll.getAllExpenses);
router.get('/collections',authenticate , attachUser ,authorize("superadmin", "admin"),  finetechnicianFinanceControll.getAllCollections);




module.exports = router;



