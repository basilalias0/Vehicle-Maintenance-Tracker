const Parts = require("../Models/partsModel");
const User = require("../Models/userModel");
const asyncHandler = require('express-async-handler');


const partController = {
    createPart: asyncHandler(async (req, res) => {
        const { name, description, partNumber, price, imageUrl} = req.body; // Include other fields
        const user = req.user
        const userFound = await User.findById(user.id)
        if(!userFound){
            return res.status(404).json({message: "User not found"})
        }
  
        const PartCreated = await Parts.create({
          name,
          description,
          partNumber,
          price,
          vendor:userFound._id,
          imageUrl,
        });

        if(!PartCreated){
            res.status(500).json({ message: 'Error creating part' });
        }
        res.status(201).json({ message: 'Part created successfully', data: PartCreated });
    }),
    getParts: asyncHandler(async (req, res) => {
        
          const parts = await Parts.find().populate('vendor'); // Populate vendor details
          if(!parts){
            res.status(404).json({ message: 'No parts found' });
            }
          res.status(200).json(parts);
       
      }),
      getPart: asyncHandler( async (req, res) => {
          const part = await Parts.findById(req.params.id).populate('vendor'); // Populate vendor details
          if (!part) {
            return res.status(404).json({ message: 'Part not found' });
          }
          res.status(200).json(part);
    
      }),
      updatePart: asyncHandler(async (req, res) => {
          const { name, description, partNumber, price, vendor, imageUrl } = req.body;
          const part = await Parts.findById(req.params.id);
    
          if (!part) {
            return res.status(404).json({ message: 'Part not found' });
          }
    
          // Update only provided fields (excluding undefined values and _id)
          Object.assign(part, req.body, { _id: 0 });
          const partUpdated = await part.save();
          if(!partUpdated){
            res.status(500).json({ message: 'Error updating part' });
          }
          res.status(200).json(part);
        
      }),
      deletePart: asyncHandler(async (req, res) => {
          const part = await Parts.findByIdAndDelete(req.params.id);
    
          if (!part) {
            return res.status(404).json({ message: 'Part not found' });
          }
    
          res.status(200).json({ message: 'Part deleted successfully' });
        
      }),
  
}

module.exports = partController