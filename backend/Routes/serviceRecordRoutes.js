const express = require('express')
const isAuth = require('../Middlewares/isAuth')
const serviceRecordController = require('../Controllers/serviceRecordController')
const serviceRecordRouter = express.Router()


serviceRecordRouter.post("/create", isAuth ,serviceRecordController.createServiceRecord)
serviceRecordRouter.get("/:vehicleId", isAuth,serviceRecordController.getAllServiceRecords)
serviceRecordRouter.get("/:id", isAuth,serviceRecordController.getServiceRecordById)
serviceRecordRouter.delete("/:id", isAuth,serviceRecordController.deleteServiceRecord)


module.exports = serviceRecordRouter