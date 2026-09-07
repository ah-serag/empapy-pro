const express = require('express');
const { createSafe, getAllSafes  , toggleSafeStatus ,getAvailableSafesForUser ,getCompanySafes ,getTechnicianWallets} = require('../../controlls/Manager/safeControll');
const accountController = require('../../controlls/Manager/accountsControll');
const transactionTreasury = require('../../controlls/Manager/treasuryTransactionsCon');
const voucherControll = require('../../controlls/Manager/treasuryVouchersController');


const authenticate = require('../../middleware/auth/authenticate');
const attachUser = require('../../middleware/auth/atachUser');
const authorize = require("../../middleware/auth/authorize")

const router = express.Router();

// safes 
router.post('/safes/createSafe', createSafe);
router.get('/safes/getAllSafes', getAllSafes);
router.patch('/safes/toggleSafeStatus/:id/status', toggleSafeStatus);
router.get('/safes/getAvailableSafes',authenticate , attachUser ,authorize("superadmin", "admin") , getAvailableSafesForUser);
router.get('/safes/company', authenticate , attachUser ,authorize("superadmin", "admin"), getCompanySafes);
router.get('/safes/technician-wallets', getTechnicianWallets);


// acounts 

router.post('/accounts/createAccount', accountController.createAccount);
router.get('/accounts/getAllAccounts', accountController.getAllAccounts);
router.get('/accounts/list', accountController.getAccountsList);



// transactions 
router.get('/transactions',authenticate , attachUser ,authorize("superadmin", "admin") , transactionTreasury.getTreasuryTransactions);

// vouchers 
router.post('/vouchers', authenticate , attachUser ,authorize("superadmin", "admin") , voucherControll.createVoucher);

router.get('/vouchers',authenticate , attachUser ,authorize("superadmin", "admin") , voucherControll.getVouchers);



module.exports = router;





