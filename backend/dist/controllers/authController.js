"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.refresh = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const errorHandler_1 = require("../middleware/errorHandler");
const env_1 = require("../config/env");
function signAccessToken(id, email, role) {
    return jsonwebtoken_1.default.sign({ id, email, role }, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN,
    });
}
function signRefreshToken(id) {
    return jsonwebtoken_1.default.sign({ id }, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
    });
}
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, email, password } = req.body;
    const exists = await User_1.UserModel.findOne({ email: email.toLowerCase() });
    if (exists) {
        throw (0, errorHandler_1.createError)('Email already registered', 409);
    }
    const user = new User_1.UserModel({ name, email, passwordHash: password });
    await user.save();
    const accessToken = signAccessToken(String(user._id), user.email, user.role);
    const refreshToken = signRefreshToken(String(user._id));
    user.refreshToken = refreshToken;
    await user.save();
    res.status(201).json({
        success: true,
        data: { user, accessToken, refreshToken },
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshToken');
    if (!user || !user.isActive) {
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    }
    const accessToken = signAccessToken(String(user._id), user.email, user.role);
    const refreshToken = signRefreshToken(String(user._id));
    user.refreshToken = refreshToken;
    await user.save();
    res.json({
        success: true,
        data: { user, accessToken, refreshToken },
    });
});
exports.refresh = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw (0, errorHandler_1.createError)('Refresh token required', 400);
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
    }
    catch {
        throw (0, errorHandler_1.createError)('Invalid or expired refresh token', 401);
    }
    const user = await User_1.UserModel.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
        throw (0, errorHandler_1.createError)('Refresh token mismatch', 401);
    }
    const newAccessToken = signAccessToken(String(user._id), user.email, user.role);
    const newRefreshToken = signRefreshToken(String(user._id));
    user.refreshToken = newRefreshToken;
    await user.save();
    res.json({
        success: true,
        data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
});
exports.getMe = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await User_1.UserModel.findById(req.user.id);
    if (!user)
        throw (0, errorHandler_1.createError)('User not found', 404);
    res.json({ success: true, data: user });
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await User_1.UserModel.findByIdAndUpdate(req.user.id, { refreshToken: undefined });
    res.json({ success: true, message: 'Logged out' });
});
//# sourceMappingURL=authController.js.map