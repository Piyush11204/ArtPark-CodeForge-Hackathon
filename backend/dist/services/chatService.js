"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUserContext = buildUserContext;
exports.generateChatReply = generateChatReply;
exports.buildContextSnapshot = buildContextSnapshot;
const User_1 = require("../models/User");
const Resume_1 = require("../models/Resume");
const GapReport_1 = require("../models/GapReport");
const Pathway_1 = require("../models/Pathway");
const Job_1 = require("../models/Job");
const Course_1 = require("../models/Course");
const nlpEngine_1 = require("./nlpEngine");
async function buildUserContext(userId) {
    const [user, resume, gapReport, pathway, totalJobs, totalCourses] = await Promise.all([
        User_1.UserModel.findById(userId).select('name email').lean(),
        Resume_1.ResumeModel.findOne({ userId }).sort({ createdAt: -1 }).lean(),
        GapReport_1.GapReportModel.findOne({ userId })
            .sort({ createdAt: -1 })
            .populate('jobId', 'jobTitle companyName')
            .lean(),
        Pathway_1.PathwayModel.findOne({ userId }).sort({ createdAt: -1 }).lean(),
        Job_1.JobModel.countDocuments({ isActive: true }),
        Course_1.CourseModel.countDocuments({ isActive: true }),
    ]);
    const gapData = gapReport?.gapReport;
    const jobDoc = gapReport?.jobId;
    const pathwaySteps = (pathway?.steps || []).map((s) => ({
        skill: s.skill,
        priority: s.priority,
        status: s.status,
    }));
    const nextSteps = pathwaySteps
        .filter((s) => s.status === 'pending')
        .slice(0, 3)
        .map((s) => ({ skill: s.skill, priority: s.priority }));
    return {
        userName: user?.name || 'there',
        userEmail: user?.email || '',
        skills: resume?.normalizedSkills || [],
        missingSkills: gapData?.missing || [],
        partialSkills: gapData?.partial || [],
        satisfiedSkills: gapData?.satisfied || [],
        matchScore: Math.round((gapData?.matchScore || 0) * 100),
        targetJobTitle: jobDoc?.jobTitle || '',
        targetCompany: jobDoc?.companyName || '',
        pathwayProgress: pathway?.progressPercent || 0,
        pathwaySteps,
        nextSteps,
        totalJobs,
        totalCourses,
        hasResume: !!resume,
        hasGapReport: !!gapReport,
        hasPathway: !!pathway,
    };
}
function extractLastIntent(history) {
    const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg)
        return null;
    const { tag } = (0, nlpEngine_1.classifyIntent)(lastUserMsg.content);
    return tag !== 'general' ? tag : null;
}
async function generateChatReply(userId, userMessage, history) {
    const ctx = await buildUserContext(userId);
    const { tag: intent, score } = (0, nlpEngine_1.classifyIntent)(userMessage);
    const stReply = (0, nlpEngine_1.searchSmallTalk)(userMessage);
    if (stReply) {
        return { reply: stReply, intent: 'small_talk', sources: ['small_talk'] };
    }
    const sources = ['nlp_engine'];
    if (intent === 'general' || score < 2) {
        const faqReply = (0, nlpEngine_1.searchFAQ)(userMessage);
        if (faqReply) {
            return { reply: faqReply, intent: 'faq', sources: ['faq_kb'] };
        }
    }
    const lastIntent = intent === 'continuation' ? extractLastIntent(history) : null;
    const reply = (0, nlpEngine_1.buildReply)(intent, ctx, userMessage, lastIntent);
    return { reply, intent, sources };
}
function buildContextSnapshot(ctx) {
    return {
        resumeSkills: ctx.skills.slice(0, 20),
        topMissingSkills: ctx.missingSkills.slice(0, 10),
        activeJobTitle: ctx.targetJobTitle,
    };
}
//# sourceMappingURL=chatService.js.map