/**
 * 브라우저 알림 권한 요청
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * 알림 표시
 */
export function showNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    // 클릭 시 창 포커스
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
}

/**
 * 이벤트 알림 예약
 */
export function scheduleEventNotification(event, minutesBefore = 60) {
  const eventTime = new Date(event.datetime);
  const notifyTime = new Date(eventTime.getTime() - minutesBefore * 60000);
  const now = new Date();

  if (notifyTime > now) {
    const delay = notifyTime.getTime() - now.getTime();
    
    setTimeout(() => {
      showNotification(`${event.title} ${minutesBefore}분 전`, {
        body: event.description || '곧 시작됩니다!',
        tag: `event-${event.id}`,
        requireInteraction: true
      });
    }, delay);

    console.log(`⏰ 알림 예약: ${event.title} (${minutesBefore}분 전)`);
    return true;
  }

  return false;
}

/**
 * 내 이벤트 알림 체크 및 예약
 */
export async function checkAndScheduleNotifications() {
  try {
    const response = await fetch('/api/user-events');
    const userEvents = await response.json();

    let scheduled = 0;
    userEvents.forEach(ue => {
      if (!ue.completed && ue.event) {
        const success = scheduleEventNotification(ue.event, 60);
        if (success) scheduled++;
      }
    });

    if (scheduled > 0) {
      console.log(`✅ ${scheduled}개 알림 예약 완료`);
    }

    return scheduled;
  } catch (error) {
    console.error('알림 예약 에러:', error);
    return 0;
  }
}
