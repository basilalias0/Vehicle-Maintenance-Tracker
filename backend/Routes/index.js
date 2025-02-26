const express = require('express')
const adminRouter = require('./adminRouter')
const managerRouter = require('./managerRouter')
const ownerRouter = require('./ownerRouter')
const router = express()


router.use("/admin",adminRouter) 
router.use("/manager",managerRouter)
router.use("/owner",ownerRouter)

module.exports = router