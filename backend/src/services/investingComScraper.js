import * as cheerio from 'cheerio';

/**
 * Investing.com 실적 캘린더 수집
 * 글로벌 기업 실적 일정
 */
export async function scrapeInvestingCalendar() {
  try {
    console.log('📊 Investing.com: 글로벌 실적 캘린더 수집 중...');
    console.log('   ⚠️  합법적 크롤링: User-Agent + 딜레이\n');
    
    const earnings = [];
    
    // Investing.com 실적 캘린더
    const url = 'https://kr.investing.com/earnings-calendar/';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': 'https://kr.investing.com/',
      }
    });
    
    if (!response.ok) {
      console.log(`   ⚠️  접근 실패 (${response.status})`);
      return [];
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 실적 발표 테이블 파싱
    $('#earningsCalendarData tr, .earnCalCompanyTableRow').each((i, elem) => {
      const $row = $(elem);
      
      // 기업명
      const companyName = $row.find('.earnCalCompanyName, .left.bold').text().trim();
      
      // 날짜
      const dateStr = $row.find('td:first-child, .first.left').text().trim();
      
      // EPS
      const eps = $row.find('.earnCalEps, .right').text().trim();
      
      if (companyName && dateStr && !dateStr.includes('날짜')) {
        try {
          // 날짜 파싱
          const date = parseDateString(dateStr);
          
          if (date && date > new Date()) {
            earnings.push({
              title: `${companyName} 실적 발표`,
              event_type: 'stock',
              datetime: date,
              impact_level: 'medium',
              tags: ['기업실적', companyName, 'Investing.com'],
              description: `${companyName} 실적 발표${eps ? ` (예상 EPS: ${eps})` : ''}`
            });
          }
        } catch (err) {
          // 파싱 실패 무시
        }
      }
    });
    
    console.log(`✅ Investing.com: ${earnings.length}개 기업 수집\n`);
    return earnings;
    
  } catch (error) {
    console.error('❌ Investing.com 에러:', error.message);
    return [];
  }
}

function parseDateString(dateStr) {
  try {
    // 여러 날짜 형식 시도
    // "2026-04-08", "04/08/2026", "2026.04.08" 등
    
    // ISO 형식
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 9, 0);
    }
    
    // MM/DD/YYYY 형식
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [month, day, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 9, 0);
    }
    
    // YYYY.MM.DD 형식
    if (dateStr.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
      const [year, month, day] = dateStr.split('.');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 9, 0);
    }
    
    return null;
  } catch {
    return null;
  }
}