/**
 * 더미 이벤트 데이터
 * 
 * 나중에 백엔드 API에서 받아올 데이터 구조입니다.
 * 각 이벤트는 다음 필드를 가집니다:
 * - id: 고유 식별자
 * - title: 이벤트 제목
 * - date: 날짜 (YYYY-MM-DD 형식)
 * - type: 'macro', 'stock', 'crypto' 중 하나
 * - impact_level: 'high', 'medium', 'low' 중 하나
 * - description: 이벤트 설명
 */

export const mockEvents = [
  // Macro 이벤트 (빨강)
  {
    id: '1',
    title: 'Fed 금리 결정',
    date: '2026-02-18',
    type: 'macro',
    impact_level: 'high',
    description: '연방준비제도 금리 결정 발표일입니다. 시장에 큰 영향을 미칠 수 있습니다.'
  },
  {
    id: '2',
    title: 'CPI 발표',
    date: '2026-02-12',
    type: 'macro',
    impact_level: 'high',
    description: '소비자물가지수(CPI) 발표. 인플레이션 지표로 활용됩니다.'
  },
  {
    id: '3',
    title: '고용 지표 발표',
    date: '2026-02-06',
    type: 'macro',
    impact_level: 'medium',
    description: '비농업 고용지표(NFP) 발표일입니다.'
  },

  // Stock 이벤트 (파랑)
  {
    id: '4',
    title: 'Apple 실적 발표',
    date: '2026-02-01',
    type: 'stock',
    impact_level: 'high',
    description: 'Apple의 분기 실적 발표일입니다.'
  },
  {
    id: '5',
    title: 'Tesla 주주총회',
    date: '2026-02-15',
    type: 'stock',
    impact_level: 'medium',
    description: 'Tesla의 정기 주주총회가 열립니다.'
  },
  {
    id: '6',
    title: 'Microsoft 배당락일',
    date: '2026-02-20',
    type: 'stock',
    impact_level: 'low',
    description: 'Microsoft의 배당락일입니다.'
  },
  {
    id: '7',
    title: 'NVIDIA 신제품 발표',
    date: '2026-02-25',
    type: 'stock',
    impact_level: 'high',
    description: 'NVIDIA의 새로운 GPU 라인업 발표 예정입니다.'
  },

  // Crypto 이벤트 (보라)
  {
    id: '8',
    title: 'Bitcoin 반감기',
    date: '2026-02-10',
    type: 'crypto',
    impact_level: 'high',
    description: 'Bitcoin의 채굴 보상이 반으로 줄어드는 날입니다.'
  },
  {
    id: '9',
    title: 'Ethereum 업그레이드',
    date: '2026-02-14',
    type: 'crypto',
    impact_level: 'medium',
    description: 'Ethereum 네트워크 주요 업그레이드가 진행됩니다.'
  },
  {
    id: '10',
    title: 'SEC 암호화폐 규제 발표',
    date: '2026-02-28',
    type: 'crypto',
    impact_level: 'high',
    description: '미국 증권거래위원회의 새로운 암호화폐 규제안 발표 예정입니다.'
  }
];
