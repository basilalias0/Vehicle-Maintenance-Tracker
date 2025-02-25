
const Vehicle = require('../Models/vehicleModel');
const MaintenanceTask = require('../Models/maintenanceTaskModel');
const Part = require('../Models/partModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const validator = require('validator');
const mongoose = require('mongoose');
const Admin = require('../Models/adminModel');
const Owner = require('../Models/ownerModel');
const Store = require('../Models/storeModel');
const Vendor = require('../Models/vendorModel');

const adminController = {
    // Register a new admin
    registerAdmin: asyncHandler(async (req, res) => {
        const { username, email, password } = req.body;

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
            // Check if admin already exists
            const adminExists = await Admin.findOne({ email });
            if (adminExists) {
                res.status(409).json({ message: 'Admin with this email already exists' });
                return;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create admin
            const admin = await Admin.create({
                username,
                email,
                password: hashedPassword,
            });

            if (admin) {
                res.status(201).json({
                    _id: admin._id,
                    username: admin.username,
                    email: admin.email,
                    token: generateToken(admin._id),
                });
            } else {
                res.status(500).json({ message: 'Failed to create admin' });
            }
        } catch (error) {
            console.error('Admin Registration Error:', error);
            res.status(500).json({ message: 'Internal server error during registration' });
        }
    }),

    // Login admin
    loginAdmin: asyncHandler(async (req, res) => {
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
            const admin = await Admin.findOne({ email });

            if (admin && (await bcrypt.compare(password, admin.password))) {
                res.json({
                    _id: admin._id,
                    username: admin.username,
                    email: admin.email,
                    token: generateToken(admin._id),
                });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Admin Login Error:', error);
            res.status(500).json({ message: 'Internal server error during login' });
        }
    }),

    // Get admin profile
    getAdminProfile: asyncHandler(async (req, res) => {
        try {
            const admin = await Admin.findById(req.user._id).select('-password');
            if (admin) {
                res.json(admin);
            } else {
                res.status(404).json({ message: 'Admin not found' });
            }
        } catch (error) {
            console.error('Get Admin Profile Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update admin profile
    updateAdminProfile: asyncHandler(async (req, res) => {
        const { username, email, password } = req.body;

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
            const admin = await Admin.findById(req.user._id);

            if (admin) {
                admin.username = username || admin.username;
                admin.email = email || admin.email;

                if (password) {
                    const salt = await bcrypt.genSalt(10);
                    admin.password = await bcrypt.hash(password, salt);
                }

                const updatedAdmin = await admin.save();

                res.json({
                    _id: updatedAdmin._id,
                    username: updatedAdmin.username,
                    email: updatedAdmin.email,
                    token: generateToken(updatedAdmin._id),
                });
            } else {
                res.status(404).json({ message: 'Admin not found' });
            }
        } catch (error) {
            console.error('Update Admin Profile Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get all users (including admins, managers, owners)
    getAllUsers: asyncHandler(async (req, res) => {
        try {
            const admins = await Admin.find({}).select('-password');
            const owners = await Owner.find({}).select('-password');
            const stores = await Store.find({}).select('-password');
            const allUsers = [...admins, ...owners, ...stores];
            res.json(allUsers);
        } catch (error) {
            console.error('Get All Users Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get all stores
    getAllStores: asyncHandler(async (req, res) => {
        try {
            const stores = await Store.find({});
            res.json(stores);
        } catch (error) {
            console.error('Get All Stores Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get all vehicles
    getAllVehicles: asyncHandler(async (req, res) => {
        try {
            const vehicles = await Vehicle.find({});
            res.json(vehicles);
        } catch (error) {
            console.error('Get All Vehicles Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get all maintenance tasks
    getAllMaintenanceTasks: asyncHandler(async (req, res) => {
        try {
            const tasks = await MaintenanceTask.find({});
            res.json(tasks);
        } catch (error) {
            console.error('Get All Maintenance Tasks Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    //Get all parts
    getAllParts: asyncHandler(async (req, res) => {
        try{
            const parts = await Part.find({});
            res.json(parts);
        } catch (error) {
            console.error("Get all parts Error", error);
            res.status(500).json({message: "Internal server error"});
        }
    }),
    //Get all vendors
    getAllVendors: asyncHandler(async (req, res) => {
        try{
            const vendors = await Vendor.find({});
            res.json(vendors);
        } catch (error) {
            console.error("Get all vendors Error", error);
            res.status(500).json({message: "Internal server error"});
        }
    }),
    verifyManager: asyncHandler(async (req, res) => {
        const { managerId } = req.params;
        const adminId = req.user._id; // Assuming admin's ID is in req.user

        if (!mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).json({ message: 'Invalid manager ID' });
        }

        try {
            const manager = await Manager.findById(managerId);

            if (!manager) {
                return res.status(404).json({ message: 'Manager not found' });
            }

            if (manager.verified) {
                return res.status(400).json({ message: 'Manager is already verified' });
            }

            manager.verified = true;
            manager.verifiedBy = adminId; // Set verifiedBy to the admin's ID
            await manager.save();

            res.json({ message: 'Manager verified successfully', manager });
        } catch (error) {
            console.error('Verify Manager Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

module.exports = adminController;