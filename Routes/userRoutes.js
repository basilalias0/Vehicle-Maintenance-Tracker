const express = require('express')
const userController = require('../Controllers/userController')
const upload = require('../Middlewares/imageUpload')
const userRouter = express.Router()


userRouter.post("/register",upload.single('imageUrl'),userController.register)
userRouter.post("/login",userController.loginUser)
userRouter.get('/logout',userController.logoutUser)

module.exports = userRouter