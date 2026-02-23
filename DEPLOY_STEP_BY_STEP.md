# 배포 순서 (처음부터 차근차근)

---

## ✅ 완료된 것
- Railway 백엔드: 정상 실행 중
- PostgreSQL: 정상 실행 중

---

## 🔧 지금 해야 할 것

### 1. Railway - FRONTEND_URL 확인
Railway → 백엔드 서비스 → **Variables** 탭에서
아래 값이 정확히 있는지 확인:

```
FRONTEND_URL = https://investment-calendar-smoky.vercel.app
```

없으면 추가. 있으면 그냥 넘어가기.

---

### 2. Vercel 프로젝트 삭제
1. https://vercel.com 접속
2. `investment-calendar` 프로젝트 클릭
3. **Settings** 탭 클릭
4. 스크롤 맨 아래 → **Delete Project** 클릭
5. 프로젝트 이름 입력하고 삭제 확인

---

### 3. Vercel 새로 배포
1. https://vercel.com/new 접속
2. `investment-calendar` GitHub 저장소 선택
3. **"Environment Variables"** 섹션 찾기 (Deploy 버튼 위에 있음)
4. 아래 값 입력:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://investment-calendar-production.up.railway.app`
5. **Add** 클릭
6. **Deploy** 클릭

---

### 4. 배포 완료 후
- Vercel에서 새 URL 확인 (예: `investment-calendar-xxx.vercel.app`)
- 사이트 열어서 확인

---

> ⚠️ 3번에서 Environment Variables를 **Deploy 버튼 누르기 전에** 반드시 입력해야 함
