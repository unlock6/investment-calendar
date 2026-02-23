import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * user_id = 1에게 자동으로 추천 이벤트를 추가하는 샘플 함수
 * 실제로는 사용자 관심사, 포트폴리오 등을 분석하여 개인화된 이벤트를 추천
 */
export async function addPersonalizedEventsForUser(userId = 1) {
  try {
    console.log(`🎯 Adding personalized events for user ${userId}...`);

    // 1. 모든 'high' impact 이벤트 조회
    const highImpactEvents = await prisma.event.findMany({
      where: {
        impact_level: 'high'
      }
    });

    // 2. 이미 추가된 이벤트 확인
    const existingUserEvents = await prisma.userEvent.findMany({
      where: { user_id: userId },
      select: { event_id: true }
    });

    const existingEventIds = new Set(existingUserEvents.map(ue => ue.event_id));

    // 3. 아직 추가되지 않은 high impact 이벤트만 자동 추가
    let addedCount = 0;
    for (const event of highImpactEvents) {
      if (!existingEventIds.has(event.id)) {
        // 이벤트 1시간 전에 알림 설정
        const notifyTime = new Date(event.datetime);
        notifyTime.setHours(notifyTime.getHours() - 1);

        await prisma.userEvent.create({
          data: {
            user_id: userId,
            event_id: event.id,
            notify_time: notifyTime
          }
        });

        addedCount++;
        console.log(`  ✓ Added: ${event.title} (${event.event_type})`);
      }
    }

    console.log(`✅ Added ${addedCount} personalized events for user ${userId}`);
    return addedCount;
  } catch (error) {
    console.error('Error adding personalized events:', error);
    throw error;
  }
}

/**
 * 샘플 이벤트 데이터 생성 (DB가 비어있을 때 사용)
 */
export async function seedSampleEvents() {
  try {
    console.log('🌱 Seeding sample events...');

    const sampleEvents = [
      {
        title: 'Fed 금리 결정',
        event_type: 'macro',
        datetime: new Date('2026-02-18T14:00:00Z'),
        impact_level: 'high',
        description: '연방준비제도 금리 결정 발표일입니다. 시장에 큰 영향을 미칠 수 있습니다.',
        tags: { category: 'monetary_policy', region: 'US' }
      },
      {
        title: 'CPI 발표',
        event_type: 'macro',
        datetime: new Date('2026-02-12T08:30:00Z'),
        impact_level: 'high',
        description: '소비자물가지수(CPI) 발표. 인플레이션 지표로 활용됩니다.',
        tags: { category: 'economic_indicator', region: 'US' }
      },
      {
        title: 'Apple 실적 발표',
        event_type: 'stock',
        datetime: new Date('2026-02-01T16:30:00Z'),
        impact_level: 'high',
        description: 'Apple의 분기 실적 발표일입니다.',
        tags: { ticker: 'AAPL', sector: 'technology' }
      },
      {
        title: 'Tesla 주주총회',
        event_type: 'stock',
        datetime: new Date('2026-02-15T10:00:00Z'),
        impact_level: 'medium',
        description: 'Tesla의 정기 주주총회가 열립니다.',
        tags: { ticker: 'TSLA', sector: 'automotive' }
      },
      {
        title: 'Bitcoin 반감기',
        event_type: 'crypto',
        datetime: new Date('2026-02-10T00:00:00Z'),
        impact_level: 'high',
        description: 'Bitcoin의 채굴 보상이 반으로 줄어드는 날입니다.',
        tags: { coin: 'BTC', event_type: 'halving' }
      },
      {
        title: 'Ethereum 업그레이드',
        event_type: 'crypto',
        datetime: new Date('2026-02-14T12:00:00Z'),
        impact_level: 'medium',
        description: 'Ethereum 네트워크 주요 업그레이드가 진행됩니다.',
        tags: { coin: 'ETH', event_type: 'upgrade' }
      },
      {
        title: 'NVIDIA 신제품 발표',
        event_type: 'stock',
        datetime: new Date('2026-02-25T18:00:00Z'),
        impact_level: 'high',
        description: 'NVIDIA의 새로운 GPU 라인업 발표 예정입니다.',
        tags: { ticker: 'NVDA', sector: 'technology' }
      }
    ];

    // 기존 이벤트 개수 확인
    const existingCount = await prisma.event.count();
    
    if (existingCount > 0) {
      console.log(`⚠️  Database already has ${existingCount} events. Skipping seed.`);
      return;
    }

    // 샘플 이벤트 생성
    for (const eventData of sampleEvents) {
      await prisma.event.create({
        data: eventData
      });
    }

    console.log(`✅ Created ${sampleEvents.length} sample events`);
  } catch (error) {
    console.error('Error seeding events:', error);
    throw error;
  }
}

/**
 * 메인 실행 함수 (직접 실행 시)
 */
async function main() {
  try {
    // 1. 샘플 이벤트 생성
    await seedSampleEvents();

    // 2. user_id = 1에게 개인화된 이벤트 추가
    await addPersonalizedEventsForUser(1);

    console.log('🎉 Personalization complete!');
  } catch (error) {
    console.error('Error in personalization service:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 직접 실행 시 (npm run db:seed)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  addPersonalizedEventsForUser,
  seedSampleEvents
};
