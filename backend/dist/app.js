"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const gapRoutes_1 = __importDefault(require("./routes/gapRoutes"));
const pathwayRoutes_1 = __importDefault(require("./routes/pathwayRoutes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [env_1.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests — please try again later.' },
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many auth attempts — please try again later.' },
});
app.use(globalLimiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (env_1.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(env_1.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'AI-Adaptive Onboarding Engine API is running',
        environment: env_1.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/auth', authLimiter, authRoutes_1.default);
app.use('/api/jobs', jobRoutes_1.default);
app.use('/api/resume', resumeRoutes_1.default);
app.use('/api/gap', gapRoutes_1.default);
app.use('/api/pathway', pathwayRoutes_1.default);
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map