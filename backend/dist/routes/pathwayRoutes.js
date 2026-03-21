"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const pathwayController_1 = require("../controllers/pathwayController");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.post('/generate', [(0, express_validator_1.body)('gapReportId').notEmpty().withMessage('gapReportId is required')], validate_1.validate, pathwayController_1.generatePathwayHandler);
router.get('/me', pathwayController_1.getMyPathways);
router.get('/:id', pathwayController_1.getPathway);
router.patch('/:pathwayId/step/:stepId', [
    (0, express_validator_1.param)('pathwayId').notEmpty(),
    (0, express_validator_1.param)('stepId').notEmpty(),
    (0, express_validator_1.body)('status')
        .isIn(['pending', 'in-progress', 'completed'])
        .withMessage('status must be pending, in-progress, or completed'),
], validate_1.validate, pathwayController_1.updateStepStatus);
exports.default = router;
//# sourceMappingURL=pathwayRoutes.js.map