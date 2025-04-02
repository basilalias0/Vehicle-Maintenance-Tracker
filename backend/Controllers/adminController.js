const Vehicle = require('../Models/vehicleModel');
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
const MaintenanceTask = require('../Models/maintenanceTaskModel');
const Parts = require('../Models/partsModel');
const Manager = require('../Models/managerModel');
const transporter = require('../utils/emailTransporter');

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
            const hashedPassword = await bcrypt.hash(password, 10);

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
                    token: generateToken(admin._id,admin.role),
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
                    token: generateToken(admin._id,admin.role),
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

    //Update admin profile picture
    updateAdminProfileImage: asyncHandler(async (req, res) => {
        try {
            const admin = await Admin.findById(req.user._id);

            if (!admin) {
                return res.status(404).json({ message: 'Admin not found' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            admin.profilePicture = req.file.path; // Assuming req.file.path contains the Cloudinary URL

            const updatedAdmin = await admin.save();

            res.json({
                _id: updatedAdmin._id,
                username: updatedAdmin.username,
                email: updatedAdmin.email,
                profilePicture: updatedAdmin.profilePicture,
                token: generateToken(updatedAdmin._id),
            });
        } catch (error) {
            console.error('Update Admin Profile Picture Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    
    deleteAdmin: asyncHandler(async (req, res) => {
        const { adminId } = req.params;

        try {
            if (!mongoose.Types.ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: 'Invalid admin ID' });
            }

            const deletedAdmin = await User.findOneAndDelete({ _id: adminId, role: 'admin' });

            if (!deletedAdmin) {
                return res.status(404).json({ message: 'Admin not found or unauthorized' });
            }

            res.json({ message: 'Admin deleted successfully' });
        } catch (error) {
            console.error('Delete Admin Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get all users (including admins, managers, owners)
    getAllUsers: asyncHandler(async (req, res) => {
        const { username, email, role } = req.query;
        let filters = {};
        if (username) filters.username = { $regex: username, $options: 'i' };
        if (email) filters.email = { $regex: email, $options: 'i' };

        try {
            let admins = [], owners = [], stores = [], managers = [];

            if (!role || role === 'admin') admins = await Admin.find(filters).select('-password');
            if (!role || role === 'owner') owners = await Owner.find(filters).select('-password');
            if (!role || role === 'store') stores = await Store.find(filters);
            if (!role || role === 'manager') managers = await Manager.find(filters).select('-password');

            const allUsers = [...admins, ...owners, ...stores, ...managers];
            res.json(allUsers);
        } catch (error) {
            console.error('Get All Users Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    getAllStores: asyncHandler(async (req, res) => {
        const { name, address, managerId } = req.query;
        let filters = {};
        if (name) filters.name = { $regex: name, $options: 'i' };
        if (address) filters.address = { $regex: address, $options: 'i' };
        if (managerId && mongoose.Types.ObjectId.isValid(managerId)) filters.managerId = managerId;

        try {
            const stores = await Store.find(filters);
            res.json(stores);
        } catch (error) {
            console.error('Get All Stores Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    getAllVehicles: asyncHandler(async (req, res) => {
        const { make, model, ownerId } = req.query;
        let filters = {};
        if (make) filters.make = { $regex: make, $options: 'i' };
        if (model) filters.model = { $regex: model, $options: 'i' };
        if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) filters.ownerId = ownerId;

        try {
            const vehicles = await Vehicle.find(filters);
            res.json(vehicles);
        } catch (error) {
            console.error('Get All Vehicles Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    getAllMaintenanceTasks: asyncHandler(async (req, res) => {
        const { vehicleId, taskType, storeId, vendorId } = req.query;
        let filters = {};
        if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) filters.vehicleId = vehicleId;
        if (taskType) filters.taskType = { $regex: taskType, $options: 'i' };
        if (storeId && mongoose.Types.ObjectId.isValid(storeId)) filters.storeId = storeId;
        if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) filters.vendorId = vendorId;

        try {
            const tasks = await MaintenanceTask.find(filters);
            res.json(tasks);
        } catch (error) {
            console.error('Get All Maintenance Tasks Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    getAllParts: asyncHandler(async (req, res) => {
        const { partNumber, description, vendorId } = req.query;
        let filters = {};
        if (partNumber) filters.partNumber = { $regex: partNumber, $options: 'i' };
        if (description) filters.description = { $regex: description, $options: 'i' };
        if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) filters.vendorId = vendorId;

        try {
            const parts = await Parts.find(filters);
            res.json(parts);
        } catch (error) {
            console.error('Get all Parts Error', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    getAllVendors: asyncHandler(async (req, res) => {
        const { name, specialization } = req.query;
        let filters = {};
        if (name) filters.name = { $regex: name, $options: 'i' };
        if (specialization) filters.specialization = { $regex: specialization, $options: 'i' };

        try {
            const vendors = await Vendor.find(filters);
            res.json(vendors);
        } catch (error) {
            console.error('Get all vendors Error', error);
            res.status(500).json({ message: 'Internal server error' });
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
    verifyAdmin: asyncHandler(async (req, res) => {
        const { adminId } = req.params;
        const verifyingAdminId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({ message: 'Invalid admin ID' });
        }

        if (adminId === verifyingAdminId.toString()) {
            return res.status(400).json({ message: 'Admin cannot verify themselves.' });
        }

        try {
            const adminToVerify = await Admin.findById(adminId);
            const verifyingAdmin = await Admin.findById(verifyingAdminId);

            if (!adminToVerify) {
                return res.status(404).json({ message: 'Admin to verify not found' });
            }

            if (!verifyingAdmin) {
                return res.status(404).json({ message: 'Verifying admin not found' });
            }

            if (!verifyingAdmin.verified) {
                return res.status(403).json({ message: 'Only verified admins can verify other admins.' });
            }

            if (adminToVerify.verified) {
                return res.status(400).json({ message: 'Admin is already verified' });
            }

            adminToVerify.verified = true;
            adminToVerify.verifiedBy = verifyingAdminId;
            await adminToVerify.save();

            res.json({ message: 'Admin verified successfully', admin: adminToVerify });
        } catch (error) {
            console.error('Verify Admin Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;
  
        const user = await Admin.findOne({ email });
  
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
  
        const user = await Admin.findOne({ email });
  
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
};

module.exports = adminController;