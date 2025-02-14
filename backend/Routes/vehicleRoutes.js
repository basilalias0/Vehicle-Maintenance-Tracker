const express = require('express')
const vehicleController = require('../Controllers/vehicleController')
const isAuth = require('../Middlewares/isAuth')
const vechicleRouter = express.Router()


vechicleRouter.post("/create",isAuth,vehicleController.createVehicle)
vechicleRouter.get("/get-vehicles",isAuth,vehicleController.getVehicles)
vechicleRouter.get("/:id",isAuth,vehicleController.getVehicleById)
vechicleRouter.put("/:id",isAuth,vehicleController.updateVehicle)
vechicleRouter.delete(':id',isAuth,vehicleController.deleteVehicle)

module.exports = vechicleRouter