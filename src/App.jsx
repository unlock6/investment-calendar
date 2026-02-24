import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CalendarView from './components/Calendar/CalendarView';
import EventDetailPanel from './components/Calendar/EventDetailPanel';
import CreateEventModal from './components/Calendar/CreateEventModal';
import { formatEventsForCalendar, filterEventsByType } from './utils/eventHelpers';
import { FILTER_OPTIONS } from './utils/eventTypes';
import { fetchAllEvents, fetchUserEvents, sendChatMessage as apiSendChat } from './utils/api';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import { requestNotificationPermission, checkAndScheduleNotifications } from './utils/notificationHelper';
import RiskPanel from './components/RiskAnalysis/RiskPanel';
import PortfolioAnalysis from './components/Portfolio/PortfolioAnalysis';
import WatchlistPanel from './components/Watchlist/WatchlistPanel';
import NewsFeed from './components/News/NewsFeed';
import ProfileEditor from './components/Profile/ProfileEditor';
import { useToast } from './components/Toast';
import { getLocalFallbackResponse, SUGGESTED_QUESTIONS } from './utils/chatFallback';
import './styles/index.css';

function App() {
  // === 핵심 데이터 ===
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // === 사용자 ===
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showOnlyMyEvents, setShowOnlyMyEvents] = useState(false);

  // === UI 상태 ===
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // === AI 채팅 ===
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('ai');

  const toast = useToast();

  // ========================
  //  Effects
  // ========================

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setLeftSidebarOpen(false);
        setRightPanelOpen(false);
      } else {
        setLeftSidebarOpen(true);
        setRightPanelOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch {
        setShowOnboarding(true);
      }
    } else {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const granted = await requestNotificationPermission();
        setNotificationEnabled(granted);
        if (granted) await checkAndScheduleNotifications();
      } catch { /* 무시 */ }
    };
    initNotifications();
    const interval = setInterval(initNotifications, 5 * 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsData, myEventsData] = await Promise.all([
          fetchAllEvents(),
          fetchUserEvents().catch(() => [])
        ]);
        setEvents(eventsData);
        setMyEvents(myEventsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ========================
  //  핸들러
  // ========================

  const refreshMyEvents = useCallback(async () => {
    try {
      const data = await fetchUserEvents();
      setMyEvents(data);
    } catch (err) {
      console.error('새로고침 실패:', err);
    }
  }, []);

  const handleSendChat = async (messageOverride) => {
    const userMessage = (messageOverride || chatInput).trim();
    if (!userMessage || chatLoading) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const data = await apiSendChat(userMessage, chatMessages, userProfile);
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      // 로컬 폴백 응답 사용
      const fallbackResponse = getLocalFallbackResponse(userMessage);
      setChatMessages(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleOnboardingComplete = (profile) => {
    setUserProfile(profile);
    setShowOnboarding(false);
    toast.success('프로필이 설정되었습니다!');
  };

  const handleProfileSave = (updatedProfile) => {
    setUserProfile(updatedProfile);
    setShowProfileEditor(false);
    toast.success('프로필이 업데이트되었습니다!');
  };

  const handleCreateEvent = async (eventData) => {
    // TODO: 백엔드 API 연동 시 실제 저장
    toast.success('이벤트가 생성되었습니다!');
    // 현재는 프론트엔드에만 추가 (데모)
    const newEvent = {
      id: Date.now(),
      ...eventData,
      datetime: new Date(eventData.datetime).toISOString()
    };
    setEvents(prev => [...prev, newEvent]);
  };

  // ========================
  //  Memos
  // ========================

  const myEventIds = useMemo(() => new Set(myEvents.map(ue => ue.event_id)), [myEvents]);

  // 오늘 이벤트 (고임팩트 우선)
  const todayEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    return events
      .filter(e => {
        const d = new Date(e.datetime);
        return d >= today && d < tomorrow;
      })
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.impact_level] ?? 1) - (order[b.impact_level] ?? 1);
      });
  }, [events]);

  // 이번 주 이벤트 요약 (일~토)
  const weekSummary = useMemo(() => {
    const now   = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
    const end   = new Date(start); end.setDate(start.getDate() + 7);
    const weekEvents = events.filter(e => {
      const d = new Date(e.datetime);
      return d >= start && d < end;
    });
    return {
      total:  weekEvents.length,
      high:   weekEvents.filter(e => e.impact_level === 'high').length,
      medium: weekEvents.filter(e => e.impact_level === 'medium').length,
      low:    weekEvents.filter(e => e.impact_level === 'low').length,
    };
  }, [events]);

  // 다가오는 내 이벤트 (최대 5개)
  const upcomingMyEvents = useMemo(() => {
    const now = new Date();
    return [...myEvents]
      .filter(ue => {
        const ev = ue.event || ue;
        return new Date(ev.datetime) >= now;
      })
      .sort((a, b) => {
        const ea = a.event || a, eb = b.event || b;
        return new Date(ea.datetime) - new Date(eb.datetime);
      })
      .slice(0, 5);
  }, [myEvents]);

  const displayedEvents = useMemo(() => {
    let sourceEvents;
    if (showOnlyMyEvents) {
      sourceEvents = myEvents.map(ue => ({
        ...ue.event,
        isMyEvent: true,
        userEventId: ue.id,
        completed: ue.completed,
        note: ue.note
      }));
    } else {
      sourceEvents = events.map(event => {
        const userEvent = myEvents.find(ue => ue.event_id === event.id);
        return {
          ...event,
          isMyEvent: myEventIds.has(event.id),
          userEventId: userEvent?.id,
          completed: userEvent?.completed,
          note: userEvent?.note
        };
      });
    }
    return formatEventsForCalendar(filterEventsByType(sourceEvents, selectedTypes));
  }, [events, myEvents, myEventIds, showOnlyMyEvents, selectedTypes]);

  const handleFilterClick = (typeId) => {
    if (typeId === 'all') {
      setSelectedTypes(['all']);
    } else {
      let newTypes = selectedTypes.filter(t => t !== 'all');
      if (newTypes.includes(typeId)) {
        newTypes = newTypes.filter(t => t !== typeId);
      } else {
        newTypes.push(typeId);
      }
      if (newTypes.length === 0) newTypes = ['all'];
      setSelectedTypes(newTypes);
    }
  };

  // ========================
  //  모바일 하단 네비게이션 핸들러
  // ========================

  const openMobilePanel = (tab) => {
    setRightPanelTab(tab);
    setRightPanelOpen(true);
  };

  // 오버레이 스와이프 vs 탭 구분용 ref
  const overlayTouchMoved = React.useRef(false);

  // 삼성/안드로이드: 키보드 열릴 때 패널 bottom 동적 조정
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (!window.visualViewport) return;
    const onViewportResize = () => {
      const kbHeight = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
      setKeyboardHeight(kbHeight);
    };
    window.visualViewport.addEventListener('resize', onViewportResize);
    window.visualViewport.addEventListener('scroll', onViewportResize);
    return () => {
      window.visualViewport.removeEventListener('resize', onViewportResize);
      window.visualViewport.removeEventListener('scroll', onViewportResize);
    };
  }, []);

  // ========================
  //  로딩 & 에러 화면
  // ========================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">투자 캘린더</h2>
        <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">📡</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">서버에 연결할 수 없습니다</h2>
          <p className="text-gray-600 mb-2 text-sm">백엔드 서버가 실행 중인지 확인해주세요.</p>
          <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 rounded-lg p-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all active:scale-95"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // ========================
  //  메인 렌더
  // ========================

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* 왼쪽 사이드바 오버레이 (모바일) */}
      {isMobile && leftSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={() => setLeftSidebarOpen(false)} />
      )}

      {/* ===== 왼쪽 사이드바 ===== */}
      <aside className={`
        ${isMobile ? 'fixed top-0 bottom-16 left-0 z-50' : 'relative'}
        ${isMobile
          ? (leftSidebarOpen ? 'translate-x-0' : '-translate-x-full')
          : (leftSidebarOpen ? 'w-64 lg:w-72' : 'w-0')
        }
        transition-all duration-300 ease-in-out
        bg-white border-r border-gray-200 flex flex-col
        ${!leftSidebarOpen && !isMobile ? 'overflow-hidden' : ''}
      `}>
        {(isMobile || leftSidebarOpen) && (
          <div className="flex flex-col h-full w-64 lg:w-72">

            {/* ===== 앱 로고 헤더 ===== */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">IC</span>
                </div>
                <span className="font-bold text-gray-900 text-sm">투자 캘린더</span>
              </div>
              {isMobile && (
                <button onClick={() => setLeftSidebarOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* ===== 프로필 ===== */}
            {userProfile ? (
              <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-base">
                    {(userProfile.name || '투')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm truncate">{userProfile.name || '투자자'}</div>
                  <div className="text-xs text-gray-400">{userProfile.portfolio?.length || 0}종목 관리중</div>
                </div>
                <button
                  onClick={() => setShowProfileEditor(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                  title="프로필 편집"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100">
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 border-dashed rounded-xl transition text-left"
                >
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <div className="font-bold text-blue-700 text-sm">프로필 설정하기</div>
                    <div className="text-xs text-blue-400">맞춤 분석을 받아보세요</div>
                  </div>
                </button>
              </div>
            )}

            {/* ===== 스크롤 영역 ===== */}
            <div className="flex-1 overflow-y-auto">

              {/* 뷰 필터 */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">뷰 필터</span>
                </div>
                <div className="space-y-0.5">
                  {[
                    {
                      id: 'all', label: '전체 이벤트', icon: '📅',
                      isActive: () => selectedTypes.includes('all') && !showOnlyMyEvents,
                      action: () => { setSelectedTypes(['all']); setShowOnlyMyEvents(false); }
                    },
                    {
                      id: 'macro', label: '거시경제', icon: '🏛️',
                      isActive: () => selectedTypes.includes('macro') && !showOnlyMyEvents,
                      action: () => { setSelectedTypes(['macro']); setShowOnlyMyEvents(false); }
                    },
                    {
                      id: 'earnings', label: '기업', icon: '📋',
                      isActive: () => selectedTypes.includes('earnings') && !showOnlyMyEvents,
                      action: () => { setSelectedTypes(['earnings']); setShowOnlyMyEvents(false); }
                    },
                    {
                      id: 'my', label: '내 이벤트만', icon: '⭐',
                      isActive: () => showOnlyMyEvents,
                      action: () => { setShowOnlyMyEvents(true); setSelectedTypes(['all']); }
                    },
                  ].map(f => {
                    const active = f.isActive();
                    return (
                      <button
                        key={f.id}
                        onClick={f.action}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                          active
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 font-medium'
                        }`}
                      >
                        <span className="text-base leading-none">{f.icon}</span>
                        <span className="flex-1 text-left">{f.label}</span>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-gray-100 mx-4" />

              {/* 이번 주 요약 */}
              {weekSummary.total > 0 && (
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">이번 주 ({weekSummary.total})</span>
                  </div>
                  <div className="flex gap-1 mb-2 h-1.5 rounded-full overflow-hidden bg-gray-100">
                    {weekSummary.high   > 0 && <div className="bg-red-400 rounded-full"   style={{ width: `${(weekSummary.high   / weekSummary.total) * 100}%` }} />}
                    {weekSummary.medium > 0 && <div className="bg-amber-400 rounded-full" style={{ width: `${(weekSummary.medium / weekSummary.total) * 100}%` }} />}
                    {weekSummary.low    > 0 && <div className="bg-green-400 rounded-full"  style={{ width: `${(weekSummary.low    / weekSummary.total) * 100}%` }} />}
                  </div>
                  <div className="flex gap-2 text-xs text-gray-500">
                    {weekSummary.high   > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>고위험 {weekSummary.high}</span>}
                    {weekSummary.medium > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>중위험 {weekSummary.medium}</span>}
                    {weekSummary.low    > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>저위험 {weekSummary.low}</span>}
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100 mx-4" />

              {/* 내 이벤트 */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">내 이벤트 ({myEvents.length})</span>
                </div>
                {upcomingMyEvents.length > 0 ? (
                  <div className="space-y-0.5">
                    {upcomingMyEvents.map((ue, idx) => {
                      const ev = ue.event || ue;
                      const dt = new Date(ev.datetime);
                      const dateStr = `${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                      const dotColors = ['bg-green-500', 'bg-blue-500', 'bg-red-500', 'bg-amber-500', 'bg-purple-500'];
                      return (
                        <div
                          key={ev.id || idx}
                          className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                          onClick={() => setSelectedEvent({ ...ev, isMyEvent: true, userEventId: ue.id, completed: ue.completed, note: ue.note })}
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[idx % dotColors.length]}`} />
                          <span className="flex-1 text-sm text-gray-800 truncate font-medium">{ev.title}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{dateStr}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 px-2 py-1.5">등록된 이벤트가 없어요</p>
                )}
              </div>

            </div>

            {/* ===== 하단 버튼 + 면책 고지 ===== */}
            <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 space-y-2">
              <button
                onClick={() => setShowCreateEvent(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                이벤트 만들기
              </button>
              <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1">
                <span>⚠️</span>
                <span>본 정보는 투자 권유가 아닙니다</span>
              </p>
            </div>

          </div>
        )}
      </aside>

      {/* ===== 메인 콘텐츠 ===== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">투자 이벤트 캘린더</h1>
              {isMobile && (
                <p className="text-xs text-gray-400">{displayedEvents.length}개 이벤트</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && (
              <span className="text-xs text-gray-400 mr-2">{displayedEvents.length}개 이벤트</span>
            )}
            {/* 이벤트 추가 (데스크탑 빠른 접근) */}
            {!isMobile && (
              <button
                onClick={() => setShowCreateEvent(true)}
                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                title="이벤트 만들기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
            <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {rightPanelOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                }
              </svg>
            </button>
          </div>
        </header>

        {/* 오늘 이벤트 배너 */}
        {todayEvents.length > 0 && (
          <div className="flex-shrink-0 bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-amber-700 flex-shrink-0 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              오늘
            </span>
            {todayEvents.slice(0, 4).map(ev => {
              const impactColor =
                ev.impact_level === 'high'   ? 'border-red-300 bg-white text-red-700' :
                ev.impact_level === 'medium' ? 'border-amber-300 bg-white text-amber-700' :
                                               'border-green-300 bg-white text-green-700';
              const dot =
                ev.impact_level === 'high'   ? '🔴' :
                ev.impact_level === 'medium' ? '🟡' : '🟢';
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 flex-shrink-0 hover:brightness-95 transition text-xs font-semibold ${impactColor}`}
                >
                  <span>{dot}</span>
                  <span>{ev.title}</span>
                  <span className="bg-red-100 text-red-600 rounded px-1 font-bold text-[10px]">D-Day</span>
                </button>
              );
            })}
            {todayEvents.length > 4 && (
              <span className="text-xs text-amber-500 flex-shrink-0">+{todayEvents.length - 4}개</span>
            )}
          </div>
        )}

        {/* 캘린더 */}
        <div className={`flex-1 overflow-hidden p-3 md:p-4 ${isMobile ? 'pb-20' : ''}`}>
          <div className="h-full max-w-full mx-auto">
            <CalendarView
              events={displayedEvents}
              onEventClick={setSelectedEvent}
              isMobile={isMobile}
              leftSidebarOpen={leftSidebarOpen}
              rightPanelOpen={rightPanelOpen}
            />
          </div>
        </div>

        {/* 모바일 하단 네비게이션 */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-1 z-[55] safe-area-bottom">
            <button onClick={() => { setRightPanelOpen(false); setLeftSidebarOpen(false); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition ${!rightPanelOpen && !leftSidebarOpen ? 'text-blue-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">캘린더</span>
            </button>
            <button onClick={() => openMobilePanel('ai')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition ${rightPanelOpen && rightPanelTab === 'ai' ? 'text-blue-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-xs font-medium">AI</span>
            </button>
            <button onClick={() => openMobilePanel('risk')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition ${rightPanelOpen && rightPanelTab === 'risk' ? 'text-blue-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs font-medium">분석</span>
            </button>
            <button onClick={() => openMobilePanel('news')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition ${rightPanelOpen && rightPanelTab === 'news' ? 'text-blue-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span className="text-xs font-medium">뉴스</span>
            </button>
            <button onClick={() => setLeftSidebarOpen(true)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition ${leftSidebarOpen ? 'text-blue-600' : 'text-gray-400'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">설정</span>
            </button>
          </nav>
        )}
      </main>

      {/* 오른쪽 패널 오버레이 (모바일) */}
      {/* 스크롤(touchmove) 후 click은 무시 → 순수 탭만 닫기 */}
      {isMobile && rightPanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onTouchStart={() => { overlayTouchMoved.current = false; }}
          onTouchMove={() => { overlayTouchMoved.current = true; }}
          onClick={() => { if (!overlayTouchMoved.current) setRightPanelOpen(false); }}
        />
      )}

      {/* ===== 오른쪽 사이드바 ===== */}
      {/* onClick stopPropagation: 패널 내 클릭이 오버레이로 전파되지 않도록 */}
      {/* 모바일: bottom은 키보드 높이에 따라 동적 조정 (삼성 Android 대응) */}
      <aside
        onClick={(e) => e.stopPropagation()}
        style={isMobile ? { bottom: `${keyboardHeight > 10 ? keyboardHeight + 4 : 64}px` } : {}}
        className={`
        ${isMobile ? 'fixed top-0 right-0 z-50 w-[85vw] max-w-sm' : 'relative'}
        ${isMobile
          ? (rightPanelOpen ? 'translate-x-0' : 'translate-x-full')
          : (rightPanelOpen ? 'w-80' : 'w-0')
        }
        transition-all duration-300 ease-in-out
        bg-white border-l border-gray-200 flex flex-col
        ${!rightPanelOpen && !isMobile ? 'overflow-hidden' : ''}
      `}>
        {rightPanelOpen && (
          <>
            {/* 탭 헤더 */}
            <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
              {isMobile && (
                <button onClick={() => setRightPanelOpen(false)} className="p-3 hover:bg-gray-100 transition">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {[
                { id: 'ai', label: 'AI' },
                { id: 'risk', label: '리스크' },
                { id: 'portfolio', label: '성향' },
                { id: 'news', label: '뉴스' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRightPanelTab(tab.id)}
                  className={`flex-1 px-2 py-3 text-xs font-medium transition-all ${
                    rightPanelTab === tab.id
                      ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 콘텐츠 */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">

              {/* AI 챗 */}
              {rightPanelTab === 'ai' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">AI</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">AI 어시스턴트</h3>
                    </div>
                    <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      투자 권유가 아닌 참고 자료입니다.
                    </div>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
                    ref={(el) => { if (el && chatMessages.length > 0) el.scrollTop = el.scrollHeight; }}
                  >
                    {chatMessages.length === 0 && (
                      <div className="text-center text-gray-400 text-sm mt-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">💬</span>
                        </div>
                        <p className="font-medium text-gray-600 mb-3">무엇을 도와드릴까요?</p>
                        {/* 추천 질문 */}
                        <div className="space-y-2">
                          {SUGGESTED_QUESTIONS.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendChat(q)}
                              className="w-full text-left px-3 py-2.5 bg-gray-50 hover:bg-blue-50 rounded-xl text-xs text-gray-600 hover:text-blue-600 transition-all border border-gray-100 hover:border-blue-200"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] break-words leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100">
                          <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-gray-100 flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendChat()}
                        onFocus={(e) => {
                          // 안드로이드: 키보드 올라온 후 입력창이 보이도록 스크롤
                          setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 400);
                        }}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={chatLoading}
                      />
                      <button
                        onClick={() => handleSendChat()}
                        disabled={chatLoading || !chatInput.trim()}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-all active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 리스크 */}
              {rightPanelTab === 'risk' && (
                <div className="flex-1 overflow-y-auto">
                  <RiskPanel events={events} myEvents={myEvents} userProfile={userProfile} />
                </div>
              )}

              {/* 성향 */}
              {rightPanelTab === 'portfolio' && (
                <div className="flex-1 overflow-y-auto">
                  <PortfolioAnalysis userProfile={userProfile} myEvents={myEvents} />
                </div>
              )}

              {/* 뉴스 (NEW - 기존 트위터 링크 대신 풍부한 피드) */}
              {rightPanelTab === 'news' && (
                <div className="flex-1 overflow-hidden">
                  <NewsFeed userProfile={userProfile} />
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ===== 모달들 ===== */}
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}

      {showProfileEditor && userProfile && (
        <ProfileEditor
          profile={userProfile}
          onSave={handleProfileSave}
          onClose={() => setShowProfileEditor(false)}
        />
      )}

      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEventUpdated={refreshMyEvents}
          userProfile={userProfile}
        />
      )}

      {showCreateEvent && (
        <CreateEventModal
          onClose={() => setShowCreateEvent(false)}
          onSave={handleCreateEvent}
        />
      )}
    </div>
  );
}

export default App;
