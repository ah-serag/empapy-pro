const express = require('express');
const router = express.Router();
const { 
  createSupplier, 
  updateSupplier, 
  getSuppliersForSelect ,
  getSuppliers ,
  getSupplierTransactions
} = require('../../controlls/Manager/supplierController');



const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")




router.get('/', authenticate , attachUser ,authorize("superadmin", "admin"), getSuppliers); 
router.post('/', authenticate , attachUser ,authorize("superadmin", "admin"), createSupplier);
router.put('/:id', authenticate , attachUser ,authorize("superadmin", "admin")   , updateSupplier);
router.get('/select', authenticate , attachUser ,authorize("superadmin", "admin") , getSuppliersForSelect); 

router.get('/supplier-transactions',  authenticate , attachUser ,authorize("superadmin", "admin")  , getSupplierTransactions);

module.exports = router;