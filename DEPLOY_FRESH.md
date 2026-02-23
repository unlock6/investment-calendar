# 처음부터 배포 가이드

## 시작 전 — Railway, Vercel 기존 프로젝트 전부 삭제

---

## STEP 1: GitHub push

터미널에서:
```
cd investment-calendar
git add .
git commit -m "deploy ready"
git push
```

---

## STEP 2: Railway 배포

1. https://railway.app 접속 → 로그인
2. **New Project** 클릭
3. **Deploy from GitHub repo** → `investment-calendar` 선택
4. 배포 시작되면 잠깐 대기

### PostgreSQL 추가
5. 화면 빈 공간 우클릭 또는 **+ Add Service** 클릭
6. **Database** → **Add PostgreSQL** 클릭

### 백엔드 서비스 설정
7. 백엔드 서비스(investment-calendar) 클릭
8. **Settings** 탭 → **Root Directory** → `backend` 입력 후 저장
9. **Settings** 탭 → **Start Command** → 아래 내용으로 변경:
```
npx prisma migrate deploy && node seed.js && node src/app.js
```

### 환경변수 설정
10. **Variables** 탭 → 아래 값들 추가:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `PORT` | `5000` |
| `CLAUDE_API_KEY` | (기존 .env 파일에서 복사) |
| `CLAUDE_MODEL` | `claude-3-haiku-20240307` |
| `ALPHA_VANTAGE_KEY` | (기존 값) |
| `FRED_API_KEY` | (기존 값) |
| `BOK_API_KEY` | (기존 값) |
| `DART_API_KEY` | (기존 값) |

11. 저장 → 자동 재배포 대기
12. **Settings** → **Networking** → **Generate Domain** 클릭
13. 생성된 도메인 복사 (예: `investment-calendar-xxx.railway.app`)

---

## STEP 3: Vercel 배포

1. https://vercel.com/new 접속 → 로그인
2. `investment-calendar` GitHub 저장소 선택
3. **Environment Variables** 섹션에서 추가:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://investment-calendar-xxx.railway.app` (위에서 복사한 Railway 도메인) |

4. **Deploy** 클릭
5. 완료되면 Vercel URL 확인 (예: `investment-calendar-xxx.vercel.app`)

---

## STEP 4: 완료 확인

브라우저에서 Vercel URL 접속 → 캘린더 데이터 정상 표시되면 성공!

---

> ⚠️ 주의사항
> - STEP 2의 환경변수는 .env 파일에서 복사
> - `DATABASE_URL`은 `${{Postgres.DATABASE_URL}}` 그대로 입력 (자동 연결됨)
> - STEP 3에서 Railway 도메인을 정확히 복사해서 붙여넣기
