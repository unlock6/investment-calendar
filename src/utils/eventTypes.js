/**
 * 이벤트 타입 설정 - 참조 컴포넌트의 풍부한 색상/아이콘/카테고리 시스템
 *
 * 각 이벤트 타입별로 색상, 배경색, 아이콘 이모지, 카테고리를 정의
 */

export const EVENT_TYPES = {
  // 거시경제
  fomc: {
    label: 'FOMC',
    category: 'macro',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    icon: '🏛️',
    description: '연방공개시장위원회 금리 결정'
  },
  cpi: {
    label: 'CPI',
    category: 'macro',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    icon: '📊',
    description: '소비자물가지수 발표'
  },
  gdp: {
    label: 'GDP',
    category: 'macro',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    icon: '📈',
    description: 'GDP 성장률 발표'
  },
  employment: {
    label: '고용지표',
    category: 'macro',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    icon: '👥',
    description: '비농업 고용/실업률'
  },
  pmi: {
    label: 'PMI',
    category: 'macro',
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
    icon: '🏭',
    description: '구매관리자지수'
  },
  trade: {
    label: '무역수지',
    category: 'macro',
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    icon: '🚢',
    description: '무역수지/경상수지'
  },
  bok: {
    label: '한국은행',
    category: 'macro',
    color: '#1d4ed8',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    icon: '🇰🇷',
    description: '한국은행 금리 결정'
  },

  // 기업/주식
  earnings: {
    label: '실적발표',
    category: 'stock',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    icon: '💰',
    description: '분기 실적 발표'
  },
  dividend: {
    label: '배당',
    category: 'stock',
    color: '#ca8a04',
    bgColor: '#fefce8',
    borderColor: '#fef08a',
    icon: '💵',
    description: '배당금 지급/발표'
  },
  ipo: {
    label: 'IPO',
    category: 'stock',
    color: '#e11d48',
    bgColor: '#fff1f2',
    borderColor: '#fecdd3',
    icon: '🎯',
    description: '기업 공개/상장'
  },
  split: {
    label: '액면분할',
    category: 'stock',
    color: '#9333ea',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff',
    icon: '✂️',
    description: '주식 분할'
  },

  // 기본 타입 (레거시 호환)
  macro: {
    label: '거시경제',
    category: 'macro',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    icon: '📊',
    description: '거시경제 이벤트'
  },
  stock: {
    label: '기업',
    category: 'stock',
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    icon: '📈',
    description: '기업 이벤트'
  },
  crypto: {
    label: '암호화폐',
    category: 'crypto',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    icon: '₿',
    description: '암호화폐 이벤트'
  },
  custom: {
    label: '커스텀',
    category: 'custom',
    color: '#6366f1',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
    icon: '📌',
    description: '사용자 정의 이벤트'
  }
};

/**
 * 이벤트 타입으로 설정 조회
 */
export function getEventTypeConfig(eventType) {
  return EVENT_TYPES[eventType] || EVENT_TYPES.macro;
}

/**
 * 카테고리별 이벤트 타입 목록
 */
export function getEventTypesByCategory(category) {
  return Object.entries(EVENT_TYPES)
    .filter(([, config]) => config.category === category)
    .map(([key, config]) => ({ id: key, ...config }));
}

/**
 * 영향도 설정
 */
export const IMPACT_LEVELS = {
  high: {
    label: '높음',
    description: '주가 큰 변동 가능',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    emoji: '🔴'
  },
  medium: {
    label: '중간',
    description: '주의 관찰 필요',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    emoji: '🟡'
  },
  low: {
    label: '낮음',
    description: '참고 수준',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    emoji: '🟢'
  }
};

/**
 * D-Day 계산
 */
export function calculateDDay(datetime) {
  const now = new Date();
  const eventDate = new Date(datetime);
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: 'D-Day', isPast: false, isToday: true };
  if (diffDays > 0) return { text: `D-${diffDays}`, isPast: false, isToday: false };
  return { text: `D+${Math.abs(diffDays)}`, isPast: true, isToday: false };
}

/**
 * 필터 옵션
 */
export const FILTER_OPTIONS = [
  { id: 'all', label: '전체', icon: '🌐' },
  { id: 'macro', label: '거시경제', icon: '📊' },
  { id: 'stock', label: '기업', icon: '📈' },
  { id: 'crypto', label: '암호화폐', icon: '₿' },
  { id: 'custom', label: '커스텀', icon: '📌' }
];
