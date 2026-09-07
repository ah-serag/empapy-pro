const express = require('express');
const router = express.Router();
const { getAllCollections, remitCollection } = require('../../controlls/Manager/collectionsController');



const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")


router.get('/', authenticate , attachUser ,authorize("superadmin", "admin"), getAllCollections);
router.post('/:id/remit',authenticate , attachUser ,authorize("superadmin", "admin"), remitCollection);

module.exports = router;