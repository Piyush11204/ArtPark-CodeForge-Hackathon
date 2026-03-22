"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChatSession = exports.getChatSession = exports.getChatHistory = exports.sendMessage = void 0;
const uuid_1 = require("uuid");
const errorHandler_1 = require("../middleware/errorHandler");
const ChatSession_1 = require("../models/ChatSession");
const chatService_1 = require("../services/chatService");
const MAX_MESSAGES_PER_SESSION = 200;
const MAX_MESSAGE_LENGTH = 2000;
exports.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { message, sessionId: existingSessionId } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
        throw (0, errorHandler_1.createError)('message is required', 400);
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
        throw (0, errorHandler_1.createError)(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`, 400);
    }
    const cleanMessage = message.trim();
    let session = existingSessionId
        ? await ChatSession_1.ChatSessionModel.findOne({ sessionId: existingSessionId, userId })
        : null;
    const isNewSession = !session;
    if (!session) {
        const ctx = await (0, chatService_1.buildUserContext)(userId);
        session = await ChatSession_1.ChatSessionModel.create({
            userId,
            sessionId: (0, uuid_1.v4)(),
            title: cleanMessage.slice(0, 60) + (cleanMessage.length > 60 ? '…' : ''),
            messages: [],
            contextSnapshot: (0, chatService_1.buildContextSnapshot)(ctx),
        });
    }
    if (session.messages.length >= MAX_MESSAGES_PER_SESSION) {
        throw (0, errorHandler_1.createError)('Session message limit reached. Please start a new conversation.', 429);
    }
    const history = session.messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
    }));
    const result = await (0, chatService_1.generateChatReply)(userId, cleanMessage, history);
    const now = new Date();
    session.messages.push({
        role: 'user',
        content: cleanMessage,
        timestamp: now,
    });
    session.messages.push({
        role: 'assistant',
        content: result.reply,
        intent: result.intent,
        sources: result.sources,
        timestamp: new Date(),
    });
    await session.save();
    res.json({
        success: true,
        data: {
            reply: result.reply,
            sessionId: session.sessionId,
            intent: result.intent,
            sources: result.sources,
            isNewSession,
        },
    });
});
exports.getChatHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const sessions = await ChatSession_1.ChatSessionModel.find({ userId: req.user.id })
        .select('sessionId title createdAt updatedAt messages')
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();
    const summary = sessions.map((s) => ({
        sessionId: s.sessionId,
        title: s.title,
        messageCount: s.messages.length,
        lastMessage: s.messages[s.messages.length - 1]?.content?.slice(0, 80) || '',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }));
    res.json({ success: true, data: summary });
});
exports.getChatSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const session = await ChatSession_1.ChatSessionModel.findOne({
        sessionId: req.params.sessionId,
        userId: req.user.id,
    }).lean();
    if (!session)
        throw (0, errorHandler_1.createError)('Session not found', 404);
    res.json({ success: true, data: session });
});
exports.deleteChatSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const session = await ChatSession_1.ChatSessionModel.findOneAndDelete({
        sessionId: req.params.sessionId,
        userId: req.user.id,
    });
    if (!session)
        throw (0, errorHandler_1.createError)('Session not found', 404);
    res.json({ success: true, message: 'Session deleted' });
});
//# sourceMappingURL=chatController.js.map