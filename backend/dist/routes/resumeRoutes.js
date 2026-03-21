"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const resumeController_1 = require("../controllers/resumeController");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.post('/upload', upload_1.upload.single('file'), resumeController_1.uploadResume);
router.get('/me', resumeController_1.getMyResumes);
router.get('/:id', resumeController_1.getResumeById);
router.delete('/:id', resumeController_1.deleteResume);
exports.default = router;
//# sourceMappingURL=resumeRoutes.js.map