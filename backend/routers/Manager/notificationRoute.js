

const express = require('express');
const router = express.Router();

const { 
    getUnreadNotifications, 
    getAllNotifications, 
    markAsRead ,
    deleteNotification,
    deleteAllNotifications
} =  require('../../controlls/Manager/notification_con');


const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")


router.get('/unread',authenticate , attachUser ,authorize("superadmin", "admin"), getUnreadNotifications);
router.get('/', authenticate , attachUser ,authorize("superadmin", "admin"),getAllNotifications);

router.put('/read', authenticate , attachUser ,authorize("superadmin", "admin"),markAsRead); 

router.delete('/all',authenticate , attachUser ,authorize("superadmin", "admin"), deleteAllNotifications); 
router.delete('/:id', authenticate , attachUser ,authorize("superadmin", "admin"),deleteNotification); 

module.exports = router;


