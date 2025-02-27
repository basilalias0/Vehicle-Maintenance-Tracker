const express = require('express')
const adminRouter = require('./adminRouter')
const managerRouter = require('./managerRouter')
const ownerRouter = require('./ownerRouter')
const storeRouter = require('./storeRouter')
const router = express()


router.use("/admin",adminRouter) 
router.use("/manager",managerRouter)
router.use("/owner",ownerRouter)
router.use("/store",storeRouter)

module.exports = router