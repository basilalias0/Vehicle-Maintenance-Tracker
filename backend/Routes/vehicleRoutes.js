const express = require('express')
const vehicleController = require('../Controllers/vehicleController')
const { protect } = require('../Middlewares/authMiddleware')

const vechicleRouter = express.Router()


vechicleRouter.post("/create",protect,vehicleController.createVehicle)
vechicleRouter.get("/get-vehicles",protect,vehicleController.getVehicles)
vechicleRouter.get("/:id",protect,vehicleController.getVehicleById)
vechicleRouter.put("/:id",protect,vehicleController.updateVehicle)
vechicleRouter.delete(':id',protect,vehicleController.deleteVehicle)

module.exports = vechicleRouter