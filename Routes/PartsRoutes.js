const express = require('express');
const partRouter = express.Router();
const partController = require('../Controllers/partController');
const isAuth = require('../Middlewares/isAuth');


// All routes below this line will require authentication
partRouter.use(isAuth) // If you have authentication middleware
partRouter.post('/', partController.createPart); // Create a new part
partRouter.get('/', partController.getParts); // Get all parts (or parts for a user)
partRouter.get('/:id', partController.getPart); // Get a specific part by ID
partRouter.put('/:id', partController.updatePart); // Update a part
partRouter.delete('/:id', partController.deletePart); // Delete a part

module.exports = partRouter;