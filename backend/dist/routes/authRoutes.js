"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.post('/register', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain an uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain a number'),
], validate_1.validate, authController_1.register);
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
], validate_1.validate, authController_1.login);
router.post('/refresh', [(0, express_validator_1.body)('refreshToken').notEmpty().withMessage('refreshToken is required')], validate_1.validate, authController_1.refresh);
router.get('/me', auth_1.protect, authController_1.getMe);
router.post('/logout', auth_1.protect, authController_1.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map