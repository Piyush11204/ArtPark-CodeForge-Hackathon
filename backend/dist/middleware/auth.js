"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = protect;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
async function protect(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await User_1.UserModel.findById(decoded.id).select('_id email role isActive');
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'User account not found or deactivated' });
            return;
        }
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ success: false, message: 'Token expired' });
            return;
        }
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map