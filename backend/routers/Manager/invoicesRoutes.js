const express = require('express');
const router = express.Router();
const InvoiceController = require('../../controlls/Manager/invoices_con');


const authenticate = require("../../middleware/auth/authenticate")
const authorize = require("../../middleware/auth/authorize")
const attachUser = require("../../middleware/auth/atachUser")


router.post('/create',authenticate , attachUser ,authorize("superadmin", "admin") , InvoiceController.createInvoice);

router.get('/', authenticate , attachUser ,authorize("superadmin", "admin") , InvoiceController.getInvoices);


router.patch('/:id/status', authenticate , attachUser ,authorize("superadmin", "admin") ,InvoiceController.updateStatus);
  
router.post('/:id/payments',authenticate , attachUser ,authorize("superadmin", "admin"), InvoiceController.recordInvoicePayment); 


module.exports = router;