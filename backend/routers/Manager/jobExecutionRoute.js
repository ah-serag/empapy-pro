const express = require('express');
const router = express.Router();

const { getAllJobExecutions  , approveAndCompleteExecution , rejectExecution} = require('../../controlls/Manager/jobExecutionController');

const authenticate = require("../../middleware/auth/authenticate")
const authorize = require("../../middleware/auth/authorize")
const attachUser = require("../../middleware/auth/atachUser")


router.get('/job-executions',  authenticate , attachUser ,authorize("superadmin", "admin"),getAllJobExecutions);
router.post('/approve', authenticate , attachUser ,authorize("superadmin", "admin"), approveAndCompleteExecution);
router.post('/:id/reject', authenticate , attachUser ,authorize("superadmin", "admin") , rejectExecution);



module.exports = router;
