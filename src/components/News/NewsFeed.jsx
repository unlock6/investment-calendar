import React, { useState, useEffect, useCallback } from 'react';
import { fetchNews } from '../../utils/api';

const FILTERS = [
  { id: 'all',    label: '전체' },
  { id: 'global', label: '글로벌' },
  { id: 'korea',  label: '국내' },
];

// 포트폴리오 관련 키워드 매칭
const TICKER_KEYWORDS = {
  AAPL: ['Apple', '애플'], NVDA: ['NVIDIA', '엔비디아'], TSLA: ['Tesla', '테슬라'],
  MSFT: ['Microsoft', '마이크로소프트'], META: ['Meta', '메타'], AMZN: ['Amazon', '아마존'],
  GOOGL: ['Alphabet', 'Google', '구글'], JPM: ['JPMorgan', 'JP모건'],
  '005930': ['삼성전자', '삼성'], '000660': ['SK하이닉스', '하이닉스'],
  '035420': ['NAVER', '네이버'], '035720': ['카카오'],
  '005380': ['현대차', '현대자동차'], '000270': ['기아'],
};

function isRelated(article, portfolio = []) {
  if (!portfolio.length) return false;
  const text = `${article.title} ${article.summary}`.toLowerCase();
  return portfolio.some(ticker => {
    const keywords = TICKER_KEYWORDS[ticker] || [ticker];
    return keywords.some(kw => text.includes(kw.toLowerCase()));
  });
}

const NewsFeed = ({ userProfile }) => {
  const [articles, setArticles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);

  const portfolio = userProfile?.portfolio || [];

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchNews(filter);
      setArticles(data);
      setLastUpdate(new Date());
    } catch (e) {
      setError('뉴스를 불러오지 못했습니다');
      console.error('[news]', e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // 30분마다 자동 갱신
  useEffect(() => {
    const interval = setInterval(load, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  // 포트폴리오 관련 기사 상단 정렬
  const sorted = [...articles].sort((a, b) => {
    const ar = isRelated(a, portfolio) ? 1 : 0;
    const br = isRelated(b, portfolio) ? 1 : 0;
    return br - ar;
  });

  return (
    <div className="flex flex-col h-full">

      {/* 필터 + 새로고침 */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex gap-1 flex-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          title="새로고침"
        >
          <svg className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-3 rounded-xl border border-gray-100 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded bg-gray-200" />
                  <div className="w-16 h-3 rounded bg-gray-200" />
                  <div className="ml-auto w-10 h-3 rounded bg-gray-200" />
                </div>
                <div className="w-full h-4 rounded bg-gray-200 mb-1.5" />
                <div className="w-4/5 h-4 rounded bg-gray-200 mb-2" />
                <div className="w-full h-3 rounded bg-gray-100" />
                <div className="w-2/3 h-3 rounded bg-gray-100 mt-1" />
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">📡</span>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">{error}</p>
            <p className="text-xs text-gray-400 mb-4">백엔드 서버가 실행 중인지 확인해주세요</p>
            <button onClick={load}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-700 transition">
              다시 시도
            </button>
          </div>
        )}

        {/* 뉴스 목록 */}
        {!loading && !error && (
          <div className="p-3 space-y-2">
            {sorted.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">뉴스가 없습니다</div>
            ) : sorted.map(item => {
              const related = isRelated(item, portfolio);
              return (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-3 rounded-xl border transition-all hover:shadow-sm active:scale-[0.99] ${
                    related
                      ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70'
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* 소스 + 시간 */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm leading-none">{item.sourceIcon}</span>
                      <span className="text-xs font-semibold text-gray-600">{item.source}</span>
                      {related && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                          내 종목
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
                  </div>

                  {/* 제목 */}
                  <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2">
                    {item.title}
                  </h4>

                  {/* 요약 */}
                  {item.summary && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        )}

        {/* 업데이트 시간 */}
        {lastUpdate && !loading && (
          <div className="text-center text-xs text-gray-300 py-3">
            {lastUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준 · 30분마다 자동 갱신
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
