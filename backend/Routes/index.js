const express = require('express')
const adminRouter = require('./adminRouter')
const managerRouter = require('./managerRouter')
const ownerRouter = require('./ownerRouter')
const storeRouter = require('./storeRouter')
const vechicleRouter = require('./vehicleRoutes')
const maintenanceTaskRouter = require('./maintenanceTaskRoutes')
const complaintRouter = require('./complaintRoutes')
const vendorRouter = require('./vendorRoutes')
const router = express()


router.use("/admin",adminRouter) 
router.use("/manager",managerRouter)
router.use("/owner",ownerRouter)
router.use("/store",storeRouter)
router.use('/vehicle',vechicleRouter)
router.use('/maintenance-task',maintenanceTaskRouter)
router.use('/complaint',complaintRouter)
router.use('/vendor',vendorRouter)

module.exports = router