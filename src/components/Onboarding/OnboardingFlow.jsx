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
  { ticker: 'AAPL',   name: 'Apple',    flag: '🇺🇸' },
  { ticker: 'NVDA',   name: 'NVIDIA',   flag: '🇺🇸' },
  { ticker: 'TSLA',   name: 'Tesla',    flag: '🇺🇸' },
  { ticker: 'MSFT',   name: 'Microsoft',flag: '🇺🇸' },
  { ticker: '005930', name: '삼성전자', flag: '🇰🇷' },
  { ticker: '000660', name: 'SK하이닉스',flag: '🇰🇷' },
  { ticker: 'META',   name: 'Meta',     flag: '🇺🇸' },
  { ticker: 'AMZN',   name: 'Amazon',   flag: '🇺🇸' },
];

const KOREAN_STOCK_NAMES = {
  '005930': '삼성전자', '000660': 'SK하이닉스', '035420': 'NAVER',
  '035720': '카카오',   '005380': '현대차',      '000270': '기아',
  '051910': 'LG화학',   '373220': 'LG에너지솔루션', '068270': '셀트리온',
  '005490': 'POSCO홀딩스', '006400': '삼성SDI', '207940': '삼성바이오로직스',
  '323410': '카카오뱅크', '352820': '하이브',
};

// 단계별 배경 그라데이션
const STEP_GRADIENTS = [
  'from-blue-600 via-indigo-600 to-purple-700',
  'from-indigo-600 via-blue-500 to-cyan-600',
  'from-violet-600 via-purple-500 to-pink-600',
  'from-blue-500 via-teal-500 to-emerald-600',
];

