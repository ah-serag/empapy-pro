
const express = require('express');
const router = express.Router();
const dashbordControll = require('../../controlls/Manager/dashboard/dashbordCon');

const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")





router.get('/bookings',authenticate , attachUser ,authorize("superadmin", "admin") ,  dashbordControll.BookingDash);
router.get('/users',authenticate , attachUser ,authorize("superadmin", "admin") ,  dashbordControll.UsersDash);
router.get('/teams',authenticate , attachUser ,authorize("superadmin", "admin") ,  dashbordControll.TeamDash);
router.get('/assignments',authenticate , attachUser ,authorize("superadmin", "admin") ,  dashbordControll.AssignmentsDash);
router.get('/invoices',authenticate , attachUser ,authorize("superadmin", "admin") ,  dashbordControll.InvoicesDash);
router.get('/AllAmounts',authenticate , attachUser ,authorize("superadmin", "admin") ,  dashbordControll.FinanciaAmountlDash);
router.get('/TodayDash',authenticate , attachUser ,authorize("superadmin", "admin") ,  dashbordControll.TodayDash);
router.get('/expenses',authenticate , attachUser ,authorize("superadmin", "admin") , dashbordControll.ExpensesDash);
router.get('/collections',authenticate , attachUser ,authorize("superadmin", "admin") , dashbordControll.CollectionsDash);


module.exports = router;


