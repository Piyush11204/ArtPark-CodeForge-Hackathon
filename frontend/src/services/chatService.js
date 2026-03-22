import api from './api';

/**
 * Send a chat message and get a reply.
 * @param {string} message
 * @param {string|null} sessionId  - existing session UUID, or null to start a new one
 */
export const sendChatMessage = (message, sessionId = null) =>
  api
    .post('/chat/message', { message, sessionId })
    .then((r) => r.data.data);

/** List all chat sessions (summary) for the authenticated user */
export const getChatHistory = () =>
  api.get('/chat/history').then((r) => r.data.data);

/** Get the full message thread for a session */
export const getChatSession = (sessionId) =>
  api.get(`/chat/history/${sessionId}`).then((r) => r.data.data);

/** Delete a chat session */
export const deleteChatSession = (sessionId) =>
  api.delete(`/chat/history/${sessionId}`).then((r) => r.data);
