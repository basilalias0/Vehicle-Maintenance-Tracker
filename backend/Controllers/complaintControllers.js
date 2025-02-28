const Complaint = require('../Models/complaintModel');
const Store = require('../Models/storeModel');
const Manager = require('../Models/managerModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const complaintController = {
    // Owner creates a complaint
    createComplaint: asyncHandler(async (req, res) => {
        const { storeId, managerId, subject, description } = req.body;

        if (!storeId || !managerId || !subject || !description) {
            return res.status(400).json({ message: 'Store, manager, subject, and description are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(storeId) || !mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).json({ message: 'Invalid store or manager ID' });
        }

        try {
            const complaint = await Complaint.create({
                ownerId: req.user._id,
                storeId,
                managerId,
                subject,
                description,
            });

            res.status(201).json(complaint);
        } catch (error) {
            console.error('Create Complaint Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Owner gets their own complaints
    getOwnerComplaints: asyncHandler(async (req, res) => {
        try {
            const complaints = await Complaint.find({ ownerId: req.user._id }).populate('storeId managerId');
            res.json(complaints);
        } catch (error) {
            console.error('Get Owner Complaints Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

     // Owner updates their complaint (only if not escalated)
     updateOwnerComplaint: asyncHandler(async (req, res) => {
        const { complaintId, subject, description } = req.body;

        if (!complaintId) {
            return res.status(400).json({ message: 'Complaint ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(complaintId)) {
            return res.status(400).json({ message: 'Invalid complaint ID' });
        }

        try {
            const complaint = await Complaint.findOne({ _id: complaintId, ownerId: req.user._id });

            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found or unauthorized' });
            }

            if (complaint.escalated) {
                return res.status(403).json({ message: 'Cannot update an escalated complaint' });
            }

            complaint.subject = subject || complaint.subject;
            complaint.description = description || complaint.description;
            await complaint.save();

            res.json(complaint);
        } catch (error) {
            console.error('Update Owner Complaint Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    deleteOwnerComplaint: asyncHandler(async (req, res) => {
        const { complaintId } = req.body;
    
        if (!complaintId) {
            return res.status(400).json({ message: 'Complaint ID is required' });
        }
    
        if (!mongoose.Types.ObjectId.isValid(complaintId)) {
            return res.status(400).json({ message: 'Invalid complaint ID' });
        }
    
        try {
            const complaint = await Complaint.findOneAndDelete({ _id: complaintId, ownerId: req.user._id });
    
            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found or unauthorized' });
            }
    
            if (complaint.escalated) {
                return res.status(403).json({ message: 'Cannot delete an escalated complaint' });
            }
    
            res.json({ message: 'Complaint deleted successfully' });
        } catch (error) {
            console.error('Delete Owner Complaint Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    escalateComplaint: asyncHandler(async (req, res) => {
        const { complaintId } = req.body;
    
        if (!complaintId) {
            return res.status(400).json({ message: 'Complaint ID is required' });
        }
    
        if (!mongoose.Types.ObjectId.isValid(complaintId)) {
            return res.status(400).json({ message: 'Invalid complaint ID' });
        }
    
        try {
            const complaint = await Complaint.findOne({ _id: complaintId, ownerId: req.user._id });
    
            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found or unauthorized' });
            }
    
            if (complaint.escalated) {
                return res.status(400).json({ message: 'Complaint already escalated' });
            }
    
            complaint.escalated = true;
            complaint.status = 'escalated';
            await complaint.save();
    
            res.json({ message: 'Complaint escalated successfully' });
        } catch (error) {
            console.error('Escalate Complaint Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    suggestStores: asyncHandler(async (req, res) => {
        const { searchTerm } = req.query;
    
        try {
            const stores = await Store.find({ name: { $regex: searchTerm, $options: 'i' } }).limit(10); // Limit to 10 suggestions
            res.json(stores);
        } catch (error) {
            console.error('Suggest Stores Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    suggestManagers: asyncHandler(async (req, res) => {
        const { storeId } = req.query;
    
        try {
            const managers = await Manager.find({ storeId: storeId }).limit(10); // Limit to 10 suggestions
            res.json(managers);
        } catch (error) {
            console.error('Suggest Managers Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    getAdminComplaints: asyncHandler(async (req, res) => {
        try {
            const complaints = await Complaint.find({ escalated: true }) // Filter for escalated complaints
                .populate('ownerId storeId managerId');
            res.json(complaints);
        } catch (error) {
            console.error('Get Admin Escalated Complaints Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    updateAdminComplaint: asyncHandler(async (req, res) => {
        const { complaintId, status, adminAction } = req.body;
    
        if (!complaintId) {
            return res.status(400).json({ message: 'Complaint ID is required' });
        }
    
        if (!mongoose.Types.ObjectId.isValid(complaintId)) {
            return res.status(400).json({ message: 'Invalid complaint ID' });
        }
    
        try {
            const complaint = await Complaint.findById(complaintId);
    
            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found' });
            }
    
            complaint.status = status || complaint.status;
            complaint.adminAction = adminAction || complaint.adminAction;
            await complaint.save();
    
            res.json(complaint);
        } catch (error) {
            console.error('Update Admin Complaint Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    adminDeleteStoreOrManager: asyncHandler(async (req, res) => {
        const { complaintId, deleteStore, deleteManager } = req.body;
    
        if (!complaintId) {
            return res.status(400).json({ message: 'Complaint ID is required' });
        }
    
        if (!mongoose.Types.ObjectId.isValid(complaintId)) {
            return res.status(400).json({ message: 'Invalid complaint ID' });
        }
    
        try {
            const complaint = await Complaint.findById(complaintId);
    
            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found' });
            }
    
            if (deleteStore) {
                const deletedStore = await Store.findByIdAndDelete(complaint.storeId);
                if (!deletedStore) {
                    return res.status(404).json({ message: 'Store not found' });
                }
                await Complaint.deleteMany({ storeId: complaint.storeId });
            }
    
            if (deleteManager) {
                const deletedManager = await Manager.findByIdAndDelete(complaint.managerId);
                if (!deletedManager) {
                    return res.status(404).json({ message: 'Manager not found' });
                }
                await Complaint.deleteMany({ managerId: complaint.managerId });
            }
    
            // Update the complaint status to "completed"
            complaint.status = 'resolved';
            await complaint.save();
    
            res.json({
                message: 'Action taken successfully.',
            });
        } catch (error) {
            console.error('Admin Delete Store/Manager Error:', error);
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ message: 'Invalid store or manager ID in complaint' });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),


    getManagersWithEscalatedComplaints: asyncHandler(async (req, res) => {
        const storeId = req.user.storeId; // Get storeId from manager's token data
    
        if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({ message: 'Invalid or missing store ID from user token' });
        }
    
        try {
            // Find complaints for the store that are escalated
            const escalatedComplaints = await Complaint.find({ storeId: storeId, escalated: true })
            .populate('managerId ownerId'); // Populate managerId and ownerId

            res.json(escalatedComplaints);
        } catch (error) {
            console.error('Get Managers with Escalated Complaints Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
}

module.exports = complaintController