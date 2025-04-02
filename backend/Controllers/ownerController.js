
const Vehicle = require('../Models/vehicleModel');
const Complaint = require('../Models/complaintModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const validator = require('validator');
const mongoose = require('mongoose');
const Owner = require('../Models/ownerModel');
const transporter = require('../utils/emailTransporter');

const ownerController = {
    // Register a new owner
    registerOwner: asyncHandler(async (req, res) => {
        const { username, email, password, phoneNumber, address } = req.body;

        // Input Validation
        if (!username || !email || !password) {
            res.status(400).json({ message: 'Please provide all required fields' });
            return;
        }

        if (!validator.isEmail(email)) {
            res.status(400).json({ message: 'Invalid email format' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters long' });
            return;
        }

        try {
            // Check if owner already exists
            const ownerExists = await Owner.findOne({ email });
            if (ownerExists) {
                res.status(409).json({ message: 'Owner with this email already exists' });
                return;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create owner
            const owner = await Owner.create({
                username,
                email,
                password: hashedPassword,
                phoneNumber,
                address,
            });

            if (owner) {
                res.status(201).json({
                    _id: owner._id,
                    username: owner.username,
                    email: owner.email,
                    token: generateToken(owner._id,owner.role),
                });
            } else {
                res.status(500).json({ message: 'Failed to create owner' });
            }
        } catch (error) {
            console.error('Owner Registration Error:', error);
            res.status(500).json({ message: 'Internal server error during registration' });
        }
    }),

    // Login owner
    loginOwner: asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        // Input Validation
        if (!email || !password) {
            res.status(400).json({ message: 'Please provide email and password' });
            return;
        }

        if (!validator.isEmail(email)) {
            res.status(400).json({ message: 'Invalid email format' });
            return;
        }

        try {
            const owner = await Owner.findOne({ email });

            if (owner && (await bcrypt.compare(password, owner.password))) {
                res.json({
                    _id: owner._id,
                    username: owner.username,
                    email: owner.email,
                    token: generateToken(owner._id,owner.role),
                });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Owner Login Error:', error);
            res.status(500).json({ message: 'Internal server error during login' });
        }
    }),

    // Get owner profile
    getOwnerProfile: asyncHandler(async (req, res) => {
        try {
            const owner = await Owner.findById(req.user._id).select('-password');
            if (owner) {
                res.json(owner);
            } else {
                res.status(404).json({ message: 'Owner not found' });
            }
        } catch (error) {
            console.error('Get Owner Profile Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update owner profile
    updateOwnerProfile: asyncHandler(async (req, res) => {
            const { username, email, password, phoneNumber, address } = req.body;
        
            // Input Validation
            if (email && !validator.isEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
        
            if (password && password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }
        
            try {
                const owner = await Owner.findById(req.user._id);
        
                if (!owner) {
                    return res.status(404).json({ message: 'Owner not found' });
                }
        
                // Check if email is already taken by another owner
                if (email && email !== owner.email) {
                    const emailExists = await Owner.findOne({ email });
                    if (emailExists) {
                        return res.status(409).json({ message: 'Email is already taken by another user' });
                    }
                }
        
                owner.username = username || owner.username;
                owner.email = email || owner.email;
                owner.phoneNumber = phoneNumber || owner.phoneNumber;
                owner.address = address || owner.address;
        
                if (password) {
                    const salt = await bcrypt.genSalt(10);
                    owner.password = await bcrypt.hash(password, salt);
                }
        
                const updatedOwner = await owner.save();
        
                res.json({
                    _id: updatedOwner._id,
                    username: updatedOwner.username,
                    email: updatedOwner.email,
                    token: generateToken(updatedOwner._id),
                });
            } catch (error) {
                console.error('Update Owner Profile Error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        }),
    // Get owner vehicles
    getOwnerVehicles: asyncHandler(async (req, res) => {
        try {
            const owner = await Owner.findById(req.user._id).populate('vehicles');
            if (owner) {
                res.json(owner.vehicles);
            } else {
                res.status(404).json({ message: 'Owner not found' });
            }
        } catch (error) {
            console.error('Get Owner Vehicles Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    // Get owner complaints
    getOwnerComplaints: asyncHandler(async (req, res) => {
        try {
            const owner = await Owner.findById(req.user._id).populate('complaints');
            if (owner) {
                res.json(owner.complaints);
            } else {
                res.status(404).json({ message: 'Owner not found' });
            }
        } catch (error) {
            console.error('Get Owner Complaints Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    // Add payment method
    addPaymentMethod: asyncHandler(async (req, res) => {
        const { type, details } = req.body;
        try {
            const owner = await Owner.findById(req.user._id);
            if (owner) {
                owner.paymentMethods.push({ type, details });
                await owner.save();
                res.status(201).json({ message: 'Payment method added successfully' });
            } else {
                res.status(404).json({ message: 'Owner not found' });
            }
        } catch (error) {
            console.error('Add Payment Method Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    updateOwnerProfileImage: asyncHandler(async (req, res) => {
        try {
            const owner = await Owner.findById(req.user._id);

            if (!owner) {
                return res.status(404).json({ message: 'Owner not found' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            owner.profilePicture = req.file.path; // Assuming req.file.path contains the Cloudinary URL or file path

            const updatedOwner = await owner.save();

            res.json({
                _id: updatedOwner._id,
                username: updatedOwner.username,
                email: updatedOwner.email,
                profilePicture: updatedOwner.profilePicture,
                token: generateToken(updatedOwner._id),
            });
        } catch (error) {
            console.error('Update Owner Profile Picture Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;
  
        const user = await Owner.findOne({ email });
  
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
  
        const resetPin = randomatic('0',6)
        
        user.resetPin = resetPin;
        user.resetPinExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  
        console.log(await user.save());
         
  
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: 'Password Reset Pin',
            text: `Your password reset pin is: ${resetPin}`,
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(500).json({ message: 'Failed to send email' });
            } else {
                console.log('Email sent: ' + info.response);
                res.json({ message: 'Reset pin sent to your email' });
            }
        });
    }),
  
    // @desc    Reset password using pin
    // @route   PUT /api/users/resetpassword
    // @access  Public
    resetPassword: asyncHandler(async (req, res) => {
        const { email, pin, password } = req.body;
  
        const user = await Owner.findOne({ email });
  
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
  
        if (user.resetPin !== pin || user.resetPinExpiry < Date.now()) {
            res.status(400);
            throw new Error('Invalid or expired reset pin');
        }
  
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
  
        user.password = hashedPassword;
        user.resetPin = undefined; // Clear reset pin
        user.resetPinExpiry = undefined;
  
        await user.save();
  
        res.json({ message: 'Password reset successfully' });
    }),

    deleteOwner: asyncHandler(async (req, res) => {
        const ownerId = req.user._id; // Get the ID of the currently logged-in owner

        try {
            if (!mongoose.Types.ObjectId.isValid(ownerId)) {
                return res.status(400).json({ message: 'Invalid owner ID' });
            }

            const deletedOwner = await User.findByIdAndDelete(ownerId);

            if (!deletedOwner) {
                return res.status(404).json({ message: 'Owner not found' });
            }

            res.json({ message: 'Owner deleted successfully' });
        } catch (error) {
            console.error('Delete Owner Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

module.exports = ownerController;