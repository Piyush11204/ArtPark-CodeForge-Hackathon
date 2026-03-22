import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ChatSessionModel } from '../models/ChatSession';
import {
  generateChatReply,
  buildContextSnapshot,
  buildUserContext,
} from '../services/chatService';

const MAX_MESSAGES_PER_SESSION = 200;
const MAX_MESSAGE_LENGTH = 2000;

// ─── POST /api/chat/message ───────────────────────────────────────
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { message, sessionId: existingSessionId } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw createError('message is required', 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw createError(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`, 400);
  }

  const cleanMessage = message.trim();

  // Find or create session
  let session = existingSessionId
    ? await ChatSessionModel.findOne({ sessionId: existingSessionId, userId })
    : null;

  const isNewSession = !session;

  if (!session) {
    const ctx = await buildUserContext(userId);
    session = await ChatSessionModel.create({
      userId,
      sessionId: uuidv4(),
      title: cleanMessage.slice(0, 60) + (cleanMessage.length > 60 ? '…' : ''),
      messages: [],
      contextSnapshot: buildContextSnapshot(ctx),
    });
  }

  // Enforce session message cap
  if (session.messages.length >= MAX_MESSAGES_PER_SESSION) {
    throw createError('Session message limit reached. Please start a new conversation.', 429);
  }

  // Build history for context window (last 20 messages)
  const history = session.messages.slice(-20).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Generate reply
  const result = await generateChatReply(userId, cleanMessage, history);

  // Append both messages
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

// ─── GET /api/chat/history ────────────────────────────────────────
export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessions = await ChatSessionModel.find({ userId: req.user!.id })
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

// ─── GET /api/chat/history/:sessionId ────────────────────────────
export const getChatSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const session = await ChatSessionModel.findOne({
    sessionId: req.params.sessionId,
    userId: req.user!.id,
  }).lean();

  if (!session) throw createError('Session not found', 404);

  res.json({ success: true, data: session });
});

// ─── DELETE /api/chat/history/:sessionId ─────────────────────────
export const deleteChatSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const session = await ChatSessionModel.findOneAndDelete({
    sessionId: req.params.sessionId,
    userId: req.user!.id,
  });

  if (!session) throw createError('Session not found', 404);

  res.json({ success: true, message: 'Session deleted' });
});
