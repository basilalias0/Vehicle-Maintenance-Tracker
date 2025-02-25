const Manager = require('../Models/managerModel');
const Store = require('../Models/storeModel');
const Vehicle = require('../Models/vehicleModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const storeController = {
    // Create a new store
    createStore: asyncHandler(async (req, res) => {
        const { name, address, openingHours, email, phone, location, image, status, managerId, vehiclesRepaired } = req.body;

        // Input Validation
        if (!name || !address || !email || !phone || !managerId) {
            return res.status(400).json({ message: 'Name, address, email, phone, and managerId are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).json({ message: 'Invalid manager ID' });
        }

        try {
            // Check if manager exists and is verified
            const manager = await Manager.findById(managerId);
            if (!manager || !manager.verified) {
                return res.status(400).json({ message: 'Manager not found or not verified' });
            }
            if(manager.storeId){
                return res.status(400).json({message: "Manager already assigned to a store."})
            }

            const store = await Store.create({
                name,
                address,
                openingHours,
                email,
                phone,
                location,
                image,
                status,
                managerId,
                vehiclesRepaired,
            });

            await Manager.findByIdAndUpdate(managerId, { storeId: store._id });

            res.status(201).json(store);
        } catch (error) {
            console.error('Create Store Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    //Add manager by the store manager
    addManagerByStoreManager: asyncHandler(async (req, res) => {
        const { storeId, username, email, password } = req.body;
        const manager = req.user; // The manager who is adding the new manager
    
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({ message: "Invalid store ID" });
        }
    
        if (manager.storeId.toString() !== storeId) {
            return res.status(403).json({ message: "Not authorized to add manager to that store." });
        }
    
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }
    
        try {
            // Check if a manager with the given email already exists
            const existingManager = await Manager.findOne({ email });
            if (existingManager) {
                return res.status(409).json({ message: "Manager with this email already exists." });
            }
    
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
    
            // Create the new manager
            const newManager = await Manager.create({
                username,
                email,
                password: hashedPassword,
                verified: true, // Automatically verified by the store manager
                verifiedBy: manager._id, // Set verifiedBy to the ID of the manager adding the new manager
                storeId: storeId, // Assign the store ID immediately
            });
    
            // Update the store's manager ID
            await Store.findByIdAndUpdate(storeId, { managerId: newManager._id });
    
            res.status(201).json({ message: "Manager added to store successfully.", manager: newManager });
        } catch (error) {
            console.error("Add manager by store manager Error:", error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Internal server error." });
        }
    }),

    // Get all stores
    getStores: asyncHandler(async (req, res) => {
        try {
            const stores = await Store.find({}).populate('managerId').populate('vehiclesRepaired');
            res.status(200).json(stores);
        } catch (error) {
            console.error('Get Stores Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get store by ID
    getStoreById: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid store ID' });
        }

        try {
            const store = await Store.findById(id).populate('managerId').populate('vehiclesRepaired');
            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }
            res.status(200).json(store);
        } catch (error) {
            console.error('Get Store by ID Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update store by ID
    updateStoreById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, address, openingHours, email, phone, location, image, status, managerId, vehiclesRepaired } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid store ID' });
        }

        if (managerId && !mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).json({ message: 'Invalid manager ID' });
        }

        try {
            const store = await Store.findById(id);
            if(store.managerId && managerId && store.managerId.toString() !== managerId){
                await Manager.findByIdAndUpdate(store.managerId, {storeId: null});
            }
            const updatedStore = await Store.findByIdAndUpdate(
                id,
                { name, address, openingHours, email, phone, location, image, status, managerId, vehiclesRepaired },
                { new: true }
            ).populate('managerId').populate('vehiclesRepaired');

            if (!updatedStore) {
                return res.status(404).json({ message: 'Store not found' });
            }

            if (managerId) {
                await Manager.findByIdAndUpdate(managerId, { storeId: updatedStore._id });
            }

            res.status(200).json(updatedStore);
        } catch (error) {
            console.error('Update Store Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Delete store by ID
    deleteStoreById: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid store ID' });
        }

        try {
            const store = await Store.findByIdAndDelete(id);

            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            if (store.managerId) {
                await Manager.findByIdAndUpdate(store.managerId, { storeId: null });
            }

            res.status(200).json({ message: 'Store deleted successfully' });
        } catch (error) {
            console.error('Delete Store Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Add vehicle to store's repaired vehicles
    addVehicleToRepaired: asyncHandler(async (req, res) => {
        const { storeId, vehicleId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(storeId) || !mongoose.Types.ObjectId.isValid(vehicleId)) {
            return res.status(400).json({ message: 'Invalid store or vehicle ID' });
        }

        try {
            const store = await Store.findByIdAndUpdate(
                storeId,
                { $addToSet: { vehiclesRepaired: vehicleId } },
                { new: true }
            ).populate('managerId').populate('vehiclesRepaired');

            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            res.status(200).json(store);
        } catch (error) {
            console.error('Add Vehicle to Repaired Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

module.exports = storeController;