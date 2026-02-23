import { getEventTypeConfig } from './eventTypes';

/**
 * 이벤트를 FullCalendar 형식으로 변환
 * - 이벤트 타입별 풍부한 색상/아이콘 지원
 */
export function formatEventsForCalendar(events) {
  if (!events || !Array.isArray(events)) {
    return [];
  }

  return events.map(event => {
    const eventDate = new Date(event.datetime);
    const typeConfig = getEventTypeConfig(event.event_type);

    let backgroundColor = typeConfig.bgColor;
    let borderColor = typeConfig.color;
    let textColor = typeConfig.color;

    if (event.isMyEvent) {
      borderColor = '#3b82f6';
      if (event.completed) {
        backgroundColor = '#f3f4f6';
        textColor = '#9ca3af';
        borderColor = '#9ca3af';
      }
    }

    // 예측 이벤트: 보라색 계열 + 점선 처리는 CSS classNames로
    if (event.is_prediction) {
      backgroundColor = '#f5f3ff';
      borderColor = '#8b5cf6';
      textColor = '#7c3aed';
    }

    return {
      id: event.id.toString(),
      title: (event.isMyEvent ? '⭐ ' : (typeConfig.icon + ' ')) + event.title,
      start: eventDate.toISOString(),
      allDay: false,
      backgroundColor,
      borderColor,
      textColor,
      classNames: event.is_prediction ? ['fc-event-prediction'] : [],
      extendedProps: {
        event_type: event.event_type,
        impact_level: event.impact_level,
        is_prediction: event.is_prediction || false,
        tags: event.tags,
        description: event.description,
        datetime: event.datetime,
        isMyEvent: event.isMyEvent,
        userEventId: event.userEventId,
        completed: event.completed,
        note: event.note
      }
    };
  });
}

/**
 * 이벤트 타입별 필터링 (카테고리 기반 필터도 지원)
 */
export function filterEventsByType(events, selectedTypes) {
  if (!events || !Array.isArray(events)) {
    return [];
  }

  if (selectedTypes.includes('all')) {
    return events;
  }

  return events.filter(event => {
    if (!event || !event.event_type) return false;
    const typeConfig = getEventTypeConfig(event.event_type);
    return selectedTypes.includes(event.event_type) || selectedTypes.includes(typeConfig.category);
  });
}
