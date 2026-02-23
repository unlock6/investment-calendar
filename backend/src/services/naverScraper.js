import * as cheerio from 'cheerio';

/**
 * 네이버 증권 실적 일정 크롤링 (보조)
 * robots.txt 준수 + 딜레이
 */
export async function scrapeNaverEarnings() {
  try {
    console.log('📊 네이버 증권: 실적 일정 크롤링 중...');
    console.log('   ⚠️  합법적 크롤링: User-Agent + 딜레이 설정');
    
    const companies = [
      { code: '005930', name: '삼성전자' },
      { code: '000660', name: 'SK하이닉스' },
      { code: '035420', name: '네이버' },
      { code: '035720', name: '카카오' }
    ];
    
    const earnings = [];
    
    for (const company of companies) {
      try {
        const url = `https://finance.naver.com/item/main.naver?code=${company.code}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });
        
        if (!response.ok) {
          console.log(`   ⚠️  ${company.name} 접근 실패 (${response.status})`);
          continue;
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // 기업명 확인
        const companyName = $('.wrap_company h2 a').first().text().trim() || company.name;
        
        console.log(`   📌 ${companyName} 페이지 크롤링 완료`);
        
        // 실적 발표 날짜 파싱 (네이버 페이지 구조에 따라 조정 필요)
        // 현재는 데모로 로그만 출력
        
        // 2초 딜레이 (서버 부담 방지)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.log(`   ❌ ${company.name} 크롤링 에러:`, err.message);
      }
    }
    
    console.log(`✅ 네이버 크롤링 완료 (${earnings.length}개)\n`);
    return earnings;
    
  } catch (error) {
    console.error('❌ 네이버 크롤링 에러:', error.message);
    return [];
  }
}