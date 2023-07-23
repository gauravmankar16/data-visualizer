const express = require("express");
const router = express.Router();
const user = require("./user");
const profile = require("./profile");
const manageJobs = require("./jobManager");

router.use("/user", user);
router.use("/profile", profile);
router.use("/manageJobs", manageJobs);
module.exports = router;
