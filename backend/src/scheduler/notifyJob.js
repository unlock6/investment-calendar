import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 알림이 필요한 이벤트 확인 및 처리
 * notify_time이 현재 시간보다 이전인 이벤트를 찾아 알림
 */
async function checkAndNotify() {
  try {
    const now = new Date();

    // notify_time이 현재 시간보다 이전이고, 아직 알림을 보내지 않은 이벤트 조회
    const pendingNotifications = await prisma.userEvent.findMany({
      where: {
        notify_time: {
          lte: now // 현재 시간 이하
        }
      },
      include: {
        event: true
      }
    });

    if (pendingNotifications.length === 0) {
      // 알림 없음 (로그 생략)
      return;
    }

    console.log(`\n📢 [${now.toISOString()}] Checking notifications...`);
    console.log(`   Found ${pendingNotifications.length} pending notification(s)\n`);

    for (const userEvent of pendingNotifications) {
      const event = userEvent.event;
      const timeUntilEvent = event.datetime.getTime() - now.getTime();
      const hoursUntil = Math.round(timeUntilEvent / (1000 * 60 * 60));

      console.log('─────────────────────────────────────────');
      console.log(`🔔 NOTIFICATION for User ${userEvent.user_id}`);
      console.log(`   Event: ${event.title}`);
      console.log(`   Type: ${event.event_type.toUpperCase()}`);
      console.log(`   Impact: ${event.impact_level}`);
      console.log(`   Scheduled: ${event.datetime.toISOString()}`);
      console.log(`   Time until event: ${hoursUntil} hours`);
      console.log(`   Description: ${event.description || 'N/A'}`);
      console.log('─────────────────────────────────────────\n');

      // 실제 서비스에서는 여기서:
      // - 이메일 발송
      // - 푸시 알림
      // - SMS 발송
      // - 웹소켓으로 실시간 알림
      // 등을 처리합니다.

      // 알림을 보낸 후에는 notify_time을 null로 설정하여 중복 알림 방지
      await prisma.userEvent.update({
        where: { id: userEvent.id },
        data: { notify_time: null }
      });

      console.log(`   ✅ Notification processed and marked as sent\n`);
    }
  } catch (error) {
    console.error('❌ Error in notification scheduler:', error);
  }
}

/**
 * 알림 스케줄러 시작
 * 1분마다 실행
 */
export function startNotificationScheduler() {
  console.log('\n⏰ Starting notification scheduler...');
  console.log('   Running every 1 minute');
  console.log('   Checking for events with notify_time <= now\n');

  // Cron 표현식: "분 시 일 월 요일"
  // '* * * * *' = 매 분마다 실행
  cron.schedule('* * * * *', () => {
    checkAndNotify();
  });

  // 서버 시작 시 즉시 한 번 실행
  checkAndNotify();
}

/**
 * 특정 시간 간격으로 실행하는 다른 스케줄러 예시
 */
export function startDailyRecommendationScheduler() {
  // 매일 오전 9시에 실행
  // '0 9 * * *' = 매일 9:00
  cron.schedule('0 9 * * *', async () => {
    console.log('🎯 Running daily recommendation update...');
    
    // 여기서 개인화 서비스 호출
    // await addPersonalizedEventsForUser(userId);
  });
}

export default {
  startNotificationScheduler,
  startDailyRecommendationScheduler,
  checkAndNotify
};
