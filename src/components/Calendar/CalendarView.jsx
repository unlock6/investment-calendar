import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// ── 모바일 목록 뷰 ──
const EventListView = ({ events, onEventClick }) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // FullCalendar 포맷 → 일반 객체로 변환
  const items = events.map(ev => ({
    id:           ev.id,
    title:        (ev.title || '').replace(/^[⭐🏛️💰📊🔔📉📈🏭💹🎯✨🔮]\s*/, ''),
    datetime:     ev.extendedProps?.datetime || ev.start,
    impact_level: ev.extendedProps?.impact_level,
    event_type:   ev.extendedProps?.event_type,
    is_prediction:ev.extendedProps?.is_prediction,
    isMyEvent:    ev.extendedProps?.isMyEvent,
    description:  ev.extendedProps?.description,
    tags:         ev.extendedProps?.tags,
    userEventId:  ev.extendedProps?.userEventId,
    completed:    ev.extendedProps?.completed,
    note:         ev.extendedProps?.note,
  })).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  // 날짜 그룹 라벨
  const getGroupLabel = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - now) / 86400000);
    if (diff < 0)  return '지난 이벤트';
    if (diff === 0) return '오늘';
    if (diff === 1) return '내일';
    if (diff <= 6)  return '이번 주';
    if (diff <= 13) return '다음 주';
    if (diff <= 30) return '이번 달';
    return '이후';
  };

  // 그룹핑
  const groups = [];
  const groupMap = {};
  const ORDER = ['지난 이벤트','오늘','내일','이번 주','다음 주','이번 달','이후'];

  items.forEach(item => {
    const label = getGroupLabel(item.datetime);
    if (!groupMap[label]) {
      groupMap[label] = [];
      groups.push(label);
    }
    groupMap[label].push(item);
  });

  groups.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

  const impactStyle = (level) => ({
    dot:  level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e',
    bg:   level === 'high' ? 'bg-red-50 border-red-100' : level === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100',
    badge:level === 'high' ? 'bg-red-100 text-red-600' : level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700',
    text: level === 'high' ? '고위험' : level === 'medium' ? '주의' : '저위험',
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <span className="text-4xl mb-3">📅</span>
        <p className="text-sm">표시할 이벤트가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full px-3 py-2 space-y-4">
      {groups.map(label => (
        <div key={label}>
          {/* 그룹 헤더 */}
          <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50 py-1 z-10">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              label === '오늘' ? 'bg-blue-600 text-white' :
              label === '내일' ? 'bg-blue-100 text-blue-700' :
              label === '지난 이벤트' ? 'bg-gray-200 text-gray-500' :
              'bg-gray-100 text-gray-600'
            }`}>{label}</span>
            <span className="text-xs text-gray-400">{groupMap[label].length}개</span>
          </div>

          {/* 이벤트 카드 */}
          <div className="space-y-1.5">
            {groupMap[label].map(item => {
              const s = impactStyle(item.impact_level);
              const dt = new Date(item.datetime);
              const dateStr = `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;

              return (
                <button
                  key={item.id}
                  onClick={() => onEventClick && onEventClick(item)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border ${s.bg} active:scale-[0.98] transition-all`}
                >
                  {/* 임팩트 도트 */}
                  <span className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: s.dot }} />

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.badge}`}>
                        {s.text}
                      </span>
                      {item.isMyEvent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">⭐ 내 이벤트</span>
                      )}
                      {item.is_prediction && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">예측</span>
                      )}
                    </div>
                    {/* 제목 — 전체 표시 */}
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
                  </div>

                  {/* 화살표 */}
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── 메인 CalendarView ──
const CalendarView = ({ events, onEventClick, isMobile, leftSidebarOpen, rightPanelOpen }) => {
  const calendarRef = useRef(null);
  const [listView, setListView] = useState(false); // 모바일 목록 뷰 토글

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
  const renderEventContent = (arg) => {
    const { impact_level, is_prediction } = arg.event.extendedProps;

    const dotColor =
      impact_level === 'high'   ? '#ef4444' :
      impact_level === 'medium' ? '#f59e0b' :
                                  '#22c55e';

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
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: dotColor, flexShrink: 0, display: 'inline-block'
        }} />
        {is_prediction && (
          <span style={{
            fontSize: '9px', lineHeight: '14px',
            background: '#ede9fe', color: '#7c3aed',
            borderRadius: '3px', padding: '0 3px',
            fontWeight: 700, flexShrink: 0
          }}>예측</span>
        )}
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

      {/* 모바일 전용: 캘린더/목록 토글 버튼 */}
      {isMobile && (
        <div className="flex items-center justify-end px-3 py-1.5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setListView(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                !listView ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {/* 캘린더 그리드 아이콘 */}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
              </svg>
              캘린더
            </button>
            <button
              onClick={() => setListView(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                listView ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {/* 목록 아이콘 */}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              목록
            </button>
          </div>
        </div>
      )}

      {/* 목록 뷰 */}
      {isMobile && listView ? (
        <div className="flex-1 overflow-hidden bg-gray-50">
          <EventListView events={events} onEventClick={onEventClick} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
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
      )}
    </div>
  );
};

export default CalendarView;
