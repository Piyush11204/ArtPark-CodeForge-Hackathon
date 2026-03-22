"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobController_1 = require("../controllers/jobController");
const router = (0, express_1.Router)();
router.get('/', jobController_1.getJobs);
router.get('/search', jobController_1.searchJobs);
router.get('/categories', jobController_1.getJobCategories);
router.get('/:id', jobController_1.getJobById);
exports.default = router;
//# sourceMappingURL=jobRoutes.js.map