"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathwayModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PathwayStepSchema = new mongoose_1.Schema({
    order: { type: Number, required: true },
    skill: { type: String, required: true },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course' },
    courseTitle: { type: String },
    courseProvider: { type: String },
    resourceUrl: { type: String },
    reason: { type: String, required: true },
    estimatedHours: { type: Number, default: 5 },
    priority: {
        type: String,
        enum: ['critical', 'recommended', 'optional'],
        default: 'recommended',
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending',
    },
    completedAt: { type: Date },
}, { _id: true });
const PathwaySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gapReportId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'GapReport', required: true },
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', required: true },
    resumeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Resume', required: true },
    steps: { type: [PathwayStepSchema], default: [] },
    totalEstimatedHours: { type: Number, default: 0 },
    completedHours: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.PathwayModel = mongoose_1.default.model('Pathway', PathwaySchema);
//# sourceMappingURL=Pathway.js.map