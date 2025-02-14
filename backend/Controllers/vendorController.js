const Vendor = require("../Models/vendorModel");
const asyncHandler = require('express-async-handler');


const vendorController = {
    createVendor: asyncHandler(async (req, res) => {
        const { name, contact, address, specialization } = req.body;
        if(!name || !contact || !address || !specialization){
            res.status(400).json({ message: "Please fill in all fields" });
        }
  
        const VendorCreated = await Vendor.create({
          name,
          contact,
          address,
          specialization,
        });
        if(!VendorCreated){
            res.status(500).json({ message: 'Error creating vendor' });
        }
        res.status(201).json(newVendor);
      
    }),
  
    getVendors:asyncHandler( async (req, res) => {
      
        const vendorsFound = await Vendor.find();
        if(!vendorsFound){
            res.status(500).json({ message: 'Error fetching vendors' });
        }
        res.status(200).json(vendors);
    }),
  
    getVendorById: asyncHandler(async (req, res) => {
      
        const vendorFound = await Vendor.findById(req.params.id);
        if (!vendorFound) {
          return res.status(404).json({ message: 'Vendor not found' });
        }
        res.status(200).json(vendorFound);
      
    }),
  
    updateVendor: asyncHandler(async (req, res) => {
    
        const { name, contact, address, specialization } = req.body;
        const vendorFound = await Vendor.findById(req.params.id);
  
        if (!vendorFound) {
          return res.status(404).json({ message: 'Vendor not found' });
        }

        const VendorUpdates = {}
  
        if(name) VendorUpdates.name = name;
        if(contact) VendorUpdates.contact = contact;
        if(address) VendorUpdates.address = address;
        if(specialization) VendorUpdates.specialization = specialization;
  
        const vendorUpdated = await Vendor.findByIdAndUpdate(req.params.id, VendorUpdates,{
            new: true,
            runValidators:true
        })
        if(!vendorUpdated){
            res.status(500).json({ message: 'Error updating vendor' });
        }
        res.status(200).json({message:vendorUpdated});
    }),
  
    deleteVendor: asyncHandler(async (req, res) => {
        const vendorFound = await Vendor.findByIdAndDelete(req.params.id);
  
        if (!vendorFound) {
          return res.status(404).json({ message: 'Vendor not found' });
        }
  
        res.status(200).json({ message: 'Vendor deleted successfully' });
    }),
  };
  
  module.exports = vendorController;