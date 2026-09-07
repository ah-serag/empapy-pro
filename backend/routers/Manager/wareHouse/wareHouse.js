const express = require('express');

const { validate, categorySchema, materialSchema } = require('../../../middleware/validation/materails.js');
const { createCategory, getCategories, deleteCategory } = require('../../../controlls/Manager/wareHouse/categoryController.js');
const { createMaterial, getMaterials, updateMaterial, deactivateMaterial } = require('../../../controlls/Manager/wareHouse/materails.js');

const { adjustInventory } = require('../../../controlls/Manager/wareHouse/inventory.js');
const { addSerial, correctSerial } = require('../../../controlls/Manager/wareHouse/serialController.js');

const { getExplorerLevel  } = require('../../../controlls/Manager/wareHouse/VeiwWareHouse.js');
const { getInventoryTransactions } = require('../../../controlls/Manager/wareHouse/inventoryTransactionsCon.js');

const router = express.Router();

const authenticate = require("../../../middleware/auth/authenticate")
const authorize = require("../../../middleware/auth/authorize")
const attachUser = require("../../../middleware/auth/atachUser")


// get inventory transaction 
router.get('/inventory-transactions' , authenticate , attachUser ,authorize("superadmin", "admin"), getInventoryTransactions);



// category
router.post('/categories',authenticate , attachUser ,authorize("superadmin", "admin") , validate(categorySchema), createCategory);
router.get('/categories' ,authenticate , attachUser ,authorize("superadmin", "admin") , getCategories);
router.delete('/categories/:id',authenticate , attachUser ,authorize("superadmin", "admin") , deleteCategory); 

// materails 
router.post('/materials', authenticate , attachUser ,authorize("superadmin", "admin") , validate(materialSchema), createMaterial);
router.get('/materials', authenticate , attachUser ,authorize("superadmin", "admin") , getMaterials);
router.put('/materials/:id', authenticate , attachUser ,authorize("superadmin", "admin") , updateMaterial); 
router.patch('/materials/:id/deactivate', authenticate , attachUser ,authorize("superadmin", "admin") , deactivateMaterial); 




router.post('/inventory/adjust' ,  authenticate , attachUser ,authorize("superadmin", "admin") , adjustInventory);

// serails
router.post('/serials', authenticate , attachUser ,authorize("superadmin", "admin") , addSerial);            
router.put('/serials/:id/correct', authenticate , attachUser ,authorize("superadmin", "admin") , correctSerial);


// view 
router.get('/explorer', authenticate , attachUser ,authorize("superadmin", "admin") , getExplorerLevel);


module.exports = router;






