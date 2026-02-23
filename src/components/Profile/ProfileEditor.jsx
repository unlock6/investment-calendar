import React, { useState } from 'react';

const INTERESTS = [
  { id: 'tech',       label: '기술·IT',    emoji: '💻', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'finance',    label: '금융',        emoji: '💰', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'healthcare', label: '헬스케어',    emoji: '🏥', color: '#ec4899', bg: '#fdf2f8' },
  { id: 'energy',     label: '에너지',      emoji: '⚡', color: '#f97316', bg: '#fff7ed' },
  { id: 'consumer',   label: '소비재',      emoji: '🛒', color: '#10b981', bg: '#ecfdf5' },
  { id: 'realestate', label: '부동산',      emoji: '🏢', color: '#8b5cf6', bg: '#f5f3ff' },
];

const POPULAR_STOCKS = [
  { ticker: 'AAPL',   name: 'Apple',      flag: '🇺🇸' },
  { ticker: 'NVDA',   name: 'NVIDIA',     flag: '🇺🇸' },
  { ticker: 'TSLA',   name: 'Tesla',      flag: '🇺🇸' },
  { ticker: 'MSFT',   name: 'Microsoft',  flag: '🇺🇸' },
  { ticker: 'META',   name: 'Meta',       flag: '🇺🇸' },
  { ticker: 'AMZN',   name: 'Amazon',     flag: '🇺🇸' },
  { ticker: 'GOOGL',  name: 'Alphabet',   flag: '🇺🇸' },
  { ticker: 'JPM',    name: 'JPMorgan',   flag: '🇺🇸' },
  { ticker: '005930', name: '삼성전자',    flag: '🇰🇷' },
  { ticker: '000660', name: 'SK하이닉스', flag: '🇰🇷' },
  { ticker: '035420', name: 'NAVER',      flag: '🇰🇷' },
  { ticker: '035720', name: '카카오',     flag: '🇰🇷' },
];

const KOREAN_STOCK_NAMES = {
  '005930': '삼성전자', '000660': 'SK하이닉스', '035420': 'NAVER',
  '035720': '카카오',   '005380': '현대차',      '000270': '기아',
  '051910': 'LG화학',   '373220': 'LG에너지솔루션', '068270': '셀트리온',
  '005490': 'POSCO홀딩스', '006400': '삼성SDI', '207940': '삼성바이오로직스',
  '323410': '카카오뱅크', '352820': '하이브', '028260': '삼성물산',
  '012330': '현대모비스', '003670': '포스코퓨처엠', '096770': 'SK이노베이션',
  '105560': 'KB금융', '055550': '신한지주', '086790': '하나금융지주',
  '066570': 'LG전자', '017670': 'SK텔레콤', '030200': 'KT',
};

const SECTION_COLORS = {
  info:      { bg: '#f0f9ff', accent: '#3b82f6' },
  interests: { bg: '#f5f3ff', accent: '#8b5cf6' },
  portfolio: { bg: '#ecfdf5', accent: '#10b981' },
};

