const Vehicle = require('../Models/vehicleModel');
const MaintenanceTask = require('../Models/maintenanceTaskModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const validator = require('validator');
const Manager = require('../Models/managerModel');
const mongoose = require('mongoose');
const Store = require('../Models/storeModel');
const Vendor = require('../Models/vendorModel');


const managerController = {
    // Register a new manager
    registerManager: asyncHandler(async (req, res) => {
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
            // Check if manager already exists
            const managerExists = await Manager.findOne({ email });
            if (managerExists) {
                res.status(409).json({ message: 'Manager with this email already exists' });
                return;
            }

            // Check if store exists
            // const store = await Store.findById(storeId);
            // if (!store) {
            //     res.status(400).json({ message: 'Invalid store ID' });
            //     return;
            // }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create manager
            const manager = await Manager.create({
                username,
                email,
                password: hashedPassword,
            });

            if (manager) {

                res.status(201).json({
                    _id: manager._id,
                    username: manager.username,
                    email: manager.email,
                    profilePicture:manager.profilePicture,
                    token: generateToken(manager._id,manager.role),
                });
            } else {
                res.status(500).json({ message: 'Failed to create manager' });
            }
        } catch (error) {
            console.error('Manager Registration Error:', error);
            res.status(500).json({ message: 'Internal server error during registration' });
        }
    }),

    // Login manager
    loginManager: asyncHandler(async (req, res) => {
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
            const manager = await Manager.findOne({ email });

            if (manager && (await bcrypt.compare(password, manager.password))) {
                res.json({
                    _id: manager._id,
                    username: manager.username,
                    email: manager.email,
                    profilePicture:manager.profilePicture,
                    token: generateToken(manager._id,manager.role),
                });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Manager Login Error:', error);
            res.status(500).json({ message: 'Internal server error during login' });
        }
    }),

    // Get manager profile
    getManagerProfile: asyncHandler(async (req, res) => {
        try {
            const manager = await Manager.findById(req.user._id).select('-password').populate('storeId');
            if (manager) {
                res.json(manager);
            } else {
                res.status(404).json({ message: 'Manager not found' });
            }
        } catch (error) {
            console.error('Get Manager Profile Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update manager profile
    addManagerToStore: asyncHandler(async (req, res) => {
        const { email } = req.body;
        const loggedInManager = await Manager.findById(req.user._id).populate('storeId');

        if (!loggedInManager) {
            return res.status(404).json({ message: 'Logged-in manager not found' });
        }

        if (!loggedInManager.storeId) {
            return res.status(400).json({ message: 'Logged-in manager is not associated with a store' });
        }

        try {
            const newManager = await Manager.findOne({ email });

            if (!newManager) {
                return res.status(404).json({ message: 'Manager with this email not found' });
            }

            if (newManager.storeId) {
                return res.status(400).json({ message: 'Manager is already assigned to a store' });
            }

            // Automatically verify the new manager
            newManager.verified = true;

            // Add manager to store managers array
            const store = await Store.findById(loggedInManager.storeId._id);
            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            store.managerId.push(newManager._id);
            await store.save();

            newManager.storeId = loggedInManager.storeId._id;
            await newManager.save();

            res.status(200).json({ message: 'Manager added to store and verified successfully' });
        } catch (error) {
            console.error('Add Manager to Store Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    updateManagerProfileImage: asyncHandler(async (req, res) => {
        try {
            const manager = await Manager.findById(req.user._id);

            if (!manager) {
                return res.status(404).json({ message: 'Manager not found' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            manager.profilePicture = req.file.path; // Assuming req.file.path contains the Cloudinary URL

            const updatedManager = await manager.save();

            res.json({
                _id: updatedManager._id,
                username: updatedManager.username,
                email: updatedManager.email,
                profilePicture: updatedManager.profilePicture,
                token: generateToken(updatedManager._id),
            });
        } catch (error) {
            console.error('Update Manager Profile Picture Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    getManagers: asyncHandler(async (req, res) => {
        try {
            const managers = await Manager.find({}); // Retrieve all managers

            res.json(managers);
        } catch (error) {
            console.error('Get Managers Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    getManagersInMyStore: asyncHandler(async (req, res) => {
        try {
            const loggedInManager = await Manager.findById(req.user._id);
    
            if (!loggedInManager) {
                return res.status(404).json({ message: 'Manager not found' });
            }
    
            if (!loggedInManager.storeId) {
                return res.status(400).json({ message: 'Manager is not associated with a store' });
            }
    
            const managers = await Manager.find({ storeId: loggedInManager.storeId });
    
            res.json(managers);
        } catch (error) {
            console.error('Get Managers in My Store Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    getManagerById: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid manager ID' });
        }

        try {
            const manager = await Manager.findById(id);

            if (!manager) {
                return res.status(404).json({ message: 'Manager not found' });
            }

            res.json(manager);
        } catch (error) {
            console.error('Get Manager by ID Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    updateManagerProfile: asyncHandler(async (req, res) => {
        const { username, email, password } = req.body;

        if (email && !validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (password && password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        try {
            const manager = await Manager.findById(req.user._id);

            if (!manager) {
                return res.status(404).json({ message: 'Manager not found' });
            }

            manager.username = username || manager.username;
            manager.email = email || manager.email;

            if (password) {
                const salt = await bcrypt.genSalt(10);
                manager.password = await bcrypt.hash(password, salt);
            }

            const updatedManager = await manager.save();

            res.json({
                _id: updatedManager._id,
                username: updatedManager.username,
                email: updatedManager.email,
                token: generateToken(updatedManager._id),
            });
        } catch (error) {
            console.error('Update Manager Profile Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get manager's store vehicles
    getManagerStoreVehicles: asyncHandler(async (req, res) => {
        try {
            const manager = await Manager.findById(req.user._id).populate('storeId');
            if (!manager) {
                res.status(404).json({ message: 'Manager not found' });
                return;
            }

            const vehicles = await Vehicle.find({ maintenanceStores: manager.storeId._id });
            res.json(vehicles);
        } catch (error) {
            console.error('Get Manager Store Vehicles Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get manager's store maintenance tasks
    getManagerStoreMaintenanceTasks: asyncHandler(async (req, res) => {
        try {
            const manager = await Manager.findById(req.user._id).populate('storeId');
            if (!manager) {
                res.status(404).json({ message: 'Manager not found' });
                return;
            }

            const tasks = await MaintenanceTask.find({ storeId: manager.storeId._id });
            res.json(tasks);
        } catch (error) {
            console.error('Get Manager Store Maintenance Tasks Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update maintenance task status
    updateMaintenanceTaskStatus: asyncHandler(async (req, res) => {
        const { taskId, status } = req.body;

        try {
            const task = await MaintenanceTask.findById(taskId);
            if (!task) {
                res.status(404).json({ message: 'Maintenance task not found' });
                return;
            }

            // Check if task belongs to manager's store
            const manager = await Manager.findById(req.user._id).populate('storeId');
            if (task.storeId.toString() !== manager.storeId._id.toString()) {
                res.status(403).json({ message: 'Unauthorized to update this task' });
                return;
            }

            task.taskStatus = status;
            await task.save();

            res.json({ message: 'Maintenance task status updated successfully' });
        } catch (error) {
            console.error('Update Maintenance Task Status Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update vehicle status
    updateVehicleStatus: asyncHandler(async (req, res) => {
        const { vehicleId, status } = req.body;

        try {
            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle) {
                res.status(404).json({ message: 'Vehicle not found' });
                return;
            }

            // Check if vehicle belongs to manager's store (check maintenanceStores array)
            const manager = await Manager.findById(req.user._id).populate('storeId');
            if (!vehicle.maintenanceStores.some(store => store.toString() === manager.storeId._id.toString())) {
                res.status(403).json({ message: 'Unauthorized to update this vehicle' });
                return;
            }

            vehicle.status = status;
            await vehicle.save();

            res.json({ message: 'Vehicle status updated successfully' });
        } catch (error) {
            console.error('Update Vehicle Status Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get parts inventory for manager's store
    getPartsInventory: asyncHandler(async (req, res) => {
        try {
            const manager = await Manager.findById(req.user._id).populate('storeId');
            if (!manager) {
                res.status(404).json({ message: 'Manager not found' });
                return;
            }

            const parts = await Part.find({ vendorId: { $in: await getVendorsForStore(manager.storeId._id) } }); // Assuming you have a function to get vendors for a store
            res.json(parts);
        } catch (error) {
            console.error('Get Parts Inventory Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Add new part to inventory
    addPartToInventory: asyncHandler(async (req, res) => {
        const { partNumber, description, price, vendorId, stockQuantity, image } = req.body;

        try {
            const manager = await Manager.findById(req.user._id).populate('storeId');
            if (!manager) {
                res.status(404).json({ message: 'Manager not found' });
                return;
            }

            // Validate vendorId (check if vendor belongs to manager's store)
            if (!await isVendorInStore(vendorId, manager.storeId._id)) {
                res.status(400).json({ message: 'Invalid vendor ID' });
                return;
            }

            const part = await Part.create({ partNumber, description, price, vendorId, stockQuantity, image });
            res.status(201).json(part);
        } catch (error) {
            console.error('Add Part to Inventory Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

// Helper function (replace with your actual implementation)
async function getVendorsForStore(storeId) {
    try {
        const vendors = await Vendor.find({ storeId: storeId });
        return vendors;
    } catch (error) {
        console.error('Error retrieving vendors for store:', error);
        return []; // Return an empty array in case of an error
    }
}

async function isVendorInStore(vendorId, storeId) {
    try {
        if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(storeId)) {
            return false;
        }

        const vendor = await Vendor.findOne({ _id: vendorId, storeId: storeId });
        return !!vendor; // Returns true if vendor is found, false otherwise
    } catch (error) {
        console.error('Error checking if vendor is in store:', error);
        return false;
    }
}


module.exports = managerController;