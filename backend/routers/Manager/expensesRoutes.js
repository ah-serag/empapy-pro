const express = require('express');
const router = express.Router();
const { getAllExpenses, approveExpense, rejectExpense } = require('../../controlls/Manager/expensesController');

const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize") 

router.get('/', authenticate , attachUser ,authorize("superadmin", "admin"), getAllExpenses);
router.post('/:id/approve',authenticate , attachUser ,authorize("superadmin", "admin"),  approveExpense);
router.post('/:id/reject', authenticate , attachUser ,authorize("superadmin", "admin"),  rejectExpense);





module.exports = router;







