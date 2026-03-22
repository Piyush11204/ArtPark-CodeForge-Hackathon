"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const gapController_1 = require("../controllers/gapController");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.post('/analyze', [
    (0, express_validator_1.body)('resumeId').notEmpty().withMessage('resumeId is required'),
    (0, express_validator_1.body)('jobId').notEmpty().withMessage('jobId is required'),
], validate_1.validate, gapController_1.analyzeGap);
router.get('/history', gapController_1.getGapHistory);
router.get('/:id', gapController_1.getGapReport);
exports.default = router;
//# sourceMappingURL=gapRoutes.js.map