
const asyncHandler=require('express-async-handler')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../Models/userModel')
const validator = require('validator');
const generateToken = require('../utils/generateToken')
require('dotenv').config()

const userController = {
    register:asyncHandler(async (req, res) => {
      const { username, email, password, role } = req.body;
    
      // Input Validation
      if (!username || !email || !password || !role) {
        res.status(400);
        throw new Error('Please provide all required fields');
      }
    
      if (!validator.isEmail(email)) {
        res.status(400);
        throw new Error('Invalid email format');
      }
    
      if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
      }
    
      if (!['owner', 'professional', 'admin'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role specified');
      }
    
      // Check if user already exists
      const userExists = await User.findOne({ email });
    
      if (userExists) {
        res.status(409); // Conflict status code
        throw new Error('User with this email already exists');
      }
    
      try {
        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
    
        // Create user
        const user = await User.create({
          username,
          email,
          password: hashedPassword, // Store hashed password
          role,
        });
    
        if (user) {
          res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
          });
        } else {
          res.status(500); // Internal server error
          throw new Error('Failed to create user');
        }
      } catch (error) {
        // Handle database errors specifically
        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map((val) => val.message);
          res.status(400);
          throw new Error(`Validation Error: ${messages.join(', ')}`);
        } else {
          console.error('Registration Error:', error);
          res.status(500);
          throw new Error('Internal server error during registration');
        }
      }        
    }),
    
    loginUser : asyncHandler(async (req, res) => {
        const { email, password } = req.body;
      
        // Input Validation
        if (!email || !password) {
          res.status(400);
          throw new Error('Please provide email and password');
        }
      
        if (!validator.isEmail(email)) {
          res.status(400);
          throw new Error('Invalid email format');
        }
      
        try {
          const user = await User.findOne({ email });
      
          if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
              _id: user._id,
              username: user.username,
              email: user.email,
              role: user.role,
              token: generateToken(user._id),
            });
          } else {
            res.status(401); // Unauthorized
            throw new Error('Invalid email or password');
          }
        } catch (error) {
          console.error('Login Error:', error);
          res.status(500); // Internal server error
          throw new Error('Internal server error during login');
        }
      }),
    updateUserProfile: asyncHandler(async (req, res) => {
        const { username, email, password } = req.body;
      
        // Input Validation
        if (email && !validator.isEmail(email)) {
          res.status(400);
          throw new Error('Invalid email format');
        }
      
        if (password && password.length < 6) {
          res.status(400);
          throw new Error('Password must be at least 6 characters long');
        }
      
        try {
          const user = await User.findById(req.user._id);
      
          if (user) {
            user.username = username || user.username;
            user.email = email || user.email;
      
            if (password) {
              const salt = await bcrypt.genSalt(10);
              user.password = await bcrypt.hash(password, salt);
            }
      
            const updatedUser = await user.save();
      
            res.json({
              _id: updatedUser._id,
              username: updatedUser.username,
              email: updatedUser.email,
              role: updatedUser.role,
              token: generateToken(updatedUser._id),
            });
          } else {
            res.status(404);
            throw new Error('User not found');
          }
        } catch (error) {
          console.error('Update User Profile Error:', error);
          res.status(500);
          throw new Error('Internal server error');
        }
      }),
    logoutUser:asyncHandler(async(req,res)=>{
        res.clearCookie('token')
        res.send({message:"Logged out successfully"})
    }),
    getUsers : asyncHandler(async (req, res) => {
        try {
          const users = await User.find({}).select('-password'); // Exclude passwords
      
          res.json(users);
        } catch (error) {
          console.error('Get Users Error:', error);
          res.status(500);
          throw new Error('Internal server error');
        }
      }),
      getUserById: asyncHandler(async (req, res) => {
        try {
          const user = await User.findById(req.params.id).select('-password');
      
          if (user) {
            res.json(user);
          } else {
            res.status(404);
            throw new Error('User not found');
          }
        } catch (error) {
          console.error('Get User by ID Error:', error);
          res.status(500);
          throw new Error('Internal server error');
        }
      }),
    getUserProfile: asyncHandler(async (req, res) => {
        try {
          const user = await User.findById(req.user._id).select('-password'); // Exclude password
      
          if (user) {
            res.json({
              _id: user._id,
              username: user.username,
              email: user.email,
              role: user.role,
            });
          } else {
            res.status(404);
            throw new Error('User not found');
          }
        } catch (error) {
          console.error('Get User Profile Error:', error);
          res.status(500);
          throw new Error('Internal server error');
        }
      }),
      updateUserById : asyncHandler(async (req, res) => {
        const { username, email, role } = req.body;
      
        // Input Validation
        if (email && !validator.isEmail(email)) {
          res.status(400);
          throw new Error('Invalid email format');
        }
      
        if (role && !['owner', 'professional', 'admin'].includes(role)) {
          res.status(400);
          throw new Error('Invalid role specified');
        }
      
        try {
          const user = await User.findById(req.params.id);
      
          if (user) {
            user.username = username || user.username;
            user.email = email || user.email;
            user.role = role || user.role;
      
            const updatedUser = await user.save();
      
            res.json({
              _id: updatedUser._id,
              username: updatedUser.username,
              email: updatedUser.email,
              role: updatedUser.role,
            });
          } else {
            res.status(404);
            throw new Error('User not found');
          }
        } catch (error) {
          console.error('Update User by ID Error:', error);
          res.status(500);
          throw new Error('Internal server error');
        }
      }),
      updateProfileImage:asyncHandler(async(req,res)=>{
        const user = await User.findById(req.user._id);
        
            user.profileImage = req.file.filename;
            const userUpdated = await user.save();
            if(!userUpdated){
                res.status(404).json({message:'User not found'});
            }
            res.json({message:'Profile image updated successfully',userUpdated});


      })
}

module.exports = userController