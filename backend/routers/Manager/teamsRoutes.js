const express = require('express');
const router = express.Router();
const teamController = require('../../controlls/Manager/teams_con') ;

// Main Team Endpoints (CRUD + Filter & Search)

const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")


router.post('/', authenticate , attachUser ,authorize("superadmin", "admin"), teamController.create);
router.get('/', authenticate , attachUser ,authorize("superadmin", "admin"), teamController.getAll);
router.get('/getTeamsSelector', authenticate , attachUser ,authorize("superadmin", "admin"), teamController.getTeamsSelector);


// update statues 
router.patch("/:id/status", authenticate , attachUser ,authorize("superadmin", "admin"), teamController.updateTeamStatus);

router.get('/:id', authenticate , attachUser ,authorize("superadmin", "admin"), teamController.getById);
router.put('/:id', authenticate , attachUser ,authorize("superadmin", "admin"), teamController.update);
router.delete('/:id', authenticate , attachUser ,authorize("superadmin", "admin"), teamController.delete);

// Team Members Sub-resource Endpoints
router.post('/:id/members', authenticate , attachUser ,authorize("superadmin", "admin"), teamController.addMember);
router.delete('/:id/members/:memberId', authenticate , attachUser ,authorize("superadmin", "admin"), teamController.removeMember);

module.exports = router;


