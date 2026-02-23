# 백엔드 추가 완벽 가이드

기존 React 프론트엔드 프로젝트에 Node.js 백엔드를 추가하는 방법입니다.

## 📋 사전 준비사항

- ✅ Node.js (v18 이상)
- ✅ PostgreSQL (v14 이상)
- ✅ 기존 프론트엔드 프로젝트 정상 동작 중

---

## 🚀 1단계: PostgreSQL 설치 및 데이터베이스 생성

### Windows:

```powershell
# 1. PostgreSQL 다운로드 및 설치
# https://www.postgresql.org/download/windows/

# 2. pgAdmin 또는 psql로 데이터베이스 생성
psql -U postgres

CREATE DATABASE investment_calendar;
\q
```

### Mac (Homebrew):

```bash
# PostgreSQL 설치
brew install postgresql@14
brew services start postgresql@14

# 데이터베이스 생성
createdb investment_calendar
```

### Linux (Ubuntu):

```bash
# PostgreSQL 설치
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL 시작
sudo systemctl start postgresql

# 데이터베이스 생성
sudo -u postgres createdb investment_calendar
```

---

## 📁 2단계: 백엔드 폴더 구조 생성

```bash
# 현재 위치: investment-calendar (프론트엔드 루트)

# 백엔드 폴더 생성
mkdir backend
cd backend

# 폴더 구조 생성
mkdir -p src/routes src/controllers src/services src/scheduler prisma
```

---

## 📦 3단계: 백엔드 파일 복사

제가 생성한 파일들을 다음 위치에 복사하세요:

```
backend/
├── package.json                           ✅
├── .env                                   ✅ (수정 필요)
├── .env.example                           ✅
├── .gitignore                             ✅
├── README.md                              ✅
├── prisma/
│   └── schema.prisma                      ✅
└── src/
    ├── app.js                             ✅
    ├── routes/
    │   └── events.js                      ✅
    ├── controllers/
    │   └── eventController.js             ✅
    ├── services/
    │   └── personalizationService.js      ✅
    └── scheduler/
        └── notifyJob.js                   ✅
```

---

## ⚙️ 4단계: 환경 설정

### `.env` 파일 수정

```bash
# backend/.env 파일을 열어서 본인의 PostgreSQL 정보 입력

DATABASE_URL="postgresql://postgres:your_password@localhost:5432/investment_calendar?schema=public"
#                         ↑사용자    ↑비밀번호        ↑포트    ↑DB이름

PORT=5000
FRONTEND_URL=http://localhost:5173
```

**주의사항:**
- `postgres`: PostgreSQL 사용자명 (기본값)
- `your_password`: PostgreSQL 설치 시 설정한 비밀번호
- `5432`: PostgreSQL 포트 (기본값)
- `investment_calendar`: 1단계에서 만든 DB 이름

---

## 📥 5단계: 패키지 설치

```bash
# 백엔드 폴더에서 실행
cd backend

npm install
```

설치되는 패키지:
- express (웹 서버)
- @prisma/client (ORM)
- cors (CORS 처리)
- node-cron (스케줄러)
- dotenv (환경 변수)
- nodemon (개발 모드 자동 재시작)

---

## 🗄️ 6단계: 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 마이그레이션 실행 (테이블 생성)
npm run prisma:migrate

# 마이그레이션 이름 입력 프롬프트가 나오면:
# 입력: init
```

성공하면 다음 테이블이 생성됩니다:
- `events` - 공개 이벤트
- `user_events` - 사용자가 추가한 이벤트

---

## 🌱 7단계: 샘플 데이터 생성

```bash
# 샘플 이벤트 데이터 시딩
npm run db:seed
```

다음 데이터가 생성됩니다:
- 7개의 샘플 이벤트 (macro, stock, crypto)
- user_id=1에게 high impact 이벤트 자동 추가

---

## 🚀 8단계: 백엔드 서버 실행

```bash
# 개발 모드 실행 (자동 재시작)
npm run dev
```

**성공 메시지:**
```
🚀 Backend server running on http://localhost:5000
📅 Frontend URL: http://localhost:5173
📊 API endpoints:
   - GET  /api/events
   - GET  /api/user-events
   - POST /api/user-events
   - GET  /health
