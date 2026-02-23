import React, { useMemo } from 'react';
import { getEventTypeConfig, IMPACT_LEVELS, calculateDDay } from '../../utils/eventTypes';

/**
 * 원형 SVG 게이지 컴포넌트
 */
const CircularGauge = ({ score, size = 140, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const getColor = (s) => {
    if (s < 30) return { stroke: '#22c55e', bg: '#f0fdf4', text: '#16a34a' };
    if (s < 60) return { stroke: '#f59e0b', bg: '#fffbeb', text: '#d97706' };
    return { stroke: '#ef4444', bg: '#fef2f2', text: '#dc2626' };
  };

  const colors = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* 진행 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: colors.text }}>{score}</span>
        <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
      </div>
    </div>
  );
};

const RiskPanel = ({ events, myEvents, userProfile }) => {

  const upcomingRisks = useMemo(() => {
    const today = new Date();
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const highImpactEvents = events.filter(event => {
      const eventDate = new Date(event.datetime);
      return event.impact_level === 'high' && eventDate >= today && eventDate <= next7Days;
    });

    return highImpactEvents.slice(0, 5);
  }, [events]);

  const riskScore = useMemo(() => {
    if (!userProfile || !userProfile.portfolio || userProfile.portfolio.length === 0) {
      return { score: 0, level: 'N/A', color: 'gray' };
    }

    const portfolio = userProfile.portfolio;

    const portfolioRisks = events.filter(event => {
      const isHighImpact = event.impact_level === 'high';
      const isPortfolioRelated = portfolio.some(stock =>
        event.tags && event.tags.includes(stock)
      );
      const isFuture = new Date(event.datetime) > new Date();
      return isHighImpact && isPortfolioRelated && isFuture;
    }).length;

    const baseScore = Math.min(100, portfolioRisks * 15);
    const diversificationPenalty = portfolio.length < 3 ? 20 : 0;
    const finalScore = Math.min(100, baseScore + diversificationPenalty);

    let level, color;
    if (finalScore < 30) { level = '낮음'; color = 'green'; }
    else if (finalScore < 60) { level = '중간'; color = 'yellow'; }
    else { level = '높음'; color = 'red'; }

    return { score: finalScore, level, color };
  }, [events, myEvents, userProfile]);

  const sectorConcentration = useMemo(() => {
    if (!userProfile || !userProfile.portfolio || userProfile.portfolio.length === 0) {
      return [];
    }

    const sectorMap = {
      'AAPL': '기술', 'MSFT': '기술', 'GOOGL': '기술', 'META': '기술',
      'AMZN': '소비재', 'TSLA': '자동차',
      'NVDA': '반도체', '005930': '반도체', '000660': '반도체',
      '035420': '기술', '035720': '기술',
      'JPM': '금융', 'BAC': '금융', 'GS': '금융',
      'JNJ': '헬스케어', 'PFE': '헬스케어', 'UNH': '헬스케어',
      'XOM': '에너지', 'CVX': '에너지',
    };

    const sectors = {};
    userProfile.portfolio.forEach(stock => {
      const sector = sectorMap[stock] || '기타';
      sectors[sector] = (sectors[sector] || 0) + 1;
    });

    const total = userProfile.portfolio.length;
    const sectorColors = {
      '기술': '#3b82f6', '반도체': '#8b5cf6', '소비재': '#f59e0b',
      '자동차': '#ef4444', '금융': '#10b981', '헬스케어': '#ec4899',
      '에너지': '#f97316', '기타': '#6b7280'
    };

    return Object.entries(sectors).map(([sector, count]) => ({
      sector,
      count,
      percentage: ((count / total) * 100).toFixed(1),
      color: sectorColors[sector] || '#6b7280'
    })).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  }, [userProfile]);

  // 분산투자 등급
  const diversificationGrade = useMemo(() => {
    if (!userProfile?.portfolio?.length) return { grade: '-', color: '#9ca3af' };
    const count = userProfile.portfolio.length;
    const sectorCount = sectorConcentration.length;
    const maxConcentration = sectorConcentration.length > 0
      ? Math.max(...sectorConcentration.map(s => parseFloat(s.percentage)))
      : 100;

    if (count >= 10 && sectorCount >= 4 && maxConcentration < 40) return { grade: 'A+', color: '#16a34a' };
    if (count >= 7 && sectorCount >= 3 && maxConcentration < 50) return { grade: 'A', color: '#22c55e' };
    if (count >= 5 && sectorCount >= 2) return { grade: 'B+', color: '#3b82f6' };
    if (count >= 3) return { grade: 'B', color: '#f59e0b' };
    return { grade: 'C', color: '#ef4444' };
  }, [userProfile, sectorConcentration]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900">리스크 분석</h3>
      </div>

      {/* 원형 게이지 */}
      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700">포트폴리오 리스크</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            riskScore.color === 'green' ? 'bg-green-100 text-green-700' :
            riskScore.color === 'yellow' ? 'bg-amber-100 text-amber-700' :
            riskScore.color === 'red' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {riskScore.level}
          </span>
        </div>

        <div className="flex justify-center py-3">
          <CircularGauge score={riskScore.score} />
        </div>

        <div className="text-center text-xs text-gray-400 mt-1">
          {riskScore.score < 30 && '안정적인 포트폴리오입니다'}
          {riskScore.score >= 30 && riskScore.score < 60 && '일부 리스크 요인에 주의하세요'}
          {riskScore.score >= 60 && '포지션 조정을 고려해보세요'}
        </div>
      </div>

      {/* 섹터 집중도 + 분산등급 */}
      {sectorConcentration.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>📊</span> 섹터 집중도
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">분산등급</span>
              <span className="text-lg font-black" style={{ color: diversificationGrade.color }}>
                {diversificationGrade.grade}
              </span>
            </div>
          </div>
          <div className="space-y-2.5">
            {sectorConcentration.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{item.sector}</span>
                  <span className="font-bold text-gray-900">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {sectorConcentration.some(s => parseFloat(s.percentage) > 50) && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-1.5">
              <span className="flex-shrink-0">⚠️</span>
              <span><strong>집중 위험:</strong> 한 섹터에 50% 이상 집중되어 있습니다</span>
            </div>
          )}
        </div>
      )}

      {/* 7일 내 고위험 이벤트 */}
      {upcomingRisks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <span>🔥</span> 7일 내 주요 이벤트
          </h4>
          <div className="space-y-2">
            {upcomingRisks.map((event, idx) => {
              const dDay = calculateDDay(event.datetime);
              const typeConfig = getEventTypeConfig(event.event_type);
              return (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: typeConfig.bgColor }}>
                    {typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{event.title}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(event.datetime).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    dDay.isToday ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {dDay.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 팁 */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="text-xs text-blue-900">
          <div className="font-bold mb-2 flex items-center gap-1">
            <span>💡</span> 애널리스트 TIP
          </div>
          <div className="space-y-1.5 text-blue-800">
            <p>• 3개 이상 종목으로 분산 투자</p>
            <p>• 한 섹터에 50% 이상 집중 지양</p>
            <p>• 고위험 이벤트 전 포지션 조정 고려</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskPanel;
