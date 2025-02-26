const express = require('express')
const adminRouter = require('./adminRouter')
const managerRouter = require('./managerRouter')
const router = express()


router.use("/admin",adminRouter) 
router.use("/manager",managerRouter)


module.exports = router