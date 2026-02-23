import React, { useMemo } from 'react';

const PortfolioAnalysis = ({ userProfile, myEvents }) => {
  
  const diversificationScore = useMemo(() => {
    if (!userProfile || !userProfile.portfolio || userProfile.portfolio.length === 0) {
      return { score: 0, grade: 'N/A', feedback: '포트폴리오를 설정해주세요' };
    }
    
    const count = userProfile.portfolio.length;
    let score, grade, feedback;
    
    if (count >= 10) {
      score = 100;
      grade = 'A+';
      feedback = '매우 우수한 분산 투자';
    } else if (count >= 7) {
      score = 90;
      grade = 'A';
      feedback = '우수한 분산 투자';
    } else if (count >= 5) {
      score = 75;
      grade = 'B+';
      feedback = '양호한 분산 투자';
    } else if (count >= 3) {
      score = 60;
      grade = 'B';
      feedback = '최소 분산 달성';
    } else {
      score = 30;
      grade = 'C';
      feedback = '분산 투자 부족 (3개 이상 권장)';
    }
    
    return { score, grade, feedback, count };
  }, [userProfile]);
  
  const interestCoverage = useMemo(() => {
    if (!userProfile) return { covered: 0, total: 0, percentage: 0 };
    
    const interests = userProfile.interests || [];
    const portfolio = userProfile.portfolio || [];
    
    if (interests.length === 0) return { covered: 0, total: 0, percentage: 0 };
    
    const interestStockMap = {
      tech: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', '035420', '035720'],
      finance: ['JPM', 'BAC', 'GS'],
      healthcare: ['JNJ', 'PFE', 'UNH'],
      energy: ['XOM', 'CVX'],
      consumer: ['AMZN', 'TSLA', 'NKE']
    };
    
    let covered = 0;
    interests.forEach(interest => {
      const relevantStocks = interestStockMap[interest] || [];
      const hasStock = portfolio.some(stock => relevantStocks.includes(stock));
      if (hasStock) covered++;
    });
    
    return {
      covered,
      total: interests.length,
      percentage: ((covered / interests.length) * 100).toFixed(0)
    };
  }, [userProfile]);
  
  const activityScore = useMemo(() => {
    const eventCount = myEvents ? myEvents.length : 0;
    
    let score, grade, feedback;
    if (eventCount >= 20) {
      score = 100;
      grade = '매우 활발';
      feedback = '우수한 시장 모니터링';
    } else if (eventCount >= 10) {
      score = 75;
      grade = '활발';
      feedback = '적절한 관심 유지';
    } else if (eventCount >= 5) {
      score = 50;
      grade = '보통';
      feedback = '더 많은 이벤트 추적 권장';
    } else {
      score = 25;
      grade = '낮음';
      feedback = '주요 이벤트 등록 필요';
    }
    
    return { score, grade, feedback, count: eventCount };
  }, [myEvents]);
  
  const investmentStyle = useMemo(() => {
    const divScore = diversificationScore.score;
    const actScore = activityScore.score;
    
    if (divScore >= 75 && actScore >= 75) {
      return {
        style: '적극적 분산 투자자',
        icon: '🎯',
        color: 'blue',
        description: '다양한 종목에 분산하며 시장을 적극적으로 모니터링'
      };
    } else if (divScore >= 60 && actScore < 50) {
      return {
        style: '장기 보수적 투자자',
        icon: '🛡️',
        color: 'green',
        description: '분산된 포트폴리오를 장기 보유하는 안정적 스타일'
      };
    } else if (divScore < 60 && actScore >= 75) {
      return {
        style: '집중적 활동 투자자',
        icon: '🔍',
        color: 'purple',
        description: '소수 종목에 집중하며 시장을 면밀히 추적'
      };
    } else {
      return {
        style: '초보 투자자',
        icon: '🌱',
        color: 'yellow',
        description: '포트폴리오 구성과 시장 모니터링 강화 필요'
      };
    }
  }, [diversificationScore, activityScore]);
  
  if (!userProfile) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-400 text-sm py-8">
          <p className="mb-2">프로필을 설정하면</p>
          <p>투자 성향 분석을 볼 수 있어요!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start">
        <span className="text-lg mr-2 flex-shrink-0">📊</span>
        <h3 className="font-semibold text-gray-900 flex-1">투자 성향 분석</h3>
      </div>
      
      <div className={`bg-gradient-to-r ${
        investmentStyle.color === 'blue' ? 'from-blue-50 to-blue-100 border-blue-200' :
        investmentStyle.color === 'green' ? 'from-green-50 to-green-100 border-green-200' :
        investmentStyle.color === 'purple' ? 'from-purple-50 to-purple-100 border-purple-200' :
        'from-yellow-50 to-yellow-100 border-yellow-200'
      } border rounded-lg p-4`}>
        <div className="text-2xl mb-2">{investmentStyle.icon}</div>
        <div className="font-bold text-gray-900 mb-1">{investmentStyle.style}</div>
        <div className="text-sm text-gray-700">{investmentStyle.description}</div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-start flex-1">
            <span className="text-base mr-2 flex-shrink-0">📈</span>
            <h4 className="text-sm font-semibold text-gray-900 flex-1">분산투자 점수</h4>
          </div>
          <span className="text-2xl font-bold text-blue-600">{diversificationScore.grade}</span>
        </div>
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">{diversificationScore.feedback}</span>
            <span className="font-semibold">{diversificationScore.count}개 종목</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${diversificationScore.score}%` }}
            />
          </div>
        </div>
      </div>
      
      {interestCoverage.total > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start mb-3">
            <span className="text-base mr-2 flex-shrink-0">🎯</span>
            <h4 className="text-sm font-semibold text-gray-900 flex-1">관심 분야 커버리지</h4>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {interestCoverage.covered} / {interestCoverage.total} 분야 커버
            </div>
            <div className="text-lg font-bold text-green-600">{interestCoverage.percentage}%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${interestCoverage.percentage}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-start flex-1">
            <span className="text-base mr-2 flex-shrink-0">📡</span>
            <h4 className="text-sm font-semibold text-gray-900 flex-1">시장 모니터링</h4>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700">
            {activityScore.grade}
          </span>
        </div>
        <div className="text-xs text-gray-600 mb-2">
          {activityScore.feedback}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">등록된 이벤트</span>
          <span className="font-bold text-gray-900">{activityScore.count}개</span>
        </div>
      </div>
      
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <div className="text-xs text-indigo-900">
          <div className="font-semibold mb-2 flex items-start">
            <span className="mr-1 flex-shrink-0">📈</span>
            <span className="flex-1">성장 TIP</span>
          </div>
          <ul className="space-y-1 text-indigo-800">
            {diversificationScore.score < 75 && (
              <li>• 포트폴리오를 {Math.max(5, diversificationScore.count + 2)}개 이상으로 확대</li>
            )}
            {interestCoverage.percentage < 100 && (
              <li>• 관심 분야에 맞는 종목 추가 검토</li>
            )}
            {activityScore.score < 75 && (
              <li>• 주요 이벤트를 더 추적하여 시장 감각 유지</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalysis;