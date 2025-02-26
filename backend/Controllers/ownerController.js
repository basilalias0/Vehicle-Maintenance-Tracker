
const Vehicle = require('../Models/vehicleModel');
const Complaint = require('../Models/complaintModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const validator = require('validator');
const mongoose = require('mongoose');
const Owner = require('../Models/ownerModel');

const ownerController = {
    // Register a new owner
    registerOwner: asyncHandler(async (req, res) => {
        const { username, email, password, firstName, lastName, phoneNumber, address } = req.body;

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
                firstName,
                lastName,
                phoneNumber,
                address,
            });

            if (owner) {
                res.status(201).json({
                    _id: owner._id,
                    username: owner.username,
                    email: owner.email,
                    token: generateToken(owner._id),
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
                    token: generateToken(owner._id),
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
        const { username, email, password, firstName, lastName, phoneNumber, address } = req.body;

        // Input Validation
        if (email && !validator.isEmail(email)) {
            res.status(400).json({ message: 'Invalid email format' });
            return;
        }

        if (password && password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters long' });
            return;
        }

        try {
            const owner = await Owner.findById(req.user._id);

            if (owner) {
                owner.username = username || owner.username;
                owner.email = email || owner.email;
                owner.firstName = firstName || owner.firstName;
                owner.lastName = lastName || owner.lastName;
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
            } else {
                res.status(404).json({ message: 'Owner not found' });
            }
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
};

module.exports = ownerController;