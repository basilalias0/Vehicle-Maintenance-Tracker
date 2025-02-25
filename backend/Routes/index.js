const express = require('express')
const userRouter = require('./ownerRouter')
const vechicleRouter = require('./vehicleRoutes')
const maintenanceTaskRouter = require('./maintenanceTaskRoutes')
const vendorRouter = require('./vendorRoutes')
const partRouter = require('./PartsRoutes')
const router = express()


router.use("/user",userRouter)
router.use("/vehicle",vechicleRouter)
router.use("/mantenance-task",maintenanceTaskRouter)
router.use("/vendor",vendorRouter)
router.use('/parts',partRouter)


module.exports = router