# Investment Calendar Backend

Express + Prisma + PostgreSQL 백엔드 API

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── app.js                          # Express 앱 진입점
│   ├── routes/
│   │   └── events.js                   # API 라우트 정의
│   ├── controllers/
│   │   └── eventController.js          # 비즈니스 로직
│   ├── services/
│   │   └── personalizationService.js   # 개인화 서비스
│   └── scheduler/
│       └── notifyJob.js                # 알림 스케줄러 (node-cron)
├── prisma/
│   └── schema.prisma                   # DB 스키마
├── .env                                # 환경 변수 (gitignore)
├── .env.example                        # 환경 변수 템플릿
└── package.json
```

## 🚀 설치 및 실행

### 1. 환경 설정

```bash
# .env 파일 생성 (.env.example 복사)
cp .env.example .env

# .env 파일 수정 (PostgreSQL 정보 입력)
DATABASE_URL="postgresql://username:password@localhost:5432/investment_calendar?schema=public"
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 마이그레이션 실행 (테이블 생성)
npm run prisma:migrate

# 샘플 데이터 시딩
npm run db:seed
```

### 4. 서버 실행

```bash
# 개발 모드 (nodemon - 자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:5000`에서 실행됩니다.

## 📡 API 엔드포인트

### 1. GET /api/events
모든 공개 이벤트 조회 (프론트엔드 캘린더용)

**응답:**
```json
[
  {
    "id": "1",
    "title": "Fed 금리 결정",
    "date": "2026-02-18",
    "type": "macro",
    "impact_level": "high",
    "description": "..."
  }
]
```

### 2. GET /api/user-events?user_id=1
특정 사용자가 추가한 이벤트 조회

**응답:**
```json
[
  {
    "id": "1",
    "title": "Fed 금리 결정",
    "date": "2026-02-18",
    "type": "macro",
    "impact_level": "high",
    "notify_time": "2026-02-18T13:00:00Z",
    "user_event_id": 5
  }
]
```

### 3. POST /api/user-events
사용자 캘린더에 이벤트 추가

**요청:**
```json
{
  "eventId": 1,
  "userId": 1,
  "notifyTime": "2026-02-18T13:00:00Z"
}
```

**응답:**
```json
{
  "message": "Event added to calendar",
  "userEvent": {
    "id": 5,
    "event": {
      "id": 1,
      "title": "Fed 금리 결정",
      "date": "2026-02-18"
    }
  }
}
```

### 4. DELETE /api/user-events/:id
사용자 캘린더에서 이벤트 제거

## 🔧 유용한 명령어

```bash
# Prisma Studio 실행 (DB GUI)
npm run prisma:studio

# 새로운 마이그레이션 생성
npx prisma migrate dev --name your_migration_name

# DB 초기화 (주의: 모든 데이터 삭제)
npx prisma migrate reset

# 샘플 데이터 다시 생성
npm run db:seed
```

## ⏰ 스케줄러

### 알림 스케줄러 (notifyJob.js)
- **실행 주기**: 1분마다
- **동작**: notify_time이 현재 시간보다 이전인 이벤트를 찾아 콘솔에 출력
- **실제 서비스**: 이메일, 푸시 알림, SMS 등으로 확장 가능

## 🗄️ 데이터베이스 스키마

### events 테이블
- id (PK)
- title
- event_type (macro/stock/crypto)
- datetime
- impact_level
- tags (JSON)
- description

### user_events 테이블
- id (PK)
- user_id
- event_id (FK → events)
- notify_time
- Unique 제약: (user_id, event_id)

## 🔗 프론트엔드 연동

프론트엔드 `App.jsx` 수정:

```javascript
// BEFORE
import { mockEvents } from './data/mockEvents';

// AFTER
const [events, setEvents] = useState([]);

useEffect(() => {
  fetch('http://localhost:5000/api/events')
    .then(res => res.json())
    .then(data => {
      const formatted = formatEventsForCalendar(data);
      setEvents(formatted);
    });
}, []);
```

## 🐛 문제 해결

### PostgreSQL 연결 오류
- PostgreSQL이 실행 중인지 확인
- .env의 DATABASE_URL이 올바른지 확인

### 포트 충돌
```bash
# .env 파일에서 포트 변경
PORT=5001
```

### Prisma 에러
```bash
# Prisma 클라이언트 재생성
npm run prisma:generate
```
