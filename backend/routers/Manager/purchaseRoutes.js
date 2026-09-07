const express = require('express');
const router = express.Router();
const { createPurchaseInvoice , getAllPurchaseInvoices ,getPurchaseInvoiceById ,payPurchaseInvoice} = require('../../controlls/Manager/purchaseController');

const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")


router.post('/invoices',authenticate , attachUser ,authorize("superadmin", "admin"), createPurchaseInvoice);
router.get('/invoices',authenticate , attachUser ,authorize("superadmin", "admin") , getAllPurchaseInvoices);
router.get('/invoices/:id', authenticate , attachUser ,authorize("superadmin", "admin") , getPurchaseInvoiceById);
router.post('/invoices/:id/pay',authenticate , attachUser ,authorize("superadmin", "admin") , payPurchaseInvoice);

module.exports = router;