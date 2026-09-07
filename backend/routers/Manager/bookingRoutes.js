const express = require("express");
const router = express.Router();
const bookingController = require("../../controlls/Manager/booking_con");

const authenticate = require("../../middleware/auth/authenticate");
const attachUser = require("../../middleware/auth/atachUser");
const authorize = require("../../middleware/auth/authorize")



router.post("/",authenticate , attachUser ,authorize("superadmin", "admin"), bookingController.createBooking);
router.get("/", authenticate , attachUser ,authorize("superadmin", "admin"), bookingController.getAdvancedBookings);
router.get("/:id",authenticate , attachUser ,authorize("superadmin", "admin"), bookingController.getBookingById);
router.put("/:id/confirm",authenticate , attachUser ,authorize("superadmin", "admin"), authenticate ,bookingController.confirmBooking);
router.put("/:id/cancel", authenticate , attachUser ,authorize("superadmin", "admin"),bookingController.cancelBooking);


router.put('/:id/location',authenticate , attachUser ,authorize("superadmin", "admin"), bookingController.updateBookingLocation);


module.exports = router;





