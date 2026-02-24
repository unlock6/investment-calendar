import React, { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarView = ({ events, onEventClick, isMobile, leftSidebarOpen, rightPanelOpen }) => {
  const calendarRef = useRef(null);

  const handleEventClick = (clickInfo) => {
    if (onEventClick) {
      const fcEvent = clickInfo.event;
      const plainEvent = {
        id: parseInt(fcEvent.id),
        title: fcEvent.extendedProps.isMyEvent
          ? fcEvent.title.replace(/^⭐ /, '')
          : fcEvent.title,
        datetime: fcEvent.extendedProps.datetime,
        event_type: fcEvent.extendedProps.event_type,
        impact_level: fcEvent.extendedProps.impact_level,
        is_prediction: fcEvent.extendedProps.is_prediction,
        description: fcEvent.extendedProps.description,
        tags: fcEvent.extendedProps.tags,
        isMyEvent: fcEvent.extendedProps.isMyEvent,
        userEventId: fcEvent.extendedProps.userEventId,
        completed: fcEvent.extendedProps.completed,
        note: fcEvent.extendedProps.note
      };
      onEventClick(plainEvent);
    }
  };

  // 사이드바 상태 변경 시 캘린더 크기 재조정
  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [leftSidebarOpen, rightPanelOpen]);

  // 윈도우 리사이즈 시 재조정
  useEffect(() => {
    const handleResize = () => {
      if (calendarRef.current) calendarRef.current.getApi().updateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── 커스텀 이벤트 렌더러 ──
  // 임팩트 도트(🔴🟡🟢) + 예측 뱃지 + 제목 직접 표시
  const renderEventContent = (arg) => {
    const { impact_level, is_prediction } = arg.event.extendedProps;

    const dotColor =
      impact_level === 'high'   ? '#ef4444' :
      impact_level === 'medium' ? '#f59e0b' :
                                  '#22c55e';

    // 이모지 접두어 제거 (렌더러에서 직접 표시하므로)
    const rawTitle = arg.event.title.replace(/^[⭐🏛️💰📊🔔📉📈🏭💹🎯✨🔮]\s*/, '');

    // 모바일: 더 작고 컴팩트하게 표시
    if (isMobile) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          padding: '1px 2px', overflow: 'hidden', width: '100%',
          cursor: 'pointer',
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: dotColor, flexShrink: 0, display: 'inline-block'
          }} />
          <span style={{
            fontSize: '9px', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            fontWeight: 600, lineHeight: '1.3',
          }}>
            {rawTitle}
          </span>
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '3px',
        padding: '1px 4px', overflow: 'hidden', width: '100%',
        cursor: 'pointer',
      }}>
        {/* 임팩트 도트 */}
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: dotColor, flexShrink: 0, display: 'inline-block'
        }} />

        {/* 예측 뱃지 */}
        {is_prediction && (
          <span style={{
            fontSize: '9px', lineHeight: '14px',
            background: '#ede9fe', color: '#7c3aed',
            borderRadius: '3px', padding: '0 3px',
            fontWeight: 700, flexShrink: 0
          }}>예측</span>
        )}

        {/* 제목 */}
        <span style={{
          fontSize: '11px', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          fontWeight: 500,
        }}>
          {rawTitle}
        </span>
      </div>
    );
  };

  return (
    <div className="notion-card w-full h-full flex flex-col">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: isMobile ? '' : 'today'
        }}
        height="100%"
        eventDisplay="block"
        dayMaxEvents={isMobile ? 2 : 3}
        locale="ko"
        fixedWeekCount={false}
        showNonCurrentDates={false}
        eventInteractive={true}
        selectMirror={true}
        expandRows={true}
      />
    </div>
  );
};

export default CalendarView;
