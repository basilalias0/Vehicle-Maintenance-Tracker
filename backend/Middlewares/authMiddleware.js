const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Owner = require('../Models/ownerModel');
const Admin = require('../Models/adminModel');
const Manager = require('../Models/managerModel');
const Vendor = require('../Models/vendorModel');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decoded);
            

            // Determine user type and fetch user data
            if (decoded.role === 'admin') {
                req.user = await Admin.findById(decoded.id).select('-password');
            } else if (decoded.role === 'manager') {
                req.user = await Manager.findById(decoded.id).select('-password');
            } else if (decoded.role === 'owner') {
                req.user = await Owner.findById(decoded.id).select('-password');
            } else if (decoded.role === 'vendor'){
              req.user = await Vendor.findById(decoded.id).select('-password');
            } else {
                return res.status(401).json({ message: 'Invalid role in token' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized, invalid role' });
        }
        next();
    };
}

module.exports = { protect, admin, authorize };