const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    interests: [],
    portfolio: []
  });
  const [stockInput, setStockInput] = useState('');

  const totalSteps = 4;

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

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(s => s + 1);
    } else {
      const finalProfile = { ...profile, name: profile.name || '투자자' };
      localStorage.setItem('userProfile', JSON.stringify(finalProfile));
      onComplete(finalProfile);
    }
  };

  const handleSkip = () => {
    const defaultProfile = { name: '투자자', email: '', interests: [], portfolio: [] };
    localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
    onComplete(defaultProfile);
  };

  const canNext = () => {
    if (step === 2) return profile.interests.length > 0;
    return true;
  };

  const getStockLabel = (ticker) => {
    return KOREAN_STOCK_NAMES[ticker] || ticker;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${STEP_GRADIENTS[step]} transition-all duration-700`} />
      {/* 반투명 패턴 오버레이 */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      {/* 헤더 */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4 md:pt-8">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-base">IC</span>
          </div>
          <span className="text-white font-bold text-base">투자 캘린더</span>
        </div>
        <button onClick={handleSkip} className="text-white/70 hover:text-white text-sm font-medium transition">
          건너뛰기
        </button>
      </div>

      {/* 진행 점 */}
      <div className="relative z-10 flex justify-center gap-2 py-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-500 ${
            i === step ? 'w-6 h-2.5 bg-white' :
            i < step ? 'w-2.5 h-2.5 bg-white/60' :
            'w-2.5 h-2.5 bg-white/30'
          }`} />
        ))}
      </div>

      {/* 콘텐츠 카드 */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-0">
        <div className="bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
          style={{ minHeight: '65vh' }}>

          {/* 단계별 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">

            {/* ===== STEP 0: 환영 ===== */}
            {step === 0 && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-4xl">📅</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-3">투자 캘린더에 오신걸 환영해요!</h2>
                <p className="text-gray-500 leading-relaxed mb-8 text-sm">
                  FOMC, CPI, 실적발표 등 중요한<br />투자 이벤트를 한눈에 관리하세요
                </p>

                <div className="space-y-3 text-left">
                  {[
                    { icon: '🔔', title: '스마트 알림', desc: '중요 이벤트 전 미리 알림' },
                    { icon: '📊', title: 'AI 리스크 분석', desc: '내 포트폴리오 맞춤 리스크 점수' },
                    { icon: '🤖', title: 'AI 어시스턴트', desc: '투자 일정 관련 즉시 답변' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== STEP 1: 기본정보 ===== */}
            {step === 1 && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">👤</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">기본 정보</h2>
                  <p className="text-sm text-gray-400">이름은 선택 사항이에요</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">이름 (선택)</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="예: 김투자"
                      className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-2xl text-gray-900 text-base focus:outline-none focus:border-blue-400 bg-gray-50 placeholder-gray-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">이메일 (알림용, 선택)</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-2xl text-gray-900 text-base focus:outline-none focus:border-blue-400 bg-gray-50 placeholder-gray-300 font-medium"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">🔒</span>
                    <p className="text-xs text-blue-600 leading-relaxed">
                      입력하신 정보는 기기에만 저장되며<br />서버로 전송되지 않습니다
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 2: 관심 분야 ===== */}
            {step === 2 && (
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">관심 분야 선택</h2>
                  <p className="text-sm text-gray-400">관심 있는 섹터를 골라주세요 (최소 1개)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {INTERESTS.map(item => {
                    const selected = profile.interests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={`relative p-4 rounded-2xl text-left transition-all active:scale-[0.97] border-2 ${
                          selected ? 'shadow-sm' : 'border-transparent bg-gray-50'
                        }`}
                        style={selected ? {
                          backgroundColor: item.bg,
                          borderColor: item.color,
                        } : {}}
                      >
                        {selected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: item.color }}>
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="text-2xl mb-2">{item.emoji}</div>
                        <div className="font-bold text-gray-900 text-sm">{item.label}</div>
                      </button>
                    );
                  })}
                </div>

                {profile.interests.length > 0 && (
                  <div className="mt-4 text-center">
                    <span className="text-xs text-gray-400">
                      {profile.interests.length}개 선택됨
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 3: 보유 종목 ===== */}
            {step === 3 && (
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">📈</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">보유 종목</h2>
                  <p className="text-sm text-gray-400">관련 이벤트 알림을 받을 수 있어요 (선택)</p>
                </div>

                {/* 입력 */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={stockInput}
                    onChange={e => setStockInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && addStock(stockInput)}
                    placeholder="예: AAPL, TSLA, 005930"
                    className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 focus:outline-none focus:border-blue-400 placeholder-gray-300 font-medium"
                  />
                  <button
                    onClick={() => addStock(stockInput)}
                    className="px-5 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition active:scale-95"
                  >
                    추가
                  </button>
                </div>

                {/* 빠른 추가 */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">빠른 추가</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_STOCKS.filter(s => !profile.portfolio.includes(s.ticker)).map(s => (
                      <button
                        key={s.ticker}
                        onClick={() => addStock(s.ticker)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold text-gray-600 transition-all"
                      >
                        <span>{s.flag}</span>
                        <span>{s.ticker}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선택된 종목 */}
                {profile.portfolio.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">선택된 종목 ({profile.portfolio.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.portfolio.map(ticker => (
                        <div key={ticker} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl">
                          <span className="text-sm font-bold text-gray-800">{ticker}</span>
                          {KOREAN_STOCK_NAMES[ticker] && (
                            <span className="text-xs text-gray-400">{KOREAN_STOCK_NAMES[ticker]}</span>
                          )}
                          <button onClick={() => removeStock(ticker)} className="ml-1 text-gray-300 hover:text-red-400 transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.portfolio.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl">
                    <span className="text-3xl block mb-2">📭</span>
                    <p className="text-sm text-gray-400">종목을 추가하면 맞춤 분석을 받을 수 있어요</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 하단 버튼 영역 */}
          <div className="p-5 border-t border-gray-100 bg-white safe-area-bottom flex-shrink-0">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 transition active:scale-95"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canNext()}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
                  canNext()
                    ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {step === totalSteps - 1 ? '🚀 시작하기' : '다음'}
              </button>
            </div>

            {/* 단계 텍스트 */}
            <p className="text-center text-xs text-gray-300 mt-3">
              {step + 1} / {totalSteps}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
