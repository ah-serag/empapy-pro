const express = require('express');
const router = express.Router();
const teamControll = require('../../controlls/Teams/teamControll');

const { handleImageUpload } = require('../../config/multer');

const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")


router.get("/assignments"  , authenticate , attachUser ,authorize("supervisor"), teamControll.getSupervisorAssignments);


//start job 
router.post('/start-execution/:id',authenticate , attachUser ,authorize("supervisor"), teamControll.startJobExecution);

//restart job 
router.post('/revert-execution/:id',authenticate , attachUser ,authorize("supervisor"), teamControll.revertJobExecution);





// members 
router.get("/searchMember"  , authenticate , attachUser ,authorize("supervisor"), teamControll.searchActiveMembers);


// services 
router.get("/getServices"  , authenticate , attachUser ,authorize("supervisor"), teamControll.getActiveServicesList);

// materails 
router.get('/materials/search-execution' ,  authenticate , attachUser ,authorize("supervisor" , "superadmin", "admin" ), teamControll.searchMaterialsForExecution);

// submit

router.post(
  '/submit-execution',
  handleImageUpload('images', 10),
  teamControll.submitJobExecution              
);




// ---- rejected ---- 

router.get('/rejected',authenticate , attachUser ,authorize("supervisor"), teamControll.getSupervisorRejectedExecutions);
router.put('/rejected/:id',  handleImageUpload('images', 10),
  authenticate , attachUser ,authorize("supervisor"), teamControll.updateRejectedExecution);







module.exports = router;
















