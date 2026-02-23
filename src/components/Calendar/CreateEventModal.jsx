import React, { useState } from 'react';
import { EVENT_TYPES, IMPACT_LEVELS } from '../../utils/eventTypes';

/**
 * 커스텀 이벤트 생성 모달
 * - 참조 컴포넌트의 이벤트 생성 기능 통합
 */
const CreateEventModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    datetime: '',
    event_type: 'custom',
    impact_level: 'medium',
    description: '',
    tags: '',
    is_prediction: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.datetime) return;

    setIsSaving(true);
    try {
      const eventData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      await onSave(eventData);
      onClose();
    } catch (err) {
      console.error('이벤트 생성 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 사용 가능한 이벤트 타입들
  const eventTypeOptions = Object.entries(EVENT_TYPES).filter(([key]) =>
    ['fomc', 'cpi', 'earnings', 'dividend', 'macro', 'stock', 'custom'].includes(key)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* 모바일 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 헤더 */}
        <div className="p-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">이벤트 만들기</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          {/* 제목 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="예: FOMC 회의, 삼성전자 실적발표"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 날짜/시간 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">날짜 & 시간 *</label>
            <input
              type="datetime-local"
              value={formData.datetime}
              onChange={e => handleChange('datetime', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 이벤트 타입 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">이벤트 유형</label>
            <div className="grid grid-cols-3 gap-2">
              {eventTypeOptions.map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChange('event_type', key)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                    formData.event_type === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{config.label}</span>
                  {config.description && (
                    <span className="text-[10px] text-gray-400 leading-tight">{config.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 영향도 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">영향도 (주가 영향 예상 수준)</label>
            <div className="flex gap-2">
              {Object.entries(IMPACT_LEVELS).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChange('impact_level', key)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border-2 transition-all ${
                    formData.impact_level === key
                      ? `border-current`
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                  style={formData.impact_level === key ? { borderColor: config.color, backgroundColor: config.bgColor } : {}}
                >
                  <span>{config.emoji}</span>
                  <span className="text-xs font-semibold" style={formData.impact_level === key ? { color: config.color } : { color: '#6b7280' }}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-gray-400">{config.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">설명</label>
            <textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="이벤트에 대한 상세 설명을 작성하세요..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[70px] resize-none"
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">태그</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => handleChange('tags', e.target.value)}
              placeholder="콤마로 구분 (예: AAPL, 실적, 4분기)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 예측 이벤트 토글 */}
          <button
            type="button"
            onClick={() => handleChange('is_prediction', !formData.is_prediction)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
              formData.is_prediction
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              formData.is_prediction ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
            }`}>
              {formData.is_prediction && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <div className={`text-sm font-semibold ${formData.is_prediction ? 'text-purple-700' : 'text-gray-700'}`}>
                🔮 예측 이벤트
              </div>
              <div className="text-xs text-gray-400">아직 확정되지 않은 예상 일정 (캘린더에 점선으로 표시)</div>
            </div>
          </button>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSaving || !formData.title.trim() || !formData.datetime}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-all active:scale-[0.98] shadow-sm"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                생성 중...
              </span>
            ) : '이벤트 생성'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
