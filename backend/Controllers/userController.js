
const asyncHandler=require('express-async-handler')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../Models/userModel')
require('dotenv').config()

const userController = {
    register:asyncHandler(async(req,res)=>{
        const {name,password,email} = req.body
        if(!name ||!email ||!password){
            throw new Error("Data incomplete!!")
        }
        
        const emailFound = await User.findOne({email})
        if(emailFound){
            throw new Error("User already exist!!")
        }
            const hashedPassword = await bcrypt.hash(password,10)
            if(!hashedPassword){
                throw new Error("Error hashing password!!")
            }
            const createdUser = await User.create({
                name,
                email,
                password:hashedPassword,
                profileImage:req.file.path
            }) 
            if(!createdUser){
                throw new Error("User didn't created")
            }
            const payload={
                name,
                email,
                id:createdUser._id,
                }
                
                const token = jwt.sign(payload,process.env.JWT_SECRET_KEY)


                res.cookie('token',token,{
                    maxAge:1*24*60*60*1000,
                    sameSite:'none',
                    httpOnly:true,
                    secure:true

                })
                res.json({
                    message:"User created successfully!!",
                    token
                })
           
        
    }),
    loginUser : asyncHandler(async(req,res)=>{
        const {email,password} = req.body

        const userFound = await User.findOne({email})
        if(!userFound){
            throw new Error("User does not exist")
        }
        const comparedPassword = await bcrypt.compare(password,userFound.password)
        if (!comparedPassword){
                throw new Error("Password does not match")
        }
        const payload={
            name:userFound.name,
            email:userFound.email,
            id:userFound._id,
            }
         const token = jwt.sign(payload,process.env.JWT_SECRET_KEY)


        res.cookie('token',token,{
        maxAge:1*24*60*60*1000,
        sameSite:'none',
        httpOnly:true,
        secure:true
         })
        res.json({
        token,
        profileImage:userFound.profileImage
         })
    }),
    updatePassword:asyncHandler(async(req,res)=>{
        const {newPassword,oldPassword} = req.body
        

        const {email} = req.user
        const userFound = await User.findOne({email})
        if(!userFound){
            throw new Error("User Not Found")
        }
        const passwordMatch = await bcrypt.compare(oldPassword,userFound.password)
        if(!passwordMatch){
            throw new Error("Old password incorrect")
        }
        const hashedPassword =await bcrypt.hash(newPassword,10)
        const passwordChanged = await User.updateOne({email},{password:hashedPassword})
        if(!passwordChanged){
            throw new Error("Password not changed")
        }
        const payload={
            name:userFound.name,
            email:userFound.email,
            id:userFound._id,
            }
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
        res.cookie('token',token,{
            maxAge:1*24*60*60*1000,
            httpOnly:true,
            secure:true,
            sameSite:'none'
        })
        res.json({
            token,
            // profileImage:userFound.profileImage
            })
        
    }),
    updateName: asyncHandler(async(req,res)=>{
        const {name} = req.body
        const {email} = req.user
        
        const updatedUser = await User.updateOne({email},{name})
        if(!updatedUser){
            throw new Error("Name not updated")
        }
        const userFound = await User.findOne({email})


        const payload={
            name:userFound.name,
            email:userFound.email,
            id:userFound._id,
            }
            const token = jwt.sign(payload,process.env.JWT_SECRET_KEY)
    
    
            res.cookie('token',token,{
                maxAge:1*24*60*60*1000,
                secure:true,
                sameSite:'none',
                httpOnly:true,
    
            })
            res.json({
                token,
                profileImage:userFound.profileImage
            })
    }),
    logoutUser:asyncHandler(async(req,res)=>{
        res.clearCookie('token')
        res.send({message:"Logged out successfully"})
    })
}

module.exports = userController