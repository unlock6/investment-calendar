/**
 * 뉴스 라우트 — 금융 RSS 피드 실시간 수집
 * 소스별 30분 캐시, 1회 최대 10개 기사
 * 서버 부담 최소화: 요청당 캐시 우선, 만료 시만 fetch
 */
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

// ── 30분 캐시 ──
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function getCached(key) {
  const e = cache.get(key);
  return e && Date.now() < e.expiresAt ? e.data : null;
}
function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// ── RSS 소스 목록 ──
const RSS_SOURCES = [
  {
    id: 'reuters_biz',
    name: 'Reuters',
    icon: '🌐',
    url: 'https://feeds.reuters.com/reuters/businessNews',
    category: 'global',
    lang: 'en',
  },
  {
    id: 'cnbc_economy',
    name: 'CNBC',
    icon: '📺',
    url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html',
    category: 'global',
    lang: 'en',
  },
  {
    id: 'yonhap_eco',
    name: '연합뉴스',
    icon: '🇰🇷',
    url: 'https://www.yna.co.kr/rss/economy.xml',
    category: 'korea',
    lang: 'ko',
  },
  {
    id: 'hankyung',
    name: '한국경제',
    icon: '📰',
    url: 'https://rss.hankyung.com/economy.xml',
    category: 'korea',
    lang: 'ko',
  },
  {
    id: 'mk',
    name: '매일경제',
    icon: '📊',
    url: 'https://www.mk.co.kr/rss/40300001/',
    category: 'korea',
    lang: 'ko',
  },
];

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; InvestCalendar/1.0; RSS Reader)',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
};

// ── 간단한 XML 태그 파서 ──
function extractTag(xml, tag) {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'),
  ];
  for (const re of patterns) {
    const m = xml.match(re);
    if (m) return m[1].trim();
  }
  return '';
}

function extractAllTags(xml, tag) {
  const re = new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, 'gi');
  return xml.match(re) || [];
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#\d+;/g, '').trim();
}

function parseRSS(xml, source) {
  const items = extractAllTags(xml, 'item');
  const results = [];

  for (const item of items.slice(0, 10)) {
    const title   = stripHtml(extractTag(item, 'title'));
    const link    = extractTag(item, 'link') || extractTag(item, 'guid');
    const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date');
    const desc    = stripHtml(
      extractTag(item, 'description') || extractTag(item, 'content:encoded') || ''
    ).slice(0, 150);

    if (!title || title.length < 5) continue;

    // 발행시간 상대 표시
    let timeAgo = '방금';
    if (pubDate) {
      try {
        const ms = Date.now() - new Date(pubDate).getTime();
        const h  = Math.floor(ms / 3600000);
        const m  = Math.floor(ms / 60000);
        if (h >= 24) timeAgo = `${Math.floor(h / 24)}일 전`;
        else if (h >= 1) timeAgo = `${h}시간 전`;
        else if (m >= 1) timeAgo = `${m}분 전`;
      } catch { /* ignore */ }
    }

    results.push({
      id: `${source.id}_${results.length}`,
      source: source.name,
      sourceIcon: source.icon,
      category: source.category,
      lang: source.lang,
      title,
      summary: desc,
      link: link.trim(),
      time: timeAgo,
      pubDate: pubDate || null,
    });
  }

  return results;
}

// ── 단일 소스 fetch ──
async function fetchSource(source) {
  const cached = getCached(source.id);
  if (cached) return cached;

  const res = await fetch(source.url, { headers: FETCH_HEADERS, timeout: 8000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml  = await res.text();
  const news = parseRSS(xml, source);
  setCache(source.id, news);
  return news;
}

/**
 * GET /api/news?category=all|global|korea
 */
router.get('/', async (req, res) => {
  const category = req.query.category || 'all';

  const sources = category === 'all'
    ? RSS_SOURCES
    : RSS_SOURCES.filter(s => s.category === category);

  // 병렬 fetch (실패 소스는 스킵)
  const settled = await Promise.allSettled(sources.map(fetchSource));

  const allNews = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      allNews.push(...r.value);
    } else {
      console.warn(`[news] ${sources[i].name} 실패: ${r.reason?.message}`);
    }
  });

  // pubDate 기준 최신순 정렬
  allNews.sort((a, b) => {
    if (!a.pubDate) return 1;
    if (!b.pubDate) return -1;
    return new Date(b.pubDate) - new Date(a.pubDate);
  });

  res.json({
    success: true,
    articles: allNews,
    total: allNews.length,
    timestamp: new Date().toISOString(),
  });
});

export default router;
