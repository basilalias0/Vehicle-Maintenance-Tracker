const asyncHandler=require('express-async-handler');
const User = require('../Models/ownerModel');
const Vehicle = require('../Models/vehicleModel');
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

const vehicleController = {
  createVehicle: asyncHandler(async (req, res) => {
      const { make, model, year, vin, engineNumber, registrationNumber, color, fuelType, ownerEmail } = req.body;
      const manager = req.user;
      const storeId = manager.storeId;

      if (!make || !model || !year || !vin || !engineNumber || !registrationNumber || !color || !fuelType || !ownerEmail) {
          return res.status(400).json({ message: "Incomplete Data" });
      }

      try {
          let userFound = await User.findOne({ email: ownerEmail });

          if (!userFound) {
            // Create a new user if not found
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("123456", salt); // Replace 'defaultPassword'
        
            userFound = await User.create({
                email: ownerEmail,
                username: ownerEmail.substring(0, ownerEmail.indexOf('@')),
                password: hashedPassword, // Add the hashed password
                role: 'owner', // Add the role
                // Add other required fields for user creation
            });
        }
          if(!storeId){
              return res.status(400).json({message: "Manager is not assigned to a store."})
          }
          const createdVehicle = await Vehicle.create({
              user: userFound._id,
              make,
              model,
              year,
              vin,
              engineNumber,
              registrationNumber,
              color,
              fuelType,
              storeId: storeId,
              ownerId:userFound._id
          });

          if (!createdVehicle) {
              return res.status(500).json({ message: "Vehicle creation failed" });
          }
          res.status(201).json({ message: "Vehicle Created", vehicle: createdVehicle });
      } catch (error) {
          console.error("Create Vehicle Error:", error);
          res.status(500).json({ message: "Internal server error", error: error.message });
      }
  }),

  getVehicles: asyncHandler(async (req, res) => {
      try {
          const vehicles = await Vehicle.find({}).populate({
            path: 'ownerId',
            select: '-password'
          });
          if (!vehicles || vehicles.length === 0) {
              return res.status(404).json({ message: "No Vehicles Found" });
          }
          res.json(vehicles);
      } catch (error) {
          console.error("Get Vehicles Error:", error);
          res.status(500).json({ message: "Internal server error", error: error.message });
      }
  }),

  getVehicleById: asyncHandler(async (req, res) => {
      try {
          const vehicle = await Vehicle.findById(req.params.id).populate({
            path: 'ownerId',
            select: '-password'
          });
          if (!vehicle) {
              return res.status(404).json({ message: 'Vehicle not found' });
          }
          res.json(vehicle);
      } catch (error) {
          console.error("Get Vehicle by ID Error:", error);
          res.status(500).json({ message: "Internal server error", error: error.message });
      }
  }),

  updateVehicle: asyncHandler(async (req, res) => {
      const vehicleId = req.params.id;
      const { make, model, year, chassisNumber, engineNumber, registrationNumber, color, fuelType, imageUrl } = req.body;

      try {
          const vehicle = await Vehicle.findById(vehicleId);

          if (!vehicle) {
              return res.status(404).json({ message: "Vehicle Not Found" });
          }

          const updates = {};

          if (make) updates.make = make;
          if (model) updates.model = model;
          if (year) updates.year = year;
          if (registrationNumber) updates.registrationNumber = registrationNumber;
          if (color) updates.color = color;
          if (fuelType) updates.fuelType = fuelType;
          if (imageUrl) updates.imageUrl = imageUrl;
          if (chassisNumber) updates.chassisNumber = chassisNumber;
          if (engineNumber) updates.engineNumber = engineNumber;

          const updatedVehicle = await Vehicle.findByIdAndUpdate(vehicleId, updates, {
              new: true,
              runValidators: true,
          });

          if (!updatedVehicle) {
              return res.status(500).json({ message: "Vehicle update failed" });
          }
          res.json({ message: "Vehicle Updated Successfully", vehicle: updatedVehicle });
      } catch (error) {
          console.error("Update Vehicle Error:", error);
          res.status(500).json({ message: "Internal server error", error: error.message });
      }
  }),

  deleteVehicle: asyncHandler(async (req, res) => {
      const { id } = req.params;
      const manager = req.user;
      const storeId = manager.storeId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid vehicle ID' });
      }

      try {
          const vehicle = await Vehicle.findById(id);

          if (!vehicle) {
              return res.status(404).json({ message: 'Vehicle not found' });
          }
          

          if (vehicle.storeId.toString() !== storeId.toString()) {
              return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
          }

          await Vehicle.findByIdAndDelete(id);
          res.status(200).json({ message: 'Vehicle deleted successfully' });
      } catch (error) {
          console.error('Delete Vehicle Error:', error);
          res.status(500).json({ message: 'Internal server error' });
      }
  }),

  getOwnerVehicles: asyncHandler(async (req, res) => {
      const user = req.user;

      try {
          const vehicles = await Vehicle.find({ user: user._id });
          res.status(200).json(vehicles);
      } catch (error) {
          console.error('Get Owner Vehicles Error:', error);
          res.status(500).json({ message: 'Internal server error' });
      }
  }),
  getStoreVehicles: asyncHandler(async (req, res) => {
    const manager = req.user;
        const storeId = manager.storeId;

    if (manager.storeId.toString() !== storeId.toString()) {
        return res.status(403).json({ message: "Not authorized to view vehicles for this store" });
    }

    try {
        const vehicles = await Vehicle.find({ storeId: storeId }).populate('user');
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Get Store Vehicles Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}),
      };


      module.exports = vehicleController
