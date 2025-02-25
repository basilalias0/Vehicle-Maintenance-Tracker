const Vendor = require('../Models/vendorModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const vendorController = {
    createVendor: asyncHandler(async (req, res) => {
        const { name, contactPerson, phoneNumber, email, address, specialization, website } = req.body;

        // Input Validation
        if (!name || !address || !specialization) {
            return res.status(400).json({ message: 'Name, address, and specialization are required' });
        }

        try {
            const vendor = await Vendor.create({
                name,
                contactPerson,
                phoneNumber,
                email,
                address,
                specialization,
                website,
            });

            res.status(201).json(vendor);
        } catch (error) {
            console.error('Create Vendor Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    getVendors: asyncHandler(async (req, res) => {
        try {
            const vendors = await Vendor.find();
            res.status(200).json(vendors);
        } catch (error) {
            console.error('Get Vendors Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

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

    updateVendor: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, contactPerson, phoneNumber, email, address, specialization, website } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid vendor ID' });
        }

        try {
            const updatedVendor = await Vendor.findByIdAndUpdate(
                id,
                { name, contactPerson, phoneNumber, email, address, specialization, website },
                { new: true, runValidators: true }
            );

            if (!updatedVendor) {
                return res.status(404).json({ message: 'Vendor not found' });
            }

            res.status(200).json(updatedVendor);
        } catch (error) {
            console.error('Update Vendor Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

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
};

module.exports = vendorController;