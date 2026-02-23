import React, { useState } from 'react';
import { addUserEvent, deleteUserEvent, updateUserEvent } from '../../utils/api';
import { useToast } from '../Toast';
import { getEventTypeConfig, IMPACT_LEVELS, calculateDDay } from '../../utils/eventTypes';

const EventDetailPanel = ({ event, onClose, onEventUpdated }) => {
  const [note, setNote] = useState(event.note || '');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const typeConfig = getEventTypeConfig(event.event_type);
  const impact = IMPACT_LEVELS[event.impact_level] || IMPACT_LEVELS.low;
  const dDay = calculateDDay(event.datetime);

  const handleToggleMyEvent = async () => {
    try {
      setIsSaving(true);
      if (event.isMyEvent) {
        await deleteUserEvent(event.userEventId);
        toast.info('캘린더에서 제거되었습니다');
        if (onEventUpdated) await onEventUpdated();
        onClose();
      } else {
        await addUserEvent(event.id, note);
        toast.success('내 캘린더에 추가되었습니다!');
        if (onEventUpdated) await onEventUpdated();
      }
    } catch (error) {
      console.error('이벤트 토글 실패:', error);
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!event.isMyEvent) return;
    try {
      setIsSaving(true);
      await updateUserEvent(event.userEventId, { note });
      toast.success('메모가 저장되었습니다');
      if (onEventUpdated) await onEventUpdated();
    } catch (error) {
      console.error('메모 저장 실패:', error);
      toast.error('메모 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!event.isMyEvent) return;
    try {
      setIsSaving(true);
      await updateUserEvent(event.userEventId, { completed: !event.completed });
      toast.success(event.completed ? '완료 해제' : '완료 처리되었습니다');
      if (onEventUpdated) await onEventUpdated();
    } catch (error) {
      console.error('완료 토글 실패:', error);
      toast.error('처리에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 (모바일) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 컬러 헤더 배너 */}
        <div className="px-5 pt-4 pb-3" style={{ backgroundColor: typeConfig.bgColor }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* 타입 아이콘 + D-Day */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
                  {typeConfig.icon}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: typeConfig.color, color: '#fff' }}>
                  {typeConfig.label}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  dDay.isToday ? 'bg-red-500 text-white' :
                  dDay.isPast ? 'bg-gray-200 text-gray-600' :
                  'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {dDay.text}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 leading-tight">{event.title}</h2>

              {/* 날짜 */}
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(event.datetime).toLocaleString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  weekday: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>

            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl transition flex-shrink-0">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="px-5 py-4 space-y-4">
          {/* 영향도 */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: impact.bgColor, border: `1px solid ${impact.borderColor}` }}>
            <span className="text-lg">{impact.emoji}</span>
            <div>
              <span className="text-xs text-gray-500">시장 영향도</span>
              <p className="text-sm font-bold" style={{ color: impact.color }}>{impact.label}</p>
            </div>
          </div>

          {/* 설명 */}
          {event.description && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">상세 정보</h3>
              <p className="text-sm text-gray-800 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* 태그 */}
          {event.tags?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">관련 태그</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                    style={{ backgroundColor: typeConfig.bgColor, color: typeConfig.color, borderColor: typeConfig.borderColor }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 추가/제거 버튼 */}
          <button
            onClick={handleToggleMyEvent}
            disabled={isSaving}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              event.isMyEvent
                ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                처리 중...
              </span>
            ) : event.isMyEvent ? '⭐ 내 캘린더에서 제거' : '⭐ 내 캘린더에 추가'}
          </button>

          {/* 내 이벤트 관련 기능 */}
          {event.isMyEvent && (
            <>
              {/* 완료 체크 */}
              <button
                onClick={handleToggleComplete}
                disabled={isSaving}
                className="flex items-center gap-3 w-full p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  event.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                  {event.completed && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`font-medium text-sm ${event.completed ? 'text-green-600' : 'text-gray-700'}`}>
                  {event.completed ? '완료됨 ✓' : '완료로 표시'}
                </span>
              </button>

              {/* 메모 */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">메모</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="이 이벤트에 대한 메모를 작성하세요..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 min-h-[80px] resize-none"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="mt-2 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isSaving ? '저장 중...' : '메모 저장'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPanel;
