/**
 * 패턴 기반 실적 발표 예측
 * 과거 데이터 기반 예상 일정 (명확히 표시!)
 */
export function predictKoreanEarnings() {
  console.log('📊 패턴 예측: 한국 주요 기업 실적 일정 생성 중...');
  console.log('   ⚠️  예측 데이터: 과거 패턴 기반 (변동 가능)\n');
  
  const predictions = [];
  const currentYear = new Date().getFullYear();
  
  // 분기별 패턴
  const quarters = [
    { 
      name: '1분기',
      month: 4,  // 4월
      companies: [
        { name: '삼성전자', code: '005930', week: 1, day: 3, impact: 'high' },      // 첫째주 수요일
        { name: 'SK하이닉스', code: '000660', week: 3, day: 4, impact: 'high' },    // 셋째주 목요일
        { name: '현대차', code: '005380', week: 3, day: 5, impact: 'high' },        // 셋째주 금요일
        { name: 'LG에너지솔루션', code: '373220', week: 3, day: 3, impact: 'high' },
        { name: '네이버', code: '035420', week: 4, day: 4, impact: 'medium' },
        { name: '카카오', code: '035720', week: 4, day: 5, impact: 'medium' },
        { name: 'POSCO홀딩스', code: '005490', week: 4, day: 4, impact: 'medium' },
        { name: '기아', code: '000270', week: 3, day: 4, impact: 'medium' },
        { name: '셀트리온', code: '068270', week: 4, day: 3, impact: 'medium' }
      ]
    },
    { 
      name: '2분기',
      month: 7,
      companies: [
        { name: '삼성전자', code: '005930', week: 1, day: 3, impact: 'high' },
        { name: 'SK하이닉스', code: '000660', week: 3, day: 4, impact: 'high' },
        { name: '현대차', code: '005380', week: 3, day: 5, impact: 'high' },
        { name: 'LG에너지솔루션', code: '373220', week: 3, day: 3, impact: 'high' },
        { name: '네이버', code: '035420', week: 4, day: 4, impact: 'medium' },
        { name: '카카오', code: '035720', week: 4, day: 5, impact: 'medium' },
      ]
    },
    { 
      name: '3분기',
      month: 10,
      companies: [
        { name: '삼성전자', code: '005930', week: 1, day: 3, impact: 'high' },
        { name: 'SK하이닉스', code: '000660', week: 3, day: 4, impact: 'high' },
        { name: '현대차', code: '005380', week: 3, day: 5, impact: 'high' },
        { name: 'LG에너지솔루션', code: '373220', week: 3, day: 3, impact: 'high' },
        { name: '네이버', code: '035420', week: 4, day: 4, impact: 'medium' },
        { name: '카카오', code: '035720', week: 4, day: 5, impact: 'medium' },
      ]
    }
  ];
  
  for (const quarter of quarters) {
    for (const company of quarter.companies) {
      const date = getNthWeekday(currentYear, quarter.month, company.week, company.day);
      
      // 과거 날짜는 건너뛰기
      if (date < new Date()) continue;
      
      predictions.push({
        title: `${company.name} 실적 발표 (예상)`, // 🔧 (예상) 명시!
        event_type: 'stock',
        datetime: date,
        impact_level: company.impact,
        tags: ['기업실적', company.code, company.name, '한국', '예상'], // 🔧 '예상' 태그
        description: `${company.name} ${quarter.name} 실적 발표 예상일 (과거 패턴 기반, 정확하지 않을 수 있음)` // 🔧 명확한 설명
      });
      
      console.log(`   📅 ${company.name}: ${date.toLocaleDateString('ko-KR')} (예상)`);
    }
  }
  
  console.log(`\n✅ ${predictions.length}개 예측 일정 생성 (예상 표시)\n`);
  return predictions;
}

/**
 * N번째 주의 특정 요일 계산
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @param {number} weekNumber - 주차 (1-5)
 * @param {number} dayOfWeek - 요일 (1=월요일, 5=금요일)
 */
function getNthWeekday(year, month, weekNumber, dayOfWeek) {
  const firstDay = new Date(year, month - 1, 1);
  const firstWeekday = firstDay.getDay(); // 0=일요일, 1=월요일, ...
  
  // 첫 번째 목표 요일 찾기
  let daysToAdd = dayOfWeek - firstWeekday;
  if (daysToAdd < 0) daysToAdd += 7;
  
  // N번째 주 계산
  const targetDate = 1 + daysToAdd + (weekNumber - 1) * 7;
  
  return new Date(year, month - 1, targetDate, 9, 0, 0);
}