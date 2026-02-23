# 투자 이벤트 캘린더 MVP - 설치 및 실행 가이드

## 📋 목차
1. [프로젝트 구조](#프로젝트-구조)
2. [설치 방법](#설치-방법)
3. [실행 방법](#실행-방법)
4. [파일별 설명](#파일별-설명)
5. [백엔드 연동 가이드](#백엔드-연동-가이드)

---

## 📁 프로젝트 구조

```
investment-calendar/
├── package.json              # 프로젝트 의존성 및 스크립트
├── vite.config.js           # Vite 빌드 설정
├── tailwind.config.js       # Tailwind CSS 설정
├── postcss.config.js        # PostCSS 설정
├── index.html               # HTML 엔트리 포인트
├── README.md                # 프로젝트 문서
│
└── src/
    ├── main.jsx             # React 앱 진입점
    ├── App.jsx              # 메인 컴포넌트 (상태 관리)
    │
    ├── components/          # React 컴포넌트들
    │   ├── Calendar/
    │   │   ├── CalendarView.jsx        # FullCalendar 래핑 컴포넌트
    │   │   └── EventDetailPanel.jsx    # 이벤트 상세 사이드 패널
    │   └── Filters/
    │       └── EventFilters.jsx        # 이벤트 타입 필터 버튼
    │
    ├── data/                # 데이터 관리
    │   └── mockEvents.js    # 더미 이벤트 데이터 (나중에 API로 교체)
    │
    ├── utils/               # 유틸리티 함수
    │   └── eventHelpers.js  # 이벤트 포매팅, 필터링 로직
    │
    └── styles/              # 스타일 파일
        └── index.css        # 전역 스타일 + FullCalendar 커스터마이징
```

---

## 🚀 설치 방법

### 1단계: 프로젝트 초기화
```bash
# 필요한 모든 파일을 다운로드한 후
npm install
```

### 2단계: 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하여 확인

### 3단계: 프로덕션 빌드 (선택사항)
```bash
npm run build    # dist/ 폴더에 빌드 파일 생성
npm run preview  # 빌드된 파일 미리보기
```

---

## 📝 파일별 설명

### 1. **App.jsx** (메인 컴포넌트)
- **역할**: 전체 애플리케이션의 상태를 관리하는 최상위 컴포넌트
- **주요 상태**:
  - `activeFilter`: 현재 활성화된 필터 ('all', 'macro', 'stock', 'crypto')
  - `selectedEvent`: 클릭한 이벤트 (사이드 패널 표시용)
- **최적화**: useMemo를 사용하여 불필요한 재계산 방지

```jsx
// 예시: 더미 데이터를 FullCalendar 형식으로 변환
const formattedEvents = useMemo(() => {
  return formatEventsForCalendar(mockEvents);
}, []);

// 예시: 필터에 따라 이벤트 필터링
const filteredEvents = useMemo(() => {
  return filterEventsByType(formattedEvents, activeFilter);
}, [formattedEvents, activeFilter]);
```

### 2. **CalendarView.jsx** (캘린더 컴포넌트)
- **역할**: FullCalendar 라이브러리를 래핑하여 이벤트 표시
- **주요 기능**:
  - 월간/주간 뷰 지원
  - 이벤트 클릭 시 콜백 실행
  - 한국어 로케일 적용

### 3. **EventDetailPanel.jsx** (상세 패널)
- **역할**: 이벤트 클릭 시 오른쪽에 나타나는 상세 정보 패널
- **주요 기능**:
  - 슬라이드 인 애니메이션
  - 이벤트 정보 표시 (제목, 날짜, impact level, 설명)
  - "내 캘린더에 추가" 버튼 (현재는 console.log만 실행)

### 4. **EventFilters.jsx** (필터 컴포넌트)
- **역할**: 이벤트 타입별 필터 버튼 렌더링
- **주요 기능**:
  - 전체/Macro/Stock/Crypto 필터 제공
  - 활성 필터에 따라 색상 변경

### 5. **mockEvents.js** (더미 데이터)
- **역할**: 백엔드 API 연동 전까지 사용할 테스트 데이터
- **데이터 구조**:
```javascript
{
  id: '1',
  title: 'Fed 금리 결정',
  date: '2026-02-18',
  type: 'macro',              // 'macro', 'stock', 'crypto'
  impact_level: 'high',       // 'high', 'medium', 'low'
  description: '...'
}
```

### 6. **eventHelpers.js** (유틸리티 함수)
- **역할**: 이벤트 관련 헬퍼 함수 제공
- **주요 함수**:
  - `formatEventsForCalendar()`: 더미 데이터를 FullCalendar 형식으로 변환
  - `filterEventsByType()`: 필터에 따라 이벤트 필터링
  - `getEventClassName()`: 이벤트 타입별 CSS 클래스명 반환

### 7. **index.css** (스타일)
- **역할**: 전역 스타일 및 FullCalendar 다크 테마 커스터마이징
- **주요 스타일**:
  - 다크 테마 색상 적용
  - FullCalendar 컴포넌트 재정의
  - 이벤트 타입별 색상 (빨강, 파랑, 보라)

---

## 🔗 백엔드 연동 가이드

### 1. 이벤트 데이터 가져오기 (App.jsx 수정)

**현재 (더미 데이터)**:
```jsx
import { mockEvents } from './data/mockEvents';

const formattedEvents = useMemo(() => {
  return formatEventsForCalendar(mockEvents);
}, []);
```

**백엔드 연동 후**:
```jsx
import { useState, useEffect } from 'react';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API에서 이벤트 가져오기
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        const formatted = formatEventsForCalendar(data);
        setEvents(formatted);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching events:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>로딩 중...</div>;

  // 나머지 코드는 동일
}
```

### 2. 내 캘린더에 추가 기능 (EventDetailPanel.jsx 수정)

**현재 (console.log만)**:
```jsx
const handleAddToCalendar = () => {
  console.log('내 캘린더에 추가:', event);
};
```

**백엔드 연동 후**:
```jsx
const handleAddToCalendar = async () => {
  try {
    const response = await fetch('/api/user/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` // 인증 토큰
      },
      body: JSON.stringify({
        eventId: event.id
      })
    });

    if (response.ok) {
      alert('내 캘린더에 추가되었습니다!');
      onClose(); // 패널 닫기
    } else {
      alert('추가에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error adding event:', error);
    alert('오류가 발생했습니다.');
  }
};
```

### 3. 백엔드 API 엔드포인트 예시

```
GET  /api/events                    # 모든 이벤트 가져오기
GET  /api/events?type=macro         # 타입별 필터링
GET  /api/user/calendar/events      # 사용자가 추가한 이벤트
POST /api/user/calendar/events      # 내 캘린더에 이벤트 추가
DELETE /api/user/calendar/events/:id # 내 캘린더에서 이벤트 삭제
```

---

## 🎨 커스터마이징

### 이벤트 색상 변경
`src/styles/index.css` 파일에서 다음 클래스 수정:

```css
.event-macro {
  background-color: #dc2626 !important;  /* 빨강 → 원하는 색상으로 변경 */
}

.event-stock {
  background-color: #2563eb !important;  /* 파랑 → 원하는 색상으로 변경 */
}

.event-crypto {
  background-color: #9333ea !important;  /* 보라 → 원하는 색상으로 변경 */
}
```

### 새로운 이벤트 타입 추가
1. `src/data/mockEvents.js`에 새 타입 이벤트 추가
2. `src/components/Filters/EventFilters.jsx`에 필터 버튼 추가
3. `src/utils/eventHelpers.js`에 색상 클래스 추가
4. `src/styles/index.css`에 스타일 정의

---

## 🐛 문제 해결

### 문제: 패키지 설치 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 문제: 포트가 이미 사용 중
```bash
# Vite 기본 포트 변경
npm run dev -- --port 3000
```

### 문제: FullCalendar 스타일 깨짐
- `src/styles/index.css`가 제대로 임포트되었는지 확인
- 브라우저 캐시 삭제 후 새로고침

---

## 📚 추가 개발 계획

- [ ] 백엔드 API 연동
- [ ] 사용자 인증 시스템
- [ ] 이벤트 검색 기능
- [ ] 알림/리마인더 설정
- [ ] 이벤트 상세 페이지
- [ ] 모바일 반응형 개선
- [ ] PWA (Progressive Web App) 지원

---

## 🎯 왜 이런 구조로 설계했나?

### 1. 컴포넌트 분리
- **이유**: 각 컴포넌트가 하나의 역할만 담당하도록 설계
- **장점**: 
  - 코드 재사용성 증가
  - 유지보수 용이
  - 테스트 작성 간편

### 2. 데이터 레이어 분리 (data/, utils/)
- **이유**: 데이터와 로직을 컴포넌트에서 분리
- **장점**:
  - 백엔드 API 연동 시 최소한의 변경
  - 데이터 포맷 변경에 유연하게 대응

### 3. useMemo를 사용한 최적화
- **이유**: 불필요한 재계산 방지
- **장점**:
  - 성능 향상
  - 이벤트가 많아져도 부드러운 렌더링

### 4. 더미 데이터 사용
- **이유**: 백엔드 없이도 프론트엔드 개발 가능
- **장점**:
  - 프론트/백엔드 병렬 개발
  - 실제 API 형식 미리 정의

### 5. Tailwind CSS 사용
- **이유**: 빠른 스타일링과 일관성 유지
- **장점**:
  - CSS 파일 크기 최소화
  - 반응형 디자인 쉽게 구현
  - 다크 테마 적용 간편

---

## 💡 핵심 개념 정리

### React Hooks 사용
- **useState**: 컴포넌트 상태 관리
- **useMemo**: 계산 비용이 큰 작업 최적화
- **useEffect**: 부수 효과 처리 (나중에 API 호출 시 사용)

### Props Drilling 방지
- 현재는 App → 자식 컴포넌트로 props 전달
- 프로젝트가 커지면 Context API나 Zustand 같은 상태관리 라이브러리 고려

### 이벤트 핸들링
- 이벤트 클릭: FullCalendar → CalendarView → App → EventDetailPanel
- 필터 변경: EventFilters → App → CalendarView

---

이제 프로젝트를 실행해보세요! 🎉
