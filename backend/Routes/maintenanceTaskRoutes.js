const express = require('express')
const isAuth = require('../Middlewares/isAuth')
const maintenanceTaskController = require('../Controllers/mantenanceTaskController')
const maintenanceTaskRouter = express.Router()

maintenanceTaskRouter.get("/",isAuth,maintenanceTaskController.createTask)
maintenanceTaskRouter.post("/create",isAuth,maintenanceTaskController.getAllTasks)
maintenanceTaskRouter.get("/:id",isAuth,maintenanceTaskController.getTaskById)
maintenanceTaskRouter.put("/:id",isAuth,maintenanceTaskController.updateTask)
maintenanceTaskRouter.delete("/:id",isAuth,maintenanceTaskController.getTaskById)

module.exports = maintenanceTaskRouter