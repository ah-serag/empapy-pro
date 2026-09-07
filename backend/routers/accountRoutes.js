const express = require('express');
const router = express.Router();
const accountControll = require('../controlls/account_con');
const authenticate = require('../middleware/auth/authenticate');

router.get("/info",authenticate  , accountControll.getUserAccountInfo);


module.exports = router;