import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DART API - 한국 기업 실적 공시 자동 수집
 * https://opendart.fss.or.kr/
 */
export async function collectDartEarnings() {
  const API_KEY = process.env.DART_API_KEY;
  
  if (!API_KEY) {
    console.log('⚠️  DART API 키가 없습니다');
    return [];
  }
  
  try {
    console.log('📊 DART: 한국 기업 공시 수집 중...');
    
    // 주요 기업 코드 (고유번호)
    const companies = [
      { code: '00126380', name: '삼성전자', stockCode: '005930' },
      { code: '00164779', name: 'SK하이닉스', stockCode: '000660' },
      { code: '00164742', name: '현대차', stockCode: '005380' },
      { code: '00401731', name: 'LG에너지솔루션', stockCode: '373220' },
      { code: '00159584', name: '카카오', stockCode: '035720' },
      { code: '00164590', name: 'POSCO홀딩스', stockCode: '005490' },
      { code: '00164779', name: '기아', stockCode: '000270' }
    ];
    
    const earnings = [];
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 4, 0);
    
    const startDate = formatDate(threeMonthsAgo);
    const endDate = formatDate(threeMonthsLater);
    
    console.log(`   기간: ${startDate} ~ ${endDate}`);
    
    for (const company of companies) {
      try {
        // 공시 검색 API
        const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${API_KEY}&corp_code=${company.code}&bgn_de=${startDate}&end_de=${endDate}&pblntf_ty=A`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === '000' && data.list) {
          // 실적 관련 공시만 필터링
          const earningsReports = data.list.filter(item => 
            item.report_nm && (
              item.report_nm.includes('분기보고서') ||
              item.report_nm.includes('반기보고서') ||
              item.report_nm.includes('사업보고서') ||
              item.report_nm.includes('잠정실적')
            )
          );
          
          if (earningsReports.length > 0) {
            // 가장 최근 실적 발표
            const report = earningsReports[0];
            const reportDate = new Date(
              report.rcept_dt.substring(0, 4),
              parseInt(report.rcept_dt.substring(4, 6)) - 1,
              report.rcept_dt.substring(6, 8)
            );
            
            reportDate.setHours(9, 0, 0, 0); // 오전 9시
            
            earnings.push({
              title: `${company.name} 실적 발표`,
              event_type: 'stock',
              datetime: reportDate,
              impact_level: 'high',
              tags: ['기업실적', company.stockCode, company.name, '한국', 'DART'],
              description: `${company.name} ${report.report_nm} (DART 공시)`
            });
            
            console.log(`   ✅ ${company.name}: ${report.report_nm} (${report.rcept_dt})`);
          }
        } else if (data.status === '013') {
          console.log(`   ⚠️  ${company.name}: 조회된 데이터 없음`);
        }
        
        // API 제한 방지 (1초 딜레이)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        console.log(`   ❌ ${company.name} 에러:`, err.message);
      }
    }
    
    console.log(`✅ ${earnings.length}개 DART 공시 수집 완료\n`);
    return earnings;
    
  } catch (error) {
    console.error('❌ DART 수집 에러:', error.message);
    return [];
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}