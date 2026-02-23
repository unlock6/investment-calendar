import { generateAIResponse } from '../services/aiService.js';

/**
 * POST /api/ai/chat
 * AI와 대화하기
 */
export const chat = async (req, res) => {
  try {
    const { message, conversationHistory, userProfile } = req.body;

    console.log('💬 채팅 요청:', message);
    if (userProfile) {
      console.log('👤 사용자 프로필:', userProfile);
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await generateAIResponse(message, conversationHistory, userProfile);

    if (response.success) {
      res.json({
        message: response.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ error: response.error });
    }

  } catch (error) {
    console.error('❌ Chat Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
};