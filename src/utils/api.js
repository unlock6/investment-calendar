/**
 * API 유틸리티
 * 환경변수 기반 API 베이스 URL 관리 및 공통 fetch 래퍼
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * API fetch 래퍼 - 공통 에러 핸들링 포함
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

// === 이벤트 API ===

export async function fetchAllEvents() {
  return apiFetch('/api/events');
}

export async function fetchUserEvents() {
  return apiFetch('/api/user-events');
}

export async function addUserEvent(eventId, note = '') {
  return apiFetch('/api/user-events', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId, note }),
  });
}

export async function deleteUserEvent(userEventId) {
  return apiFetch(`/api/user-events/${userEventId}`, {
    method: 'DELETE',
  });
}

export async function updateUserEvent(userEventId, data) {
  return apiFetch(`/api/user-events/${userEventId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function sendChatMessage(message, conversationHistory, userProfile) {
  return apiFetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversationHistory, userProfile }),
  });
}

// === 뉴스 API ===
export async function fetchNews(category = 'all') {
  const result = await apiFetch(`/api/news?category=${encodeURIComponent(category)}`);
  return result.articles || [];
}

// === 주식 가격 API ===

/**
 * 실시간 주식 가격 조회 (Yahoo Finance 프록시)
 * @param {string[]} tickers - 티커 배열 (예: ['AAPL', 'NVDA', '005930'])
 * @returns {Object} - { ticker: { price, change, changePercent, name, ... } }
 */
export async function fetchStockPrices(tickers) {
  if (!tickers || tickers.length === 0) return {};
  const query = tickers.join(',');
  const result = await apiFetch(`/api/stocks/prices?tickers=${encodeURIComponent(query)}`);
  return result.data || {};
}

export default {
  fetchAllEvents,
  fetchUserEvents,
  addUserEvent,
  deleteUserEvent,
  updateUserEvent,
  sendChatMessage,
};
