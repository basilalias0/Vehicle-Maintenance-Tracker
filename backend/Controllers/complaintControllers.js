const Complaint = require('../Models/complaintModel');
const Store = require('../Models/storeModel');
const Manager = require('../Models/managerModel');
const asyncHandler = require('express-async-handler');

const complaintController = {
    // Owner creates a complaint
    createComplaint: asyncHandler(async (req, res) => {
        const { storeId, managerId, subject, description } = req.body;

        try {
            const complaint = await Complaint.create({
                ownerId: req.user._id, // Assuming req.user contains the owner's ID
                storeId,
                managerId,
                subject,
                description,
            });

            res.status(201).json(complaint);
        } catch (error) {
            console.error('Create Complaint Error:', error);
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

    // Owner updates their complaint
    updateOwnerComplaint: asyncHandler(async (req, res) => {
        const { complaintId, subject, description } = req.body;

        try {
            const complaint = await Complaint.findOne({ _id: complaintId, ownerId: req.user._id });

            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found or unauthorized' });
            }

            complaint.subject = subject || complaint.subject;
            complaint.description = description || complaint.description;
            await complaint.save();

            res.json(complaint);
        } catch (error) {
            console.error('Update Owner Complaint Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Owner deletes their complaint
    deleteOwnerComplaint: asyncHandler(async (req, res) => {
        const { complaintId } = req.body;

        try {
            const complaint = await Complaint.findOneAndDelete({ _id: complaintId, ownerId: req.user._id });

            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found or unauthorized' });
            }

            res.json({ message: 'Complaint deleted successfully' });
        } catch (error) {
            console.error('Delete Owner Complaint Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Owner escalates their complaint
    escalateComplaint: asyncHandler(async (req, res) => {
        const { complaintId } = req.body;

        try {
            const complaint = await Complaint.findOne({ _id: complaintId, ownerId: req.user._id });

            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found or unauthorized' });
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

    // Admin gets all complaints
    getAdminComplaints: asyncHandler(async (req, res) => {
        try {
            const complaints = await Complaint.find({}).populate('ownerId storeId managerId');
            res.json(complaints);
        } catch (error) {
            console.error('Get Admin Complaints Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Admin updates complaint status and action
    updateAdminComplaint: asyncHandler(async (req, res) => {
        const { complaintId, status, adminAction } = req.body;

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
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Admin deletes store or manager (based on complaint)
    adminDeleteStoreOrManager: asyncHandler(async (req, res) => {
        const { complaintId, deleteStore, deleteManager } = req.body;

        try {
            const complaint = await Complaint.findById(complaintId);

            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found' });
            }

            if (deleteStore) {
                await Store.findByIdAndDelete(complaint.storeId);
                await Complaint.deleteMany({ storeId: complaint.storeId }); //Delete all complaints related to this store.
            }

            if (deleteManager) {
                await Manager.findByIdAndDelete(complaint.managerId);
                await Complaint.deleteMany({managerId: complaint.managerId}); //Delete all complaints related to this manager.
            }

            res.json({ message: 'Action taken successfully' });
        } catch (error) {
            console.error('Admin Delete Store/Manager Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Suggest stores based on search term
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

    // Suggest managers based on storeId
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
};

module.exports = complaintController;