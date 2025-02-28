const Manager = require('../Models/managerModel');
const Store = require('../Models/storeModel');
const Vehicle = require('../Models/vehicleModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs')

const storeController = {
    // Create a new store
    

createStore: asyncHandler(async (req, res) => {
    const { name, address, openingHours, email, phone, location, status, vehiclesRepaired } = req.body;
    const manager = req.user;

    // Input Validation
    if (!name || !address || !email || !phone) {
        return res.status(400).json({ message: 'Name, address, email, and phone are required' });
    }

    if (!manager.verified) {
        return res.status(400).json({ message: 'Manager not verified' });
    }

    if (manager.storeId) {
        return res.status(400).json({ message: 'Manager already assigned to a store' });
    }

    try {
        let locationData = {};
        if (address) {
            const encodedAddress = encodeURIComponent(address);

            // Nominatim API call with User-Agent
            const nominatimResponse = await axios.get(
                `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
                {
                    headers: {
                        'User-Agent': 'Vehicle-Maintanance_Tracker/1.0' // Replace with your app name
                    }
                }
            );

            if (nominatimResponse.data && nominatimResponse.data.length > 0) {
                const { lat, lon } = nominatimResponse.data[0];
                locationData = {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                };
            } else {
                console.log('No geocoding data found. Saving store without coordinates.');
                // Optionally, you could throw an error here if coordinates are mandatory:
                throw new Error('Could not geocode address');
            }
        }

        // Create the store
        const store = await Store.create({
            name,
            address,
            openingHours,
            email,
            phone,
            location: Object.keys(locationData).length > 0 ? locationData : null, // Only set if coordinates exist
            image: req.file ? req.file.path : null,
            status: status || 'open', // Default status if not provided
            managerId: [manager._id],
            vehiclesRepaired,
        });

        // Update manager with store ID
        await Manager.findByIdAndUpdate(manager._id, { storeId: store._id });

        res.status(201).json(store);
    } catch (error) {
        console.error('Create Store Error:', error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ 
            message: 'Internal server error', 
            details: error.message 
        });
    }
}),

    //Add manager by the store manager
    addManagerByStoreManager: asyncHandler(async (req, res) => {
        const { username, email, password } = req.body;
        const manager = req.user;
        const storeId = manager.storeId; // Get storeId from the logged-in manager
    
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({ message: "Invalid store ID" });
        }
    
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }
    
        try {
            const existingManager = await Manager.findOne({ email });
            if (existingManager) {
                return res.status(409).json({ message: "Manager with this email already exists." });
            }
    
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
    
            const newManager = await Manager.create({
                username,
                email,
                password: hashedPassword,
                verified: true,
                verifiedBy: manager._id,
                storeId: storeId,
            });
    
            const store = await Store.findById(storeId);
            store.managerId.push(newManager._id);
            await store.save();
    
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
        const { name, address, openingHours, email, phone, location, image, status, vehiclesRepaired } = req.body;
        const manager = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid store ID' });
        }

        try {
            const store = await Store.findById(id);

            if (!store.managerId.includes(manager._id)) {
                return res.status(403).json({ message: 'Not authorized to update this store' });
            }

            const updatedStore = await Store.findByIdAndUpdate(
                id,
                { name, address, openingHours, email, phone, location, image, status, vehiclesRepaired },
                { new: true }
            ).populate('managerId').populate('vehiclesRepaired');

            if (!updatedStore) {
                return res.status(404).json({ message: 'Store not found' });
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

    // Add vehicle to store's repaired vehicles
    addVehicleToRepaired: asyncHandler(async (req, res) => {
        const { storeId, vehicleId } = req.body;
        const manager = req.user;

        if (!mongoose.Types.ObjectId.isValid(storeId) || !mongoose.Types.ObjectId.isValid(vehicleId)) {
            return res.status(400).json({ message: 'Invalid store or vehicle ID' });
        }

        try {
            const store = await Store.findById(storeId);

            if (!store.managerId.includes(manager._id)) {
                return res.status(403).json({ message: 'Not authorized to add vehicle to this store' });
            }

            const updatedStore = await Store.findByIdAndUpdate(
                storeId,
                { $addToSet: { vehiclesRepaired: vehicleId } },
                { new: true }
            ).populate('managerId').populate('vehiclesRepaired');

            if (!updatedStore) {
                return res.status(404).json({ message: 'Store not found' });
            }

            res.status(200).json(updatedStore);
        } catch (error) {
            console.error('Add Vehicle to Repaired Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    requestStoreDeletion: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const manager = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid store ID' });
        }

        try {
            const store = await Store.findById(id);

            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            if (!store.managerId.includes(manager._id)) {
                return res.status(403).json({ message: 'Not authorized to request deletion of this store' });
            }

            store.deletionRequested = true;
            await store.save();

            res.status(200).json({ message: 'Deletion request submitted successfully' });
        } catch (error) {
            console.error('Request Store Deletion Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Delete store by ID (admin only)
    deleteStoreById: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid store ID' });
        }

        try {
            const store = await Store.findById(id);

            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            if (!store.deletionRequested) {
                return res.status(400).json({message: "Deletion was not requested by the manager."})
            }

            await Store.findByIdAndDelete(id);

            if (store.managerId) {
                store.managerId.forEach(async manager => {
                    await Manager.findByIdAndUpdate(manager, { storeId: null });
                })
            }

            res.status(200).json({ message: 'Store deleted successfully' });
        } catch (error) {
            console.error('Delete Store Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get all deletion requests (admin only)
    getDeletionRequests: asyncHandler(async (req, res) => {
        try {
            const deletionRequests = await Store.find({ deletionRequested: true }).populate('managerId');
            res.status(200).json(deletionRequests);
        } catch (error) {
            console.error('Get Deletion Requests Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};


module.exports = storeController;