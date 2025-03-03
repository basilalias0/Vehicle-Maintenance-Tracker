const Vendor = require('../Models/vendorModel'); // Import Vendor model
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Parts = require('../Models/partsModel');

const partController = {
    // Create a new part
    createPart: asyncHandler(async (req, res) => {
      const { partNumber, description, price, stockQuantity } = req.body;
      const vendorId = req.user._id; // Get vendorId from authentication middleware
      const image = req.file ? req.file.path : null;
  
      // Input Validation
      if (!partNumber || !description || !price) {
          return res.status(400).json({ message: 'Part number, description, and price are required' });
      }
  
      try {
          // No need to check if vendor exists here, as it's already authenticated
          const part = await Parts.create({
              partNumber,
              description,
              price,
              vendorId,
              stockQuantity,
              image,
          });
  
          res.status(201).json(part);
      } catch (error) {
          console.error('Create Part Error:', error);
          if (error.name === 'ValidationError') {
              return res.status(400).json({ message: error.message });
          }
          res.status(500).json({ message: 'Internal server error' });
      }
  }),

    // Get all/filtered parts
    getParts: asyncHandler(async (req, res) => {
      const { partNumber, vendorId } = req.query;
      let filters = {};

      // Build filters based on query parameters
      if (partNumber) filters.partNumber = { $regex: partNumber, $options: 'i' }; // Case-insensitive search
      if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) filters.vendorId = vendorId;

      try {
          const parts = await Parts.find(filters).populate('vendorId');
          res.status(200).json(parts);
      } catch (error) {
          console.error('Get Parts Error:', error);
          res.status(500).json({ message: 'Internal server error' });
      }
  }),

    // Get part by ID
    getPart: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid part ID' });
        }

        try {
            const part = await Parts.findById(id).populate('vendorId'); // Populate vendor details
            if (!part) {
                return res.status(404).json({ message: 'Part not found' });
            }
            res.status(200).json(part);
        } catch (error) {
            console.error('Get Part Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update part by ID
    updatePart: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { partNumber, description, price, vendorId, stockQuantity } = req.body;
        const image = req.file ? req.file.path : null;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid part ID' });
        }

        if (vendorId && !mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ message: 'Invalid vendor ID' });
        }

        try {
            // Check if vendor exists
            if (vendorId) {
                const vendor = await Vendor.findById(vendorId);
                if (!vendor) {
                    return res.status(404).json({ message: 'Vendor not found' });
                }
            }

            const updatedPart = await Parts.findByIdAndUpdate(
                id,
                { partNumber, description, price, vendorId, stockQuantity, image },
                { new: true }
            ).populate('vendorId');

            if (!updatedPart) {
                return res.status(404).json({ message: 'Part not found' });
            }
            res.status(200).json(updatedPart);
        } catch (error) {
            console.error('Update Part Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Delete part by ID
    deletePart: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid part ID' });
        }

        try {
            const deletedPart = await Parts.findByIdAndDelete(id);

            if (!deletedPart) {
                return res.status(404).json({ message: 'Part not found' });
            }
            res.status(200).json({ message: 'Part deleted successfully' });
        } catch (error) {
            console.error('Delete Part Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

module.exports = partController;