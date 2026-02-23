/**
 * 주식 가격 라우트
 * Stooq.com CSV API 사용 (무료, API키 불필요, rate limit 없음)
 * - 미국 주식: aapl.us, nvda.us ...
 * - 한국 주식: 005930.kr, 000660.kr ...
 * - EOD(당일 종가) 기준 데이터
 * - 캐시 30분 (장 중에는 EOD라 자주 바뀌지 않음)
 */
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

// ── 캐시 (30분) ──
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function getCached(key) {
  const e = cache.get(key);
  return e && Date.now() < e.expiresAt ? e.data : null;
}
function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Stooq 심볼 변환 ──
function toStooqSymbol(ticker) {
  if (/^\d{6}$/.test(ticker)) return `${ticker}.kr`;   // 한국 (KRX)
  return `${ticker.toLowerCase()}.us`;                  // 미국 (NYSE/NASDAQ)
}

const NAME_MAP = {
  AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Alphabet', AMZN: 'Amazon',
  TSLA: 'Tesla', NVDA: 'NVIDIA', META: 'Meta', JPM: 'JPMorgan',
  BAC: 'Bank of America', GS: 'Goldman Sachs', JNJ: 'J&J', PFE: 'Pfizer',
  UNH: 'UnitedHealth', XOM: 'ExxonMobil', CVX: 'Chevron',
  NKE: 'Nike', DIS: 'Disney', NFLX: 'Netflix',
  '005930': '삼성전자', '000660': 'SK하이닉스', '035420': 'NAVER',
  '035720': '카카오', '005380': '현대차', '000270': '기아',
  '051910': 'LG화학', '006400': '삼성SDI', '207940': '삼성바이오',
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml,text/csv,*/*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
  'Referer': 'https://stooq.com/',
};

// ── Stooq CSV 파싱 ──
// 응답 형식: Date,Open,High,Low,Close,Volume (최신 날짜 첫 번째)
function parseStooqCsv(csv, ticker) {
  const lines = csv.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('데이터 없음');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const closeIdx = headers.indexOf('close');
  const openIdx  = headers.indexOf('open');
  if (closeIdx === -1) throw new Error('Close 컬럼 없음');

  // 최신 2개 행
  const latest = lines[1].split(',');
  const prev   = lines[2]?.split(',');

  const currentClose = parseFloat(latest[closeIdx]);
  const prevClose    = prev ? parseFloat(prev[closeIdx]) : parseFloat(latest[openIdx]);

  if (isNaN(currentClose)) throw new Error('가격 파싱 실패');

  const change    = parseFloat((currentClose - prevClose).toFixed(2));
  const changePct = parseFloat(((change / prevClose) * 100).toFixed(2));
  const isKorean  = /^\d{6}$/.test(ticker);

  return {
    ticker,
    name: NAME_MAP[ticker] || ticker,
    price: currentClose,
    change,
    changePercent: changePct,
    currency: isKorean ? 'KRW' : 'USD',
    isUp: changePct >= 0,
  };
}

// ── 단일 종목 조회 ──
async function fetchStooq(ticker) {
  const sym = toStooqSymbol(ticker);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&i=d`;

  const res = await fetch(url, { headers: HEADERS, timeout: 8000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();

  // Stooq가 데이터 없을 때 "No data" 반환
  if (text.includes('No data') || text.trim().split('\n').length < 2) {
    throw new Error('데이터 없음');
  }

  return parseStooqCsv(text, ticker);
}

/**
 * GET /api/stocks/prices?tickers=AAPL,NVDA,005930
 */
router.get('/prices', async (req, res) => {
  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: 'tickers 파라미터 필요' });

  const tickerList = tickers.split(',').map(t => t.trim()).filter(Boolean).slice(0, 20);
  if (!tickerList.length) return res.status(400).json({ error: '유효한 티커 없음' });

  const data = {};
  const toFetch = [];

  // 캐시 확인
  for (const ticker of tickerList) {
    const cached = getCached(ticker);
    if (cached) {
      data[ticker] = { ...cached, fromCache: true };
    } else {
      toFetch.push(ticker);
    }
  }

  // 캐시 없는 종목: 순차 조회 (100ms 간격)
  for (let i = 0; i < toFetch.length; i++) {
    const ticker = toFetch[i];
    if (i > 0) await sleep(100);

    try {
      const d = await fetchStooq(ticker);
      data[ticker] = d;
      setCache(ticker, d);
      console.log(`[stocks] ✓ ${ticker} ${'price' in d ? d.price : '-'} (${d.changePercent}%)`);
    } catch (err) {
      console.warn(`[stocks] ✗ ${ticker}: ${err.message}`);
      const stale = cache.get(ticker)?.data;
      data[ticker] = stale
        ? { ...stale, stale: true }
        : {
            ticker,
            name: NAME_MAP[ticker] || ticker,
            price: null, change: null, changePercent: null,
            currency: /^\d{6}$/.test(ticker) ? 'KRW' : 'USD',
            isUp: null,
            error: err.message,
          };
    }
  }

  res.json({
    success: true,
    data,
    cached: tickerList.length - toFetch.length,
    fetched: toFetch.length,
    timestamp: new Date().toISOString(),
    source: 'Stooq',
  });
});

export default router;
