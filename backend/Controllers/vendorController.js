const Vendor = require('../Models/vendorModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const generateToken = require('../utils/generateToken'); // Create this utility
const bcrypt = require('bcryptjs')

const vendorController = {
    // Self-registration for vendors (public endpoint)
    registerVendor : asyncHandler(async (req, res) => {
    const { name, contactPerson, phoneNumber, email, password, address, specialization, website } = req.body;

    if (!name || !email || !password || !address || !specialization || !Array.isArray(specialization) || specialization.length === 0) {
        return res.status(400).json({ message: 'Name, email, password, address, and at least one specialization are required' });
    }

    try {
        const vendorExists = await Vendor.findOne({ email });
        if (vendorExists) {
            return res.status(400).json({ message: 'Vendor already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const vendor = await Vendor.create({
            name,
            contactPerson,
            phoneNumber,
            email,
            password:hashedPassword,
            address,
            specialization,
            website,
            verified: false,
        });

        res.status(201).json({
            _id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            token: generateToken(vendor._id, 'vendor'),
        });
    } catch (error) {
        console.error('Vendor Registration Error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}),

loginVendor: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const vendor = await Vendor.findOne({ email });

        if (!vendor) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const passwordMatch = await bcrypt.compare(password, vendor.password);

        if (passwordMatch) {
            res.json({
                _id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                token: generateToken(vendor._id, 'vendor'),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Vendor Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}),

    // Get all vendors (admin only)
    getVendors: asyncHandler(async (req, res) => {
        try {
            const vendors = await Vendor.find();
            res.status(200).json(vendors);
        } catch (error) {
            console.error('Get Vendors Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get a vendor by ID (admin only)
    getVendorById: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid vendor ID' });
        }

        try {
            const vendor = await Vendor.findById(id);
            if (!vendor) {
                return res.status(404).json({ message: 'Vendor not found' });
            }
            res.status(200).json(vendor);
        } catch (error) {
            console.error('Get Vendor by ID Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update a vendor by ID (admin only)
    updateVendor: asyncHandler(async (req, res) => {
        const id  = req.user.id;
        const { name, contactPerson, phoneNumber, email, address, specialization, website, verified } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid vendor ID' });
        }

        try {
            const vendor = await Vendor.findById(id);

            if (!vendor) {
                return res.status(404).json({ message: 'Vendor not found' });
            }

            const updatedVendor = await Vendor.findByIdAndUpdate(
                id,
                { name, contactPerson, phoneNumber, email, address, specialization, website, verified },
                { new: true, runValidators: true }
            );

            res.status(200).json(updatedVendor);
        } catch (error) {
            console.error('Update Vendor Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Delete a vendor by ID (admin only)
    deleteVendor: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid vendor ID' });
        }

        try {
            const deletedVendor = await Vendor.findByIdAndDelete(id);

            if (!deletedVendor) {
                return res.status(404).json({ message: 'Vendor not found' });
            }

            res.status(200).json({ message: 'Vendor deleted successfully' });
        } catch (error) {
            console.error('Delete Vendor Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Verify a vendor (admin only)
    verifyVendor: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid vendor ID' });
        }

        try {
            const vendor = await Vendor.findByIdAndUpdate(id, { verified: true }, { new: true });
            if (!vendor) {
                return res.status(404).json({ message: 'Vendor not found' });
            }
            res.status(200).json({ message: 'Vendor verified successfully', vendor });
        } catch (error) {
            console.error('Verify Vendor Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

module.exports = vendorController;