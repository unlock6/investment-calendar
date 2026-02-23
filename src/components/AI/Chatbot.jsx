import React, { useState, useRef, useEffect } from 'react';

const Chatbot = ({ onClose, userProfile }) => { // userProfile 추가
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: userProfile 
        ? `안녕하세요! ${userProfile.portfolio.length > 0 ? `${userProfile.portfolio[0]} 등을 보유 중이시네요. ` : ''}무엇을 도와드릴까요?`
        : '안녕하세요! 투자 어시스턴트입니다. 무엇을 도와드릴까요?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userProfile: userProfile // 프로필 전달
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.message }
        ]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: '죄송해요, 오류가 발생했어요. 다시 시도해주세요.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const askExample = (question) => {
    setInput(question);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">🤖 AI 어시스턴트</h2>
            {userProfile && userProfile.portfolio.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                관심: {userProfile.portfolio.slice(0, 3).join(', ')}
                {userProfile.portfolio.length > 3 && ` 외 ${userProfile.portfolio.length - 3}개`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 예시 질문 */}
{messages.length === 1 && (
  <div className="px-4 pb-2">
    <p className="text-sm text-gray-400 mb-2">💡 이렇게 물어보세요:</p>
    <div className="flex flex-wrap gap-2">
      {userProfile && userProfile.portfolio.length > 0 ? (
        <>
          <button
            onClick={() => askExample('내일 뭐 있어?')}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
          >
            내일 뭐 있어?
          </button>
          <button
            onClick={() => askExample('이번 주 중요한 이벤트는?')}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
          >
            이번 주 중요한 이벤트는?
          </button>
          <button
            onClick={() => askExample(`${userProfile.portfolio[0]} 실적 언제야?`)}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
          >
            {userProfile.portfolio[0]} 실적 언제야?
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => askExample('오늘 뭐 있어?')}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
          >
            오늘 뭐 있어?
          </button>
          <button
            onClick={() => askExample('내일 중요한 이벤트는?')}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
          >
            내일 중요한 이벤트는?
          </button>
          <button
            onClick={() => askExample('Fed 금리가 뭐예요?')}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
          >
            Fed 금리가 뭐예요?
          </button>
        </>
      )}
    </div>
  </div>
)}


        {/* 입력 영역 */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;