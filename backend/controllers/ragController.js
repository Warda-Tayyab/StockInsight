const RagQuery = require('../models/tenant/RagQuery');
const RagChatSession = require('../models/tenant/RagChatSession');
const { retrieveContext } = require('../service/ragDataRetriever');
const { generateAnswer, generateChatTitle, isTokenLimitError } = require('../service/ragGroqService');
const { generateInsights, inferQueryType } = require('../service/ragInsightsService');
const { searchWeb, needsExternalSearch } = require('../service/ragTavilyService');

const formatMessage = (item) => ({
  id: item._id,
  query: item.question,
  response: item.response,
  sources: item.sources || [],
  type: inferQueryType(item.question, item.sources),
  timestamp: item.createdAt
});

/**
 * Short follow-ups ("uski quantity?", "aur price?") need earlier chat text
 * so product/topic matching still works against the DB.
 */
const buildFollowUpRetrievalQuestion = (question, history = []) => {
  if (!history.length) return question;

  const q = String(question).toLowerCase();

  // New global list / topic questions must NOT inherit prior product names
  // (that caused matchedProducts to override full best-selling / expiry lists).
  const isNewGlobalTopic =
    /\b(best\s*sell|top\s*sell|most\s*profit|profitable|dead\s*stock|expir|expire|low\s*stock|out\s*of\s*stock|all\s*products|total\s*products|saare\s*products|vendors|suppliers|purchase|grn|write\s*off)\b/i.test(
      q
    ) && !/\b(us|usi|uska|uski|uske|woh|yeh\s*product|upar|oper|same|pehle\s*wala)\b/i.test(q);

  if (isNewGlobalTopic) return question;

  const looksLikeFollowUp =
    (question.length < 80 &&
      /\b(us|usi|uska|uski|uske|un|unka|unki|inka|inki|yeh|woh|is|that|it|them|same|upar|oper|pehle|previous|quantity|qty|price|stock|kitna|kitni|kitne|aur|or|batao)\b/i.test(
        q
      )) ||
    /\b(us|usi|uska|uski|uske|woh\s*product|upar|oper|pehle\s*wala|same)\b/i.test(q);

  if (!looksLikeFollowUp) return question;

  const recent = history
    .slice(-4)
    .map((h) => h.question)
    .filter(Boolean)
    .join(' | ');

  return `${question}\n(Earlier in this chat the user asked about: ${recent})`;
};

const getOwnedChat = async (chatId, tenantId, userId) => {
  const chat = await RagChatSession.findOne({ _id: chatId, tenantId, userId });
  if (!chat) {
    const err = new Error('Chat not found');
    err.status = 404;
    throw err;
  }
  return chat;
};

exports.createChat = async (req, res) => {
  try {
    const chat = await RagChatSession.create({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      title: 'New Chat'
    });

    res.status(201).json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
  } catch (err) {
    console.error('Create chat error:', err);
    res.status(500).json({ message: 'Failed to create new chat' });
  }
};

exports.listChats = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const isArchived = req.query.archived === 'true';
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);

    const chats = await RagChatSession.find({ tenantId, userId, isArchived })
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      chats: chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount,
        isArchived: !!chat.isArchived,
        isPinned: !!chat.isPinned,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }))
    });
  } catch (err) {
    console.error('List chats error:', err);
    res.status(500).json({ message: 'Failed to load chats' });
  }
};

exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    const chat = await getOwnedChat(chatId, tenantId, userId);

    const messages = await RagQuery.find({ chatSessionId: chatId, tenantId, userId })
      .sort({ createdAt: 1 })
      .select('question response sources createdAt')
      .lean();

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount,
        isArchived: !!chat.isArchived,
        isPinned: !!chat.isPinned,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      },
      messages: messages.map(formatMessage)
    });
  } catch (err) {
    console.error('Get chat error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to load chat' });
  }
};

exports.updateChatTitle = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const chat = await getOwnedChat(chatId, tenantId, userId);
    chat.title = title.trim().slice(0, 120);
    await chat.save();

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount,
        isArchived: !!chat.isArchived,
        isPinned: !!chat.isPinned,
        updatedAt: chat.updatedAt
      }
    });
  } catch (err) {
    console.error('Update chat title error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to update chat title' });
  }
};

exports.toggleArchiveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    const chat = await getOwnedChat(chatId, tenantId, userId);
    const targetState = req.body.isArchived !== undefined ? Boolean(req.body.isArchived) : !chat.isArchived;
    chat.isArchived = targetState;
    await chat.save();

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount,
        isArchived: !!chat.isArchived,
        isPinned: !!chat.isPinned,
        updatedAt: chat.updatedAt
      }
    });
  } catch (err) {
    console.error('Toggle archive chat error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to archive/restore chat' });
  }
};

