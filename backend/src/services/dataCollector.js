import { PrismaClient } from '@prisma/client';
import { collectDartEarnings } from './dartCollector.js';
import { scrapeNaverEarningsCalendar } from './naverEarningsCalendar.js';
import { scrapeInvestingCalendar } from './investingComScraper.js';
import { predictKoreanEarnings } from './earningspredictor.js';

const prisma = new PrismaClient();

/**
 * Alpha Vantage - 미국 기업 실적 발표
 */
async function collectEarnings() {
  const API_KEY = process.env.ALPHA_VANTAGE_KEY;
  
  if (!API_KEY || API_KEY === 'demo') {
    console.log('⚠️  Alpha Vantage API 키가 없습니다');
    return [];
  }
  
  try {
    console.log('📊 Alpha Vantage: 미국 기업 실적 발표 수집 중...');
    
    const url = `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const csvText = await response.text();
    
    if (csvText.includes('Invalid API call') || csvText.includes('rate limit')) {
      console.log('⚠️  Alpha Vantage API 제한');
      return [];
    }
    
    const lines = csvText.split('\n');
    const earnings = [];
    
    const importantStocks = [
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 
      'META', 'NFLX', 'AMD', 'INTC', 'ORCL', 'CSCO', 'ADBE',
      'CRM', 'QCOM', 'TXN', 'AVGO', 'NOW', 'PLTR'
    ];
    
    for (let i = 1; i < lines.length && earnings.length < 50; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',');
      if (cols.length < 3) continue;
      
      const symbol = cols[0]?.replace(/"/g, '').trim();
      const name = cols[1]?.replace(/"/g, '').trim();
      const reportDate = cols[2]?.replace(/"/g, '').trim();
      
      if (!symbol || !reportDate || reportDate === 'reportDate') continue;
      if (!importantStocks.includes(symbol)) continue;
      
      const date = new Date(reportDate);
      if (isNaN(date.getTime())) continue;
      
      date.setHours(21, 0, 0, 0);
      
      earnings.push({
        title: `${name || symbol} 실적 발표`,
        event_type: 'stock',
        datetime: date,
        impact_level: 'high',
        tags: ['기업실적', symbol, name || '', '미국'],
        description: `${name || symbol} 분기 실적 발표`
      });
    }
    
    console.log(`✅ ${earnings.length}개 미국 기업 실적 발표 수집\n`);
    return earnings;
    
  } catch (error) {
    console.error('❌ Alpha Vantage 에러:', error.message);
    return [];
  }
}

/**
 * FRED & 한국은행 - 경제 지표
 */
async function collectEconomicIndicators() {
  return [
    {
      title: 'CPI 발표 (소비자물가)',
      event_type: 'macro',
      datetime: new Date('2026-03-12T13:30:00Z'),
      impact_level: 'high',
      tags: ['인플레이션', 'CPI', '물가', '미국'],
      description: '미국 2월 소비자물가지수 발표'
    },
    {
      title: 'NFP 고용지표',
      event_type: 'macro',
      datetime: new Date('2026-03-06T13:30:00Z'),
      impact_level: 'high',
      tags: ['고용', 'NFP', '실업률', '미국'],
      description: '미국 2월 비농업 고용 지표'
    },
    {
      title: 'CPI 발표 (소비자물가)',
      event_type: 'macro',
      datetime: new Date('2026-04-10T12:30:00Z'),
      impact_level: 'high',
      tags: ['인플레이션', 'CPI', '물가', '미국'],
      description: '미국 3월 소비자물가지수 발표'
    }
  ];
}

async function collectKoreanEconomicData() {
  return [
    {
      title: '한국 GDP 발표',
      event_type: 'macro',
      datetime: new Date('2026-04-23T00:00:00Z'),
      impact_level: 'high',
      tags: ['GDP', '경제성장', '한국'],
      description: '한국 2026년 1분기 GDP'
    }
  ];
}

async function collectFedSchedule() {
  return [
    {
      title: 'FOMC 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-03-19T18:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준', '미국'],
      description: 'FOMC 금리 결정 및 파월 의장 기자회견'
    },
    {
      title: 'FOMC 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-04-30T18:00:00Z'),
      impact_level: 'high',
      tags: ['금리', 'FOMC', '연준', '미국'],
      description: 'FOMC 금리 결정'
    }
  ];
}

async function collectBokSchedule() {
  return [
    {
      title: '한국 금리 결정',
      event_type: 'macro',
      datetime: new Date('2026-04-10T01:00:00Z'),
      impact_level: 'high',
      tags: ['금리', '한국은행', '금통위', '한국'],
      description: '한국은행 기준금리 결정'
    }
  ];
}

/**
 * 🎯 전체 데이터 수집 (통합)
 */
export async function collectAllData() {
  console.log('\n🔄 전체 기업 데이터 자동 수집 시작...\n');
  console.log('🔑 API 키 상태:');
  console.log(`   Alpha Vantage: ${process.env.ALPHA_VANTAGE_KEY ? '✅' : '❌'}`);
  console.log(`   FRED: ${process.env.FRED_API_KEY ? '✅' : '❌'}`);
  console.log(`   한국은행: ${process.env.BOK_API_KEY ? '✅' : '❌'}`);
  console.log(`   DART: ${process.env.DART_API_KEY ? '✅' : '❌'}\n`);
  
  try {
    // 미국 기업
    const usEarnings = await collectEarnings();
    
    // 한국 기업 (다중 소스)
    const dartEarnings = await collectDartEarnings();
    const naverCalendar = await scrapeNaverEarningsCalendar(); // 🆕 전체 기업!
    const investingData = await scrapeInvestingCalendar();
    const predictions = predictKoreanEarnings(); // 🆕 예측 (구분됨)
    
    // 경제 지표
    const indicators = await collectEconomicIndicators();
    const koreanEconomic = await collectKoreanEconomicData();
    const fedSchedule = await collectFedSchedule();
    const bokSchedule = await collectBokSchedule();
    
    const allEvents = [
      ...usEarnings,
      ...dartEarnings,
      ...naverCalendar,      // 🆕 전체 한국 기업!
      ...investingData,
      ...predictions,        // 🆕 예측 (명확히 표시)
      ...indicators,
      ...koreanEconomic,
      ...fedSchedule,
      ...bokSchedule
    ];
    
    console.log(`\n📊 총 ${allEvents.length}개 이벤트 수집 완료`);
    console.log(`   - 미국 기업 (Alpha): ${usEarnings.length}개`);
    console.log(`   - 한국 DART: ${dartEarnings.length}개`);
    console.log(`   - 네이버 캘린더 (전체): ${naverCalendar.length}개 ⭐`);
    console.log(`   - Investing.com: ${investingData.length}개`);
    console.log(`   - 패턴 예측 (예상): ${predictions.length}개`);
    console.log(`   - 경제 지표: ${indicators.length + koreanEconomic.length}개`);
    console.log(`   - 금리 결정: ${fedSchedule.length + bokSchedule.length}개`);
    
    // 중복 제거 + DB 저장
    let newCount = 0;
    let duplicateCount = 0;
    
    for (const event of allEvents) {
      const startOfDay = new Date(event.datetime);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(event.datetime);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existing = await prisma.event.findFirst({
        where: {
          title: event.title,
          datetime: { gte: startOfDay, lte: endOfDay }
        }
      });
      
      if (!existing) {
        await prisma.event.create({ data: event });
        newCount++;
      } else {
        duplicateCount++;
      }
    }
    
    console.log(`\n✅ ${newCount}개 새 이벤트 추가`);
    console.log(`⏭️  ${duplicateCount}개 중복 제외\n`);
    
    return { total: allEvents.length, new: newCount, duplicate: duplicateCount };
    
  } catch (error) {
    console.error('❌ 데이터 수집 에러:', error);
    return { total: 0, new: 0, error: error.message };
  }
}