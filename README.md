# 투자 이벤트 캘린더 MVP

초개인화 투자 이벤트 캘린더의 프론트엔드 MVP입니다.

## 🚀 설치 및 실행

### 1. 패키지 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 3. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 📁 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Calendar/       # 캘린더 관련 컴포넌트
│   │   ├── CalendarView.jsx        # FullCalendar 래핑
│   │   └── EventDetailPanel.jsx    # 이벤트 상세 패널
│   └── Filters/        # 필터 관련 컴포넌트
│       └── EventFilters.jsx        # 타입별 필터 버튼
├── data/               # 데이터 (나중에 API로 교체)
│   └── mockEvents.js   # 더미 이벤트 데이터
├── utils/              # 유틸리티 함수
│   └── eventHelpers.js # 이벤트 포매팅, 필터링 등
├── styles/             # 스타일 파일
│   └── index.css       # Tailwind + FullCalendar 커스텀
├── App.jsx             # 메인 컴포넌트
└── main.jsx            # 앱 진입점
```

## 🎯 주요 기능

- ✅ 월간/주간 캘린더 뷰
- ✅ 이벤트 타입별 색상 구분 (Macro, Stock, Crypto)
- ✅ 필터 기능 (전체/Macro/Stock/Crypto)
- ✅ 이벤트 클릭 시 상세 정보 패널
- ✅ 다크 테마 UI
- ✅ 반응형 디자인

## 🔧 백엔드 연동 준비사항

현재는 `src/data/mockEvents.js`의 더미 데이터를 사용합니다.
백엔드 API 연동 시 다음과 같이 수정하세요:

### App.jsx 수정 예시
```javascript
import { useState, useEffect } from 'react';

function App() {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    // API에서 이벤트 가져오기
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        const formatted = formatEventsForCalendar(data);
        setEvents(formatted);
      });
  }, []);
  
  // ...
}
```

### EventDetailPanel.jsx 수정 예시
```javascript
const handleAddToCalendar = async () => {
  try {
    await fetch('/api/user/events', {
      method: 'POST',
      body: JSON.stringify({ eventId: event.id })
    });
    alert('캘린더에 추가되었습니다!');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🎨 커스터마이징

### 색상 변경
`src/styles/index.css`에서 다음 클래스 수정:
- `.event-macro` - Macro 이벤트 색상
- `.event-stock` - Stock 이벤트 색상
- `.event-crypto` - Crypto 이벤트 색상

### 필터 추가
1. `src/data/mockEvents.js`에 새 타입 추가
2. `src/components/Filters/EventFilters.jsx`에 필터 버튼 추가
3. `src/utils/eventHelpers.js`에 색상 클래스 추가
4. `src/styles/index.css`에 스타일 정의

## 📦 사용된 라이브러리

- React 18
- Vite (빌드 도구)
- FullCalendar (캘린더 라이브러리)
- Tailwind CSS (스타일링)

## 📝 추가 개발 계획

- [ ] 백엔드 API 연동
- [ ] 사용자 인증
- [ ] 이벤트 검색 기능
- [ ] 알림 설정
- [ ] 모바일 앱 (React Native)
