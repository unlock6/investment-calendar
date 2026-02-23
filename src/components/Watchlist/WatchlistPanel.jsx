import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { fetchStockPrices } from '../../utils/api';

// 섹터 매핑 (로컬 보완용)
const SECTOR_MAP = {
  'AAPL': '기술', 'MSFT': '기술', 'GOOGL': '기술', 'NVDA': '반도체',
  'AMZN': '소비재', 'TSLA': '자동차', 'META': '기술', 'JPM': '금융',
  'BAC': '금융', 'GS': '금융', 'JNJ': '헬스케어', 'PFE': '헬스케어',
  'UNH': '헬스케어', 'XOM': '에너지', 'CVX': '에너지', 'NKE': '소비재',
  'DIS': '미디어', 'NFLX': '미디어',
  '005930': '반도체', '000660': '반도체', '035420': '기술',
  '035720': '기술', '005380': '자동차', '000270': '자동차',
  '051910': '화학', '006400': '배터리', '207940': '바이오',
};

// 시뮬레이션 폴백 (백엔드 다운 시)
const BASE_PRICES = {
  'AAPL': 227, 'MSFT': 415, 'GOOGL': 175, 'AMZN': 220, 'TSLA': 340,
  'NVDA': 135, 'META': 620, 'JPM': 245, 'BAC': 44, 'GS': 570,
  'JNJ': 165, 'PFE': 28, 'UNH': 580, 'XOM': 110, 'CVX': 160,
  'NKE': 78, 'DIS': 115, 'NFLX': 1010,
  '005930': 55000, '000660': 198000, '035420': 195000,
  '035720': 39000, '005380': 220000, '000270': 98000,
};

function simulateFallback(ticker) {
  const base = BASE_PRICES[ticker] || 100;
  const changePercent = (Math.random() - 0.48) * 4;
  const change = base * (changePercent / 100);
  return {
    price: base + change,
    change,
    changePercent,
    isUp: changePercent >= 0,
    isFallback: true,
  };
}

const WatchlistPanel = ({ userProfile }) => {
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRealData, setIsRealData] = useState(false);

  const portfolio = userProfile?.portfolio || [];

  const loadPrices = useCallback(async () => {
    if (portfolio.length === 0) return;
    setLoading(true);
    try {
      const data = await fetchStockPrices(portfolio);

      // 실제 데이터 처리
      const processed = {};
      portfolio.forEach(ticker => {
        const d = data[ticker];
        if (d && d.price !== null) {
          processed[ticker] = {
            name: d.name || ticker,
            sector: SECTOR_MAP[ticker] || '기타',
            price: d.price,
            change: d.change || 0,
            changePercent: d.changePercent || 0,
            currency: d.currency || 'USD',
            isUp: d.isUp ?? (d.changePercent >= 0),
            isFallback: false,
          };
        } else {
          // 해당 종목만 폴백
          processed[ticker] = {
            name: d?.name || ticker,
            sector: SECTOR_MAP[ticker] || '기타',
            ...simulateFallback(ticker),
          };
        }
      });

      setStockData(processed);
      setIsRealData(true);
      setLastUpdate(new Date());
    } catch (err) {
      console.warn('실시간 가격 조회 실패, 시뮬레이션으로 대체:', err.message);

      // 전체 폴백
      const fallback = {};
      portfolio.forEach(ticker => {
        fallback[ticker] = {
          name: ticker,
          sector: SECTOR_MAP[ticker] || '기타',
          ...simulateFallback(ticker),
        };
      });
      setStockData(fallback);
      setIsRealData(false);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, [portfolio]);

  // 초기 로드 + 5분마다 갱신
  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  const sortedStocks = useMemo(() => {
    return portfolio
      .filter(ticker => stockData[ticker])
      .sort((a, b) => {
        const aChange = stockData[a]?.changePercent || 0;
        const bChange = stockData[b]?.changePercent || 0;
        return bChange - aChange;
      });
  }, [portfolio, stockData]);

  const avgChange = useMemo(() => {
    if (sortedStocks.length === 0) return 0;
    const total = sortedStocks.reduce((sum, t) => sum + (stockData[t]?.changePercent || 0), 0);
    return (total / sortedStocks.length).toFixed(2);
  }, [sortedStocks, stockData]);

  if (portfolio.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-400 text-sm py-10">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📈</span>
          </div>
          <p className="font-medium text-gray-600 mb-1">관심종목이 없습니다</p>
          <p className="text-xs">프로필에서 포트폴리오를 설정해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">관심종목</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isRealData ? 'bg-green-500' : 'bg-amber-400'}`} />
              <span className="text-xs text-gray-400">
                {isRealData ? '실시간' : '시뮬레이션'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            parseFloat(avgChange) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            평균 {parseFloat(avgChange) >= 0 ? '+' : ''}{avgChange}%
          </div>
          <button
            onClick={loadPrices}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            title="새로고침"
          >
            <svg
              className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 로딩 스켈레톤 */}
      {loading && sortedStocks.length === 0 && (
        <div className="space-y-2">
          {portfolio.slice(0, 4).map(t => (
            <div key={t} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-2 bg-gray-200 rounded w-14" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-2 bg-gray-200 rounded w-10 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 종목 리스트 */}
      {!loading || sortedStocks.length > 0 ? (
        <div className="space-y-1">
          {sortedStocks.map(ticker => {
            const stock = stockData[ticker];
            if (!stock) return null;
            const isKorean = /^\d{6}$/.test(ticker);
            const priceDisplay = isKorean
              ? Math.round(stock.price).toLocaleString('ko-KR') + '원'
              : '$' + stock.price.toFixed(2);

            return (
              <div key={ticker} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                {/* 아이콘 */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  stock.isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {ticker.substring(0, 3).toUpperCase()}
                </div>

                {/* 이름 + 섹터 */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{stock.name}</div>
                  <div className="text-xs text-gray-400">{stock.sector}</div>
                </div>

                {/* 가격 + 변동률 */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm text-gray-900">{priceDisplay}</div>
                  <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                    stock.isUp ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {stock.isUp
                        ? <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        : <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                      }
                    </svg>
                    {stock.isUp ? '+' : ''}{typeof stock.changePercent === 'number' ? stock.changePercent.toFixed(2) : stock.changePercent}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 업데이트 시간 */}
      {lastUpdate && (
        <div className="text-center text-xs text-gray-300 pt-1 flex items-center justify-center gap-1">
          <span>{lastUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준</span>
          {isRealData
            ? <span className="text-green-400">· Yahoo Finance</span>
            : <span className="text-amber-400">· 시뮬레이션 (서버 오프라인)</span>
          }
        </div>
      )}
    </div>
  );
};

export default WatchlistPanel;
