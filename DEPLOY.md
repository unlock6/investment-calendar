# 베타 배포 가이드

## 구조
- **프론트엔드**: Vercel (React + Vite)
- **백엔드**: Railway (Node.js + Express + PostgreSQL)

---

## 1단계: GitHub 저장소 생성

1. https://github.com/new 에서 새 저장소 생성
   - 이름 예: `investment-calendar`
   - **Private** 선택 (API 키 보호)

2. 터미널에서 실행:
```bash
cd investment-calendar
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/[내_아이디]/investment-calendar.git
git push -u origin main
```

> ⚠️ `.env` 파일은 `.gitignore`에 포함되어 있어 자동으로 제외됩니다.

---

## 2단계: Railway (백엔드) 배포

1. https://railway.app 접속 → GitHub 로그인
2. **New Project** → **Deploy from GitHub repo** → `investment-calendar` 선택
3. **Add Service** 두 번:
   - **PostgreSQL** 데이터베이스 추가
   - **GitHub Repo** (backend 폴더) 추가

4. 백엔드 서비스 선택 → **Settings** → **Root Directory**: `backend`

5. **Variables** 탭에서 환경변수 설정:
```
DATABASE_URL        = (PostgreSQL 서비스에서 자동 제공)
PORT                = 5000
FRONTEND_URL        = https://[내_프로젝트].vercel.app  ← Vercel 배포 후 업데이트
CLAUDE_API_KEY      = sk-ant-xxxxx
CLAUDE_MODEL        = claude-3-haiku-20240307
ALPHA_VANTAGE_KEY   = 기존 키
FRED_API_KEY        = 기존 키
BOK_API_KEY         = 기존 키
DART_API_KEY        = 기존 키
```

6. **Deploy** 클릭 → 배포 완료 후 도메인 확인 (예: `xxx.railway.app`)

7. DB 마이그레이션 실행 (Railway 콘솔):
```bash
npx prisma migrate deploy
node seed.js
```

---

## 3단계: Vercel (프론트엔드) 배포

1. https://vercel.com 접속 → GitHub 로그인
2. **New Project** → `investment-calendar` 저장소 선택
3. 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (기본값)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables** 추가:
```
VITE_API_URL = https://[Railway 백엔드 도메인]
```
예: `VITE_API_URL = https://investment-calendar-backend.railway.app`

5. **Deploy** 클릭!

---

## 4단계: 최종 연결

- Vercel 배포 완료 후 URL 확인 (예: `investment-calendar.vercel.app`)
- Railway 백엔드로 돌아가 `FRONTEND_URL` 환경변수 업데이트
- Railway 재배포

---

## 베타 테스터 공유

완료되면 아래 링크만 공유하면 끝!
```
https://investment-calendar.vercel.app
```
