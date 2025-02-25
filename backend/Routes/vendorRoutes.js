const express = require('express')
const vendorController = require('../Controllers/vendorController')
const { protect } = require('../Middlewares/authMiddleware')
const vendorRouter = express.Router()


vendorRouter.get('/',protect,vendorController.getVendors)
vendorRouter.post('/create',protect,vendorController.createVendor)
vendorRouter.delete('/:id', protect,vendorController.deleteVendor)
vendorRouter.get('/:id',protect,vendorController.getVendorById)
vendorRouter.put("/:id",protect,vendorController.updateVendor)

module.exports = vendorRouter