const ProfileEditor = ({ profile: initialProfile, onSave, onClose }) => {
  const [profile, setProfile] = useState(initialProfile || {
    name: '', email: '', interests: [], portfolio: []
  });
  const [stockInput, setStockInput] = useState('');
  const [activeSection, setActiveSection] = useState('info');

  const toggleInterest = (id) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const addStock = (ticker) => {
    const t = ticker.trim().toUpperCase();
    if (t && !profile.portfolio.includes(t)) {
      setProfile(prev => ({ ...prev, portfolio: [...prev.portfolio, t] }));
      setStockInput('');
    }
  };

  const removeStock = (ticker) => {
    setProfile(prev => ({ ...prev, portfolio: prev.portfolio.filter(s => s !== ticker) }));
  };

  const handleSave = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    onSave(profile);
  };

  const sections = [
    { id: 'info',      label: '기본정보', emoji: '👤' },
    { id: 'interests', label: '관심분야', emoji: '🎯' },
    { id: 'portfolio', label: '종목',     emoji: '📈' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div
        className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 (모바일) */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900">프로필 편집</h2>
            <p className="text-xs text-gray-400 mt-0.5">기기에만 저장되는 정보예요</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 섹션 탭 */}
        <div className="flex gap-1.5 px-6 pb-4 flex-shrink-0">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === s.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* 섹션 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">

          {/* 기본정보 */}
          {activeSection === 'info' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">이름</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="예: 김투자"
                    className="w-full px-4 py-3 bg-white border-0 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">이메일 (알림용)</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-white border-0 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                  />
                </div>
              </div>

              {/* 현재 선택 요약 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-purple-600">{profile.interests.length}</div>
                  <div className="text-xs text-purple-400 font-medium mt-0.5">관심 분야</div>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-green-600">{profile.portfolio.length}</div>
                  <div className="text-xs text-green-400 font-medium mt-0.5">보유 종목</div>
                </div>
              </div>
            </div>
          )}

          {/* 관심 분야 */}
          {activeSection === 'interests' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">관심있는 섹터를 선택하면 맞춤 뉴스와 분석을 제공해요</p>

              <div className="grid grid-cols-2 gap-2.5">
                {INTERESTS.map(item => {
                  const selected = profile.interests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleInterest(item.id)}
                      className={`relative p-4 rounded-2xl text-left transition-all active:scale-[0.97] border-2 ${
                        selected ? '' : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                      style={selected ? { backgroundColor: item.bg, borderColor: item.color } : {}}
                    >
                      {selected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: item.color }}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="text-2xl mb-1.5">{item.emoji}</div>
                      <div className="font-bold text-gray-900 text-sm">{item.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* 선택된 태그 */}
              {profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs text-gray-400 w-full">선택됨:</span>
                  {profile.interests.map(id => {
                    const item = INTERESTS.find(i => i.id === id);
                    if (!item) return null;
                    return (
                      <span key={id} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: item.bg, color: item.color, border: `1px solid ${item.color}30` }}>
                        {item.emoji} {item.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 보유 종목 */}
          {activeSection === 'portfolio' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">관련 이벤트 알림과 리스크 분석을 받아보세요</p>

              {/* 입력 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={stockInput}
                  onChange={e => setStockInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && addStock(stockInput)}
                  placeholder="예: AAPL, 005930"
                  className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-300 font-medium"
                />
                <button
                  onClick={() => addStock(stockInput)}
                  className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition active:scale-95"
                >
                  추가
                </button>
              </div>

              {/* 빠른 추가 */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">빠른 추가</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_STOCKS.filter(s => !profile.portfolio.includes(s.ticker)).map(s => (
                    <button
                      key={s.ticker}
                      onClick={() => addStock(s.ticker)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-xl text-xs font-semibold text-gray-600 transition-all"
                    >
                      <span>{s.flag}</span>
                      <span>{s.ticker}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 선택된 종목 */}
              {profile.portfolio.length > 0 ? (
                <div className="bg-green-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">
                    내 종목 ({profile.portfolio.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.portfolio.map(ticker => (
                      <div key={ticker} className="flex items-center gap-1.5 bg-white border border-green-100 px-3 py-1.5 rounded-xl shadow-sm">
                        <span className="text-sm font-black text-gray-900">{ticker}</span>
                        {KOREAN_STOCK_NAMES[ticker] && (
                          <span className="text-xs text-gray-400">{KOREAN_STOCK_NAMES[ticker]}</span>
                        )}
                        <button onClick={() => removeStock(ticker)} className="text-gray-200 hover:text-red-400 transition ml-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
                  <span className="text-3xl block mb-2">📭</span>
                  <p className="text-sm text-gray-400">종목을 추가해보세요</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 safe-area-bottom">
          <button
            onClick={onClose}
            className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-sm"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