exports.togglePinChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    const chat = await getOwnedChat(chatId, tenantId, userId);
    const targetState = req.body.isPinned !== undefined ? Boolean(req.body.isPinned) : !chat.isPinned;
    chat.isPinned = targetState;
    await chat.save();

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount,
        isArchived: !!chat.isArchived,
        isPinned: !!chat.isPinned,
        updatedAt: chat.updatedAt
      }
    });
  } catch (err) {
    console.error('Toggle pin chat error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to pin/unpin chat' });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    const chat = await getOwnedChat(chatId, tenantId, userId);

    await RagQuery.deleteMany({ chatSessionId: chatId, tenantId, userId });
    await RagChatSession.deleteOne({ _id: chatId, tenantId, userId });

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully',
      chatId
    });
  } catch (err) {
    console.error('Delete chat error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to delete chat' });
  }
};

exports.clearChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    const chat = await getOwnedChat(chatId, tenantId, userId);

    await RagQuery.deleteMany({ chatSessionId: chatId, tenantId, userId });
    chat.messageCount = 0;
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Conversation cleared successfully',
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: 0,
        isArchived: !!chat.isArchived,
        isPinned: !!chat.isPinned,
        updatedAt: chat.updatedAt
      }
    });
  } catch (err) {
    console.error('Clear chat messages error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to clear conversation' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    const chat = await getOwnedChat(chatId, tenantId, userId);

    const queryDoc = await RagQuery.findOneAndDelete({ _id: messageId, chatSessionId: chatId, tenantId, userId });
    if (queryDoc && chat.messageCount > 0) {
      chat.messageCount = Math.max(0, chat.messageCount - 1);
      await chat.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      messageId
    });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to delete message' });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { question } = req.body;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const trimmedQuestion = question.trim();
    const chat = await getOwnedChat(chatId, tenantId, userId);

    const existingMsg = await RagQuery.findOne({ _id: messageId, chatSessionId: chatId, tenantId, userId });
    if (!existingMsg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const priorTurns = await RagQuery.find({
      chatSessionId: chatId,
      tenantId,
      userId,
      createdAt: { $lt: existingMsg.createdAt }
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('question response')
      .lean();

    const history = priorTurns
      .reverse()
      .map((t) => ({ question: t.question, response: t.response }));

    const retrievalQuestion = buildFollowUpRetrievalQuestion(trimmedQuestion, history);

    const { context, contextText, sources: inventorySources } = await retrieveContext(
      tenantId,
      retrievalQuestion
    );

    let webContextText = '';
    let webSources = [];
    let usedWeb = false;

    if (process.env.TAVILY_API_KEY && needsExternalSearch(trimmedQuestion)) {
      const web = await searchWeb(trimmedQuestion, { maxResults: 5, searchDepth: 'basic' });
      if (!web.skipped && web.contextText) {
        webContextText = web.contextText;
        webSources = web.sources || [];
        usedWeb = true;
      }
    }

    const sources = [...new Set([...(inventorySources || []), ...webSources])];

    let response;
    try {
      response = await generateAnswer(
        trimmedQuestion,
        contextText,
        webContextText,
        history
      );
    } catch (aiError) {
      console.error('RAG Groq error during editMessage:', aiError);
      const isLimit = isTokenLimitError(aiError);
      const status = isLimit ? 429 : (aiError.status || 500);
      const message = isLimit
        ? "You've reached your current limit for AI queries. Please wait a moment and try again."
        : aiError.message?.includes('GROQ_API_KEY')
        ? 'AI service is not configured. Please set GROQ_API_KEY in .env'
        : "You've reached your limit or AI service is temporarily unavailable. Please try again later.";

      return res.status(status).json({ message });
    }

    existingMsg.question = trimmedQuestion;
    existingMsg.response = response;
    existingMsg.sources = sources;
    await existingMsg.save();

    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount,
        updatedAt: chat.updatedAt
      },
      message: {
        id: existingMsg._id,
        query: trimmedQuestion,
        response,
        sources,
        usedWeb,
        timestamp: existingMsg.createdAt
      }
    });
  } catch (err) {
    console.error('Edit message error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to edit message' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { question } = req.body;
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const trimmedQuestion = question.trim();
    const chat = await getOwnedChat(chatId, tenantId, userId);
    const isFirstMessage =
      chat.messageCount === 0 ||
      !chat.title ||
      chat.title === 'New Chat' ||
      chat.title === 'Untitled Chat';

    const priorTurns = await RagQuery.find({
      chatSessionId: chatId,
      tenantId,
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('question response')
      .lean();

    const history = priorTurns
      .reverse()
      .map((t) => ({ question: t.question, response: t.response }));

    const retrievalQuestion = buildFollowUpRetrievalQuestion(trimmedQuestion, history);

    const { context, contextText, sources: inventorySources } = await retrieveContext(
      tenantId,
      retrievalQuestion
    );

    let webContextText = '';
    let webSources = [];
    let usedWeb = false;

    // Hybrid: internal DB + Tavily web when useful / configured
    if (process.env.TAVILY_API_KEY && needsExternalSearch(trimmedQuestion)) {
      const web = await searchWeb(trimmedQuestion, { maxResults: 5, searchDepth: 'basic' });
      if (!web.skipped && web.contextText) {
        webContextText = web.contextText;
        webSources = web.sources || [];
        usedWeb = true;
      } else if (web.reason) {
        console.warn('RAG: Tavily skipped:', web.reason);
      }
    }

    const sources = [...new Set([...(inventorySources || []), ...webSources])];

    let response;
    try {
      response = await generateAnswer(
        trimmedQuestion,
        contextText,
        webContextText,
        history
      );
    } catch (aiError) {
      console.error('RAG Groq error during sendMessage:', aiError);
      const isLimit = isTokenLimitError(aiError);
      const status = isLimit ? 429 : (aiError.status || 500);
      const message = isLimit
        ? "You've reached your current limit for AI queries. Please wait a moment and try again."
        : aiError.message?.includes('GROQ_API_KEY')
        ? 'AI service is not configured. Please set GROQ_API_KEY in .env'
        : "You've reached your limit or AI service is temporarily unavailable. Please try again later.";

      return res.status(status).json({ message });
    }

    const saved = await RagQuery.create({
      tenantId,
      userId,
      chatSessionId: chatId,
      question: trimmedQuestion,
      response,
      sources
    });

    chat.messageCount += 1;
    chat.updatedAt = new Date();

    if (isFirstMessage) {
      try {
        chat.title = await generateChatTitle(trimmedQuestion);
      } catch (titleErr) {
        console.warn('RAG: title generation failed:', titleErr.message);
        chat.title = trimmedQuestion.length > 48
          ? `${trimmedQuestion.slice(0, 45)}...`
          : trimmedQuestion;
      }
    }

    await chat.save();

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount,
        updatedAt: chat.updatedAt
      },
      message: {
        id: saved._id,
        query: trimmedQuestion,
        response,
        sources,
        usedWeb,
        timestamp: saved.createdAt
      }
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Failed to process your question. Please try again.'
    });
  }
};

