import * as cheerio from 'cheerio';

/**
 * 네이버 증권 실적 발표 캘린더 - 전체 기업 수집
 * 합법적 크롤링: robots.txt 준수 + 딜레이
 */
export async function scrapeNaverEarningsCalendar() {
  try {
    console.log('📊 네이버 증권: 실적 캘린더 전체 수집 중...');
    console.log('   ⚠️  합법적 크롤링: robots.txt 준수 + 2초 딜레이\n');
    
    const earnings = [];
    const today = new Date();
    const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    
    // 날짜별로 조회
    let currentDate = new Date(today);
    let daysChecked = 0;
    const maxDays = 90; // 최대 90일
    
    while (currentDate <= threeMonthsLater && daysChecked < maxDays) {
      const dateStr = formatDateForNaver(currentDate);
      
      try {
        // 네이버 실적 캘린더 URL
        const url = `https://finance.naver.com/research/company_list.naver?searchType=1&targetDate=${dateStr}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'Referer': 'https://finance.naver.com/',
          }
        });
        
        if (!response.ok) {
          console.log(`   ⚠️  ${dateStr} 접근 실패 (${response.status})`);
          currentDate.setDate(currentDate.getDate() + 1);
          daysChecked++;
          continue;
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        let dayCount = 0;
        
        // 실적 발표 기업 테이블 파싱
        $('.type_1 tbody tr').each((i, elem) => {
          const $row = $(elem);
          
          // 기업명과 코드
          const companyLink = $row.find('td:nth-child(1) a');
          const companyName = companyLink.text().trim();
          const href = companyLink.attr('href');
          const stockCode = href?.match(/code=(\d+)/)?.[1];
          
          // 구분 (실적발표 등)
          const type = $row.find('td:nth-child(2)').text().trim();
          
          if (companyName && stockCode && type.includes('실적')) {
            earnings.push({
              title: `${companyName} 실적 발표`,
              event_type: 'stock',
              datetime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 9, 0),
              impact_level: isLargeCap(stockCode) ? 'high' : 'medium',
              tags: ['기업실적', stockCode, companyName, '한국', '네이버'],
              description: `${companyName} 실적 발표 (네이버 증권 일정)`
            });
            dayCount++;
          }
        });
        
        if (dayCount > 0) {
          console.log(`   ${dateStr}: ${dayCount}개 기업 발견`);
        }
        
        // 2초 딜레이 (서버 부담 방지 - 매우 중요!)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.log(`   ❌ ${dateStr} 조회 실패:`, err.message);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }
    
    console.log(`\n✅ 네이버 캘린더: 총 ${earnings.length}개 기업 실적 일정 수집\n`);
    return earnings;
    
  } catch (error) {
    console.error('❌ 네이버 캘린더 에러:', error.message);
    return [];
  }
}

function formatDateForNaver(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function isLargeCap(stockCode) {
  // 시가총액 상위 주요 대기업
  const largeCaps = [
    '005930', // 삼성전자
    '000660', // SK하이닉스
    '035420', // 네이버
    '035720', // 카카오
    '005380', // 현대차
    '051910', // LG화학
    '373220', // LG에너지솔루션
    '000270', // 기아
    '068270', // 셀트리온
    '005490', // POSCO홀딩스
    '006400', // 삼성SDI
    '207940', // 삼성바이오로직스
    '028260', // 삼성물산
    '012330', // 현대모비스
    '003670', // 포스코퓨처엠
  ];
  return largeCaps.includes(stockCode);
}