"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../middleware/auth");
const chatController_1 = require("../controllers/chatController");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
const chatLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
    message: { success: false, message: 'Chat rate limit reached — max 60 messages per hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/message', chatLimiter, chatController_1.sendMessage);
router.get('/history', chatController_1.getChatHistory);
router.get('/history/:sessionId', chatController_1.getChatSession);
router.delete('/history/:sessionId', chatController_1.deleteChatSession);
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map