/** @deprecated Use chat sessions — kept for backward compatibility */
exports.query = async (req, res) => {
  try {
    const chat = await RagChatSession.create({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      title: 'New Chat'
    });

    req.params = { chatId: chat._id.toString() };
    return exports.sendMessage(req, res);
  } catch (err) {
    console.error('RAG Query Error:', err);
    res.status(500).json({ message: 'Failed to process your question. Please try again.' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const history = await RagQuery.find({ tenantId, userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('question response sources createdAt chatSessionId')
      .lean();

    res.status(200).json({
      success: true,
      queries: history.map(formatMessage)
    });
  } catch (err) {
    console.error('RAG History Error:', err);
    res.status(500).json({ message: 'Failed to load query history' });
  }
};

exports.getRecentQueries = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const userId = req.auth.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);

    const chats = await RagChatSession.find({
      tenantId,
      userId,
      messageCount: { $gt: 0 }
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      queries: chats.map((chat) => ({
        id: chat._id,
        chatId: chat._id,
        query: chat.title,
        title: chat.title,
        type: 'analysis',
        timestamp: chat.updatedAt
      }))
    });
  } catch (err) {
    console.error('RAG Recent Queries Error:', err);
    res.status(500).json({ message: 'Failed to load recent queries' });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const tenantId = req.auth.tenantId;
    const result = await generateInsights(tenantId);

    res.status(200).json({
      success: true,
      executiveSummary: result.executiveSummary,
      insights: result.insights,
      recommendations: result.recommendations,
      aiGenerated: true,
      generatedAt: new Date()
    });
  } catch (err) {
    console.error('RAG Insights Error:', err);

    const isLimit = isTokenLimitError(err);
    const status = isLimit ? 429 : (err.status || 500);
    const message = err.message?.includes('GROQ_API_KEY')
      ? 'AI service is not configured. Please set GROQ_API_KEY in .env'
      : isLimit
        ? "You've reached your current limit for AI queries. Please wait a moment and try again."
        : 'Failed to generate AI insights. Please try again.';

    res.status(status).json({ message });
  }
};
