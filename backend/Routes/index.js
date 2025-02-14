const express = require('express')
const userRouter = require('./userRoutes')
const vechicleRouter = require('./vehicleRoutes')
const maintenanceTaskRouter = require('./maintenanceTaskRoutes')
const serviceRecordRouter = require('./serviceRecordRoutes')
const vendorRouter = require('./vendorRoutes')
const partRouter = require('./PartsRoutes')
const router = express()


router.use("/user",userRouter)
router.use("/vehicle",vechicleRouter)
router.use("/mantenance-task",maintenanceTaskRouter)
router.use("/service-record",serviceRecordRouter)
router.use("/vendor",vendorRouter)
router.use('/parts',partRouter)


module.exports = router