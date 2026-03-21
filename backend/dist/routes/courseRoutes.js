"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courseController_1 = require("../controllers/courseController");
const router = (0, express_1.Router)();
router.get('/', courseController_1.getCourses);
router.get('/categories', courseController_1.getCourseCategories);
router.get('/skill/:skill', courseController_1.getCoursesBySkill);
router.get('/:id', courseController_1.getCourseById);
exports.default = router;
//# sourceMappingURL=courseRoutes.js.map