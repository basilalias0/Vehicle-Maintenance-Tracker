const asyncHandler=require('express-async-handler');
const User = require('../Models/ownerModel');
const Vehicle = require('../Models/vehicleModel');

const vehicleController = {
    createVehicle :asyncHandler( async (req, res) => {
          const { make, model, year, chassisNumber, engineNumber, registrationNumber, color, fuelType} = req.body;
          const user = req.user;
          if(!make || !model || !year || !chassisNumber  || !engineNumber || !registrationNumber || !color || !fuelType){
            throw new Error("Incomplete Data")
          }

          const userFound = await User.findById(user.id)
          if(!userFound){
            throw new Error("User Not Found")
          }
      
          const createdVehicle = await Vehicle.create({
            user:userFound.id,
            make,
            model,
            year,
            chassisNumber,
            engineNumber,
            registrationNumber,
            color,
            fuelType,
          });

          if(!createdVehicle){
            throw new Error("Vehicle is not created")
          }
          res.send("Vehicle Created")
        }),


        getVehicles :asyncHandler( async (req, res) => {
          
              const vehicles = await Vehicle.find({ user: req.user.id }).populate('user')
              if(!vehicles){
                throw new Error("No Vehicles Found")
              }
              res.json(vehicles)
          }),

        getVehicleById : asyncHandler( async (req, res) => {
        
              const vehicle = await Vehicle.findById(req.params.id).populate('user');
              if (!vehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
              }
              res.json(vehicle);
          }),

          updateVehicle : asyncHandler( async (req, res) => {

              const vehicleId = req.params.id
              const { make, model, year, chassisNumber, engineNumber, registrationNumber, color, fuelType, imageUrl } = req.body;
              const vehicle = await Vehicle.findById(vehicleId);
          
              if (!vehicle) {
                throw new Error("Vehicle Not Found")
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
          
              const updatedVehicle = await Vehicle.findByIdAndUpdate(vehicleId,updates,{
                new: true,
                runValidators:true
              })
              if(!updatedVehicle){
                throw new Error("Vehicle is not updated")
              }
              res.send("Vechicle Updated Successfully")
          }),
          
          deleteVehicle: asyncHandler(async (req, res) => {
            const { id } = req.params;
            const user = req.user;
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid vehicle ID' });
            }
    
            try {
                const vehicle = await Vehicle.findById(id);
    
                if (!vehicle) {
                    return res.status(404).json({ message: 'Vehicle not found' });
                }
    
                // Check if the logged-in user is an owner and is deleting their own vehicle
                if (user.role === 'owner' && vehicle.ownerId.toString() !== user._id.toString()) {
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
                const vehicles = await Vehicle.find({ ownerId: user._id });
                res.status(200).json(vehicles);
            } catch (error) {
                console.error('Get Owner Vehicles Error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        }),
      };


      module.exports = vehicleController
