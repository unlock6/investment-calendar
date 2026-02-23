import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const prisma = new PrismaClient();

/**
 * 날짜 파싱 헬퍼
 */
function parseDateQuery(message) {
  const lowerMsg = message.toLowerCase();
  
  // 오늘
  if (lowerMsg.includes('오늘')) {
    return { type: 'today', days: 0 };
  }
  
  // 내일
  if (lowerMsg.includes('내일')) {
    return { type: 'tomorrow', days: 1 };
  }
  
  // 이번 주
  if (lowerMsg.includes('이번 주') || lowerMsg.includes('이번주')) {
    return { type: 'this_week', days: 7 };
  }
  
  // 다음 주
  if (lowerMsg.includes('다음 주') || lowerMsg.includes('다음주')) {
    return { type: 'next_week', days: 14 };
  }
  
  return null;
}

/**
 * 이벤트 조회 (날짜 범위)
 */
async function getEventsByDays(days) {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    
    // 🔧 수정: 시작 날짜 계산
    const startDate = new Date(today);
    if (days > 0) {
      // 내일/이번주 등: 오늘 다음날부터
      startDate.setDate(startDate.getDate() + 1);
    }
    // days = 0 (오늘)이면 startDate = today
    
    // 종료 날짜
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days + 1);

    console.log(`🔍 조회 범위: ${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`);

    const events = await prisma.event.findMany({
      where: {
        datetime: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: [
        { impact_level: 'desc' },
        { datetime: 'asc' }
      ]
    });

    console.log(`📊 조회된 이벤트: ${events.length}개`);
    return events;
  } catch (error) {
    console.error('이벤트 조회 에러:', error);
    return [];
  }
}

/**
 * 이벤트를 텍스트로 포맷팅
 */
function formatEventsForAI(events, userProfile) {
  if (!events || events.length === 0) {
    return '조회된 이벤트가 없습니다.';
  }

  const impactEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };

  const impactLabel = {
    high: '높은 영향',
    medium: '중간 영향',
    low: '낮은 영향'
  };

  let formatted = `총 ${events.length}개 이벤트:\n\n`;

  events.forEach((event, idx) => {
    const date = new Date(event.datetime);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const dateStr = `${month}월 ${day}일 ${hours}:${minutes}`;
    
    formatted += `${idx + 1}. ${impactEmoji[event.impact_level]} ${event.title}\n`;
    formatted += `   - 영향도: ${impactLabel[event.impact_level]}\n`;
    formatted += `   - 시간: ${dateStr}\n`;
    formatted += `   - 유형: ${event.event_type}\n`;
    
    if (event.description) {
      formatted += `   - 설명: ${event.description}\n`;
    }
    
    if (event.tags && Array.isArray(event.tags)) {
      formatted += `   - 태그: ${event.tags.join(', ')}\n`;
    }

    // 사용자 포트폴리오와 매칭
    if (userProfile && userProfile.portfolio && userProfile.portfolio.length > 0) {
      const matchedStocks = userProfile.portfolio.filter(stock => 
        event.title.includes(stock) || 
        (event.tags && event.tags.some(tag => tag.includes(stock)))
      );
      
      if (matchedStocks.length > 0) {
        formatted += `   - ⭐ 당신의 관심 종목: ${matchedStocks.join(', ')}\n`;
      }
    }
    
    formatted += '\n';
  });

  return formatted;
}

/**
 * 사용자 프로필 기반 System Prompt 생성
 */
function createSystemPrompt(userProfile, eventsContext = null) {
  let basePrompt = `당신은 친절한 투자 어시스턴트입니다.
초보 투자자도 이해하기 쉽게 설명하세요.
한국어로 자연스럽게 대화하세요.
투자 조언이 아닌 정보 제공이라는 점을 명심하세요.`;

  if (userProfile) {
    basePrompt += `\n\n### 사용자 프로필:`;

    if (userProfile.interests && userProfile.interests.length > 0) {
      const interestLabels = {
        tech: '기술/IT',
        finance: '금융',
        healthcare: '헬스케어',
        crypto: '암호화폐',
        energy: '에너지',
        consumer: '소비재'
      };
      const interests = userProfile.interests.map(i => interestLabels[i] || i).join(', ');
      basePrompt += `\n- 관심 섹터: ${interests}`;
    }

    if (userProfile.portfolio && userProfile.portfolio.length > 0) {
      basePrompt += `\n- 보유 종목: ${userProfile.portfolio.join(', ')}`;
    }

    if (userProfile.experience) {
      const expLabels = {
        beginner: '초보자',
        intermediate: '중급자',
        advanced: '고급자'
      };
      basePrompt += `\n- 투자 경험: ${expLabels[userProfile.experience] || userProfile.experience}`;
    }

    basePrompt += `\n\n### 개인화 지침:
- 사용자의 관심 섹터와 보유 종목에 특히 주의를 기울이세요
- 이벤트 설명 시 사용자 포트폴리오에 미치는 영향을 언급하세요
- 사용자의 경험 수준에 맞춰 설명의 난이도를 조절하세요
- 자연스럽게 사용자의 관심사를 대화에 반영하세요`;
  }

  // 이벤트 컨텍스트 추가
  if (eventsContext) {
    basePrompt += `\n\n### 이벤트 정보:
${eventsContext}

### 이벤트 답변 가이드:
- 위 이벤트 정보를 바탕으로 정확하게 답변하세요
- 사용자 보유 종목과 관련된 이벤트는 특히 강조하세요
- 영향도가 높은 이벤트를 우선 언급하세요
- 날짜와 시간을 명확히 알려주세요
- 초보자도 이해할 수 있게 쉽게 설명하세요`;
  }

  return basePrompt;
}

/**
 * AI 응답 생성 (재시도 포함)
 */
export async function generateAIResponse(userMessage, conversationHistory = [], userProfile = null) {
  const maxRetries = 3;
  const baseDelay = 1000;

  // 날짜 관련 질문인지 체크
  const dateQuery = parseDateQuery(userMessage);
  let eventsContext = null;

  if (dateQuery) {
    console.log(`📅 날짜 질문 감지: ${dateQuery.type} (${dateQuery.days}일)`);
    const events = await getEventsByDays(dateQuery.days);
    eventsContext = formatEventsForAI(events, userProfile);
    console.log('📊 이벤트 컨텍스트:', eventsContext);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 AI 요청 (시도 ${attempt}/${maxRetries}):`, userMessage);
      if (userProfile) {
        console.log('👤 프로필:', userProfile);
      }

      const messages = [
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      const systemPrompt = createSystemPrompt(userProfile, eventsContext);

      const response = await client.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: messages,
        system: systemPrompt
      });

      console.log('✅ AI 응답 성공');

      return {
        success: true,
        message: response.content[0].text
      };

    } catch (error) {
      console.error(`❌ AI Service Error (시도 ${attempt}/${maxRetries}):`, error.message);

      if (error.error?.type === 'overloaded_error' && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ ${delay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return {
        success: false,
        error: error.error?.type === 'overloaded_error' 
          ? '죄송해요, 서버가 바빠요. 잠시 후 다시 시도해주세요.'
          : '죄송해요, 일시적인 오류가 발생했어요. 다시 시도해주세요.'
      };
    }
  }

  return {
    success: false,
    error: '죄송해요, 서버가 바빠요. 잠시 후 다시 시도해주세요.'
  };
}

export default {
  generateAIResponse
};