⏰ Starting notification scheduler...
```

---

## 🧪 9단계: API 테스트

### 방법 1: 브라우저에서 테스트

```
http://localhost:5000/api/events
```

### 방법 2: curl 사용

```bash
# 모든 이벤트 조회
curl http://localhost:5000/api/events

# 사용자 이벤트 조회
curl http://localhost:5000/api/user-events?user_id=1

# 이벤트 추가 (POST)
curl -X POST http://localhost:5000/api/user-events \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "userId": 1}'
```

### 방법 3: Prisma Studio (GUI)

```bash
npm run prisma:studio
```

브라우저에서 `http://localhost:5555` 열기

---

## 🔗 10단계: 프론트엔드 연동

### A) `src/App.jsx` 수정

**BEFORE (더미 데이터):**
```jsx
import { mockEvents } from './data/mockEvents';

const formattedEvents = useMemo(() => {
  return formatEventsForCalendar(mockEvents);
}, []);
```

**AFTER (실제 API):**
```jsx
import { useState, useEffect, useMemo } from 'react';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // API에서 이벤트 가져오기
  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching events:', error);
        setLoading(false);
      });
  }, []);

  // FullCalendar 형식으로 변환
  const formattedEvents = useMemo(() => {
    return formatEventsForCalendar(events);
  }, [events]);

  // 필터링
  const filteredEvents = useMemo(() => {
    return filterEventsByType(formattedEvents, activeFilter);
  }, [formattedEvents, activeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      {/* 나머지 코드는 동일 */}
    </div>
  );
}
```

### B) `src/components/Calendar/EventDetailPanel.jsx` 수정

**BEFORE:**
```jsx
const handleAddToCalendar = () => {
  console.log('내 캘린더에 추가:', event);
};
```

**AFTER:**
```jsx
const handleAddToCalendar = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/user-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: parseInt(event.id),
        userId: 1, // 실제로는 로그인한 사용자 ID
        notifyTime: new Date(event.date + 'T12:00:00').toISOString()
      })
    });

    if (response.ok) {
      alert('✅ 내 캘린더에 추가되었습니다!');
      onClose();
    } else {
      const error = await response.json();
      alert(error.error || '추가 실패');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('오류가 발생했습니다.');
  }
};
```

---

## 🎯 11단계: 양쪽 서버 동시 실행

### 터미널 1 - 프론트엔드:
```bash
# 루트 폴더에서
npm run dev
```

### 터미널 2 - 백엔드:
```bash
# backend 폴더에서
cd backend
npm run dev
```

**결과:**
- 프론트: `http://localhost:5173`
- 백엔드: `http://localhost:5000`

---

## ✅ 완료! 테스트 체크리스트

- [ ] 백엔드 서버 정상 실행 (`http://localhost:5000/health` 접속)
- [ ] `/api/events` 호출 시 이벤트 데이터 반환
- [ ] 프론트엔드에서 캘린더에 이벤트 표시
- [ ] 이벤트 클릭 시 상세 패널 열림
- [ ] "내 캘린더에 추가" 버튼 클릭 시 성공 메시지
- [ ] 콘솔에서 1분마다 스케줄러 동작 확인

---

## 🐛 문제 해결

### 1. CORS 에러
```
Access to fetch at 'http://localhost:5000/api/events' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**해결:** backend/src/app.js에서 CORS 설정 확인
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### 2. PostgreSQL 연결 실패
```
Error: P1001: Can't reach database server
```

**해결:**
- PostgreSQL이 실행 중인지 확인
- .env의 DATABASE_URL이 올바른지 확인
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요

### 3. Prisma 에러
```
Error: @prisma/client did not initialize yet
```

**해결:**
```bash
npm run prisma:generate
```

### 4. 포트 충돌
```
Error: listen EADDRINUSE: address already in use :::5000
```

**해결:**
```bash
# .env에서 포트 변경
PORT=5001
```

---

## 📚 다음 단계

1. ✅ 사용자 인증 추가 (JWT)
2. ✅ 실제 알림 기능 (이메일/푸시)
3. ✅ 이벤트 검색 기능
4. ✅ 개인화 알고리즘 개선
5. ✅ 배포 (Vercel + Railway)

---

**축하합니다! 🎉 백엔드 연동이 완료되었습니다!**
