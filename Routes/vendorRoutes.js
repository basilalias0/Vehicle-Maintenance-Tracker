const express = require('express')
const isAuth = require('../Middlewares/isAuth')
const vendorController = require('../Controllers/vendorController')
const vendorRouter = express.Router()

vendorRouter.get('/',isAuth,vendorController.getVendors)
vendorRouter.post('/create',isAuth,vendorController.createVendor)
vendorRouter.delete('/:id', isAuth,vendorController.deleteVendor)
vendorRouter.get('/:id',isAuth,vendorController.getVendorById)
vendorRouter.put("/:id",isAuth,vendorController.updateVendor)

module.exports = vendorRouter