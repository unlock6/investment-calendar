import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import eventRoutes from './routes/events.js';
import aiRoutes from './routes/ai.js';
import stockRoutes from './routes/stocks.js';
import newsRoutes from './routes/news.js';
import { collectAllData } from './services/dataCollector.js';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// === 미들웨어 ===

// CORS (베타: 전체 허용)
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Body parser (10MB 제한)
app.use(express.json({ limit: '10mb' }));

// 간단한 Rate Limiter (메모리 기반)
const rateLimitStore = new Map();
const rateLimit = (maxRequests = 100, windowMs = 60000) => (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count++;
  rateLimitStore.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
  }

  next();
};

app.use('/api', rateLimit(200, 60000));    // API: 분당 200회
app.use('/api/ai', rateLimit(20, 60000));  // AI: 분당 20회

// 요청 로깅
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.log(`⚠️  느린 요청: ${req.method} ${req.path} (${duration}ms)`);
    }
  });
  next();
});

// === 라우트 ===
app.use('/api', eventRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/news', newsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

/**
 * 이벤트 자동 업데이트 체크
 */
async function checkAndUpdateEvents() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 미래 이벤트 개수 확인
    const futureEvents = await prisma.event.count({
      where: {
        datetime: { gte: today }
      }
    });
    
    console.log(`📊 미래 이벤트: ${futureEvents}개`);
    
    // 5개 미만이면 재시딩
    if (futureEvents < 5) {
      console.log('⚠️  미래 이벤트 부족! 자동 재시딩 시작...');
      
      try {
        const { stdout, stderr } = await execAsync('node seed.js');
        console.log('✅ 자동 재시딩 완료');
        if (stdout) console.log(stdout);
      } catch (error) {
        console.error('❌ 자동 재시딩 실패:', error.message);
      }
    } else {
      console.log('✅ 미래 이벤트 충분');
    }
  } catch (error) {
    console.error('❌ 이벤트 체크 에러:', error);
  }
}

/**
 * 알림 체크 및 전송
 */
async function checkNotifications() {
  try {
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);
    
    // 5분 이내 알림 예정인 이벤트
    const pendingNotifications = await prisma.userEvent.findMany({
      where: {
        notify_time: {
          gte: now,
          lte: fiveMinutesLater
        },
        completed: false
      },
      include: {
        event: true
      }
    });
    
    if (pendingNotifications.length > 0) {
      console.log(`🔔 ${pendingNotifications.length}개 알림 예정`);
      // 실제 알림은 프론트엔드에서 처리
    }
  } catch (error) {
    console.error('❌ 알림 체크 에러:', error);
  }
}

// 🆕 매일 자정 자동 이벤트 업데이트
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 일일 이벤트 자동 업데이트...');
  await checkAndUpdateEvents();
});

// 🆕 5분마다 알림 체크
cron.schedule('*/5 * * * *', async () => {
  await checkNotifications();
});

// 🆕 매일 오전 6시 자동 데이터 수집
cron.schedule('0 6 * * *', async () => {
  console.log('🔄 일일 데이터 자동 수집...');
  try {
    await collectAllData();
  } catch (error) {
    console.error('❌ 자동 수집 실패:', error);
  }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📅 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - GET  /api/events`);
  console.log(`   - GET  /api/user-events`);
  console.log(`   - POST /api/user-events`);
  console.log(`   - DELETE /api/user-events/:id`);
  console.log(`   - GET  /api/events/range`);
  console.log(`   - GET  /api/events/upcoming`);
  console.log(`   - POST /api/ai/chat`);
  console.log(`   - GET  /health`);
  
  // 🆕 서버 시작 시 한 번 수집
  console.log('\n🔄 초기 데이터 수집 시작...');
  try {
    await collectAllData();
  } catch (error) {
    console.error('❌ 초기 수집 실패:', error);
  }
  
  console.log('⏰ 스케줄러 시작:');
  console.log('   - 매일 자정: 이벤트 자동 업데이트');
  console.log('   - 매일 오전 6시: 외부 데이터 수집');
  console.log('   - 5분마다: 알림 체크\n');
});

export default app;
