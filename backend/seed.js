import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기존 이벤트 삭제
  await prisma.event.deleteMany({});
  
  console.log('🌱 실제 이벤트 시딩 시작...');
  console.log('📅 데이터 출처: Investing.com 경제 달력');
  console.log('📅 기준일: 2026년 2월 21일\n');
  
  const events = [
    // 이번 주 (2월 21-28일)
    {
      title: '미시간대 소비자심리지수 발표',
      event_type: 'macro',
      datetime: new Date('2026-02-21T00:00:00Z'),
      impact_level: 'medium',
      tags: ['소비자심리', '미시간대'],
      description: '미국 소비자들의 경제 전망 심리 지표'
    },
    {
      title: '한국 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-02-26T10:00:00+09:00'),
      impact_level: 'high',
      tags: ['금리', '한국은행', 'KRW'],
      description: '한국은행 기준금리 결정 발표 (현재 2.50%)'
    },
    {
      title: 'PPI 생산자물가지수 발표',
      event_type: 'macro',
      datetime: new Date('2026-02-27T22:30:00Z'),
      impact_level: 'high',
      tags: ['인플레이션', 'PPI', '생산자물가'],
      description: '미국 생산자물가지수. 소비자물가 선행지표'
    },
    
    // 3월 첫째 주
    {
      title: 'ISM 제조업 구매관리자지수',
      event_type: 'macro',
      datetime: new Date('2026-03-03T00:00:00Z'),
      impact_level: 'high',
      tags: ['제조업', 'ISM', 'PMI'],
      description: '미국 제조업 경기 지표. 50 이상이면 확장'
    },
    {
      title: 'ADP 비농업부문 고용변화',
      event_type: 'macro',
      datetime: new Date('2026-03-04T22:15:00Z'),
      impact_level: 'medium',
      tags: ['고용', 'ADP'],
      description: 'NFP 선행지표. 민간 부문 고용 변화'
    },
    {
      title: 'ISM 비제조업(서비스업) 구매관리자지수',
      event_type: 'macro',
      datetime: new Date('2026-03-05T00:00:00Z'),
      impact_level: 'high',
      tags: ['서비스업', 'ISM', 'PMI'],
      description: '미국 서비스업 경기 지표'
    },
    {
      title: 'NFP 비농업고용지수',
      event_type: 'macro',
      datetime: new Date('2026-03-06T22:30:00Z'),
      impact_level: 'high',
      tags: ['고용', 'NFP', '실업률', '비농업'],
      description: '미국 고용시장 지표. 가장 중요한 경제 지표 중 하나. 예상: +130K'
    },
    {
      title: '한국 소비자물가지수 (CPI)',
      event_type: 'macro',
      datetime: new Date('2026-03-06T08:00:00+09:00'),
      impact_level: 'medium',
      tags: ['인플레이션', 'CPI', '한국', 'KRW'],
      description: '한국 소비자물가 상승률. 예상: 2.0%'
    },
    
    // 3월 둘째 주
    {
      title: '한국 GDP 성장률',
      event_type: 'macro',
      datetime: new Date('2026-03-10T08:00:00+09:00'),
      impact_level: 'high',
      tags: ['GDP', '경제성장', '한국', 'KRW'],
      description: '한국 1분기 GDP 성장률. 전분기 대비 예상: +1.2%'
    },
    {
      title: 'CPI 소비자물가지수',
      event_type: 'macro',
      datetime: new Date('2026-03-11T21:30:00Z'),
      impact_level: 'high',
      tags: ['인플레이션', 'CPI', '소비자물가'],
      description: '미국 소비자물가지수 발표. 연준 금리 정책의 핵심 지표. 전월 대비 예상: +0.2%'
    },
    {
      title: '연방재정수지',
      event_type: 'macro',
      datetime: new Date('2026-03-12T03:00:00Z'),
      impact_level: 'low',
      tags: ['재정', '적자'],
      description: '미국 2월 재정수지. 예상: -950억 달러'
    },
    
    // 3월 셋째 주 - Fed 금리 결정 (가장 중요!)
    {
      title: 'FOMC 연방공개시장위원회 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-03-19T03:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준', 'Fed', '기준금리'],
      description: 'Fed 기준금리 결정 발표 및 파월 의장 기자회견. 현재 금리: 3.75%. 시장 영향 극대'
    },
    
    // 향후 금리 결정 일정
    {
      title: 'FOMC 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-04-30T03:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준'],
      description: 'Fed 4월 금리 결정 회의'
    },
    {
      title: 'FOMC 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-06-18T03:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준'],
      description: 'Fed 6월 금리 결정 회의'
    },
    {
      title: 'FOMC 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-07-30T03:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준'],
      description: 'Fed 7월 금리 결정 회의'
    },
    {
      title: 'FOMC 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-09-17T03:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준'],
      description: 'Fed 9월 금리 결정 회의'
    },
    {
      title: 'FOMC 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-10-29T03:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준'],
      description: 'Fed 10월 금리 결정 회의'
    },
    {
      title: 'FOMC 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-12-10T04:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준'],
      description: 'Fed 12월 금리 결정 회의'
    }
  ];

  console.log(`📊 생성할 이벤트: ${events.length}개\n`);

  for (const event of events) {
    await prisma.event.create({
      data: event
    });
  }

  console.log(`✅ ${events.length}개 실제 이벤트가 생성되었습니다!\n`);
  
  // 미리보기
  console.log('📅 주요 이벤트 미리보기:\n');
  const preview = events.filter(e => 
    e.impact_level === 'high' && 
    new Date(e.datetime) < new Date('2026-04-01')
  );
  
  preview.forEach(e => {
    const date = new Date(e.datetime);
    console.log(`  🔴 ${e.title}`);
    console.log(`     ${date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })}\n`);
  });
  
  console.log('💡 이제 캘린더에 실제 경제 일정이 표시됩니다!');
  console.log('💡 향후 자동화: Alpha Vantage API + 크롤링 + AI 보조');
}

main()
  .catch((e) => {
    console.error('❌ 시딩 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });