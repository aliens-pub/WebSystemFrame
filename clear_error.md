# 502 Bad Gateway(nginx) 에러 해결 가이드

## 개요

"502 Bad Gateway(nginx)" 에러는 프록시 서버(nginx 또는 Express 프록시)가 백엔드 서버로부터 유효한 응답을 받지 못할 때 발생합니다. 현재 프로젝트 구조에서는 Express 프록시(포트 5000)가 Django(포트 8000) 또는 Vite(포트 5173) 서버와 통신하지 못할 때 이 에러가 나타납니다.

## 1. 즉시 점검 사항

### 1.1 서버 상태 확인
```bash
# 실행 중인 포트 확인
netstat -tulpn | grep :5000  # 프록시 서버
netstat -tulpn | grep :8000  # Django 서버
netstat -tulpn | grep :5173  # Vite 서버

# 또는 Replit 환경에서
ps aux | grep python    # Django 프로세스 확인
ps aux | grep node      # Express 프록시 및 Vite 프로세스 확인
```

### 1.2 서버 재시작
```bash
# 전체 서버 재시작
npm run dev

# 개별 서버 확인이 필요한 경우
python start_django.py    # Django만 실행
npx vite --host 0.0.0.0   # Vite만 실행
```

## 2. 점검해야 할 파일들

### 2.1 Express 프록시 서버 설정
**파일: `server/index.ts`**

```typescript
// 다음 항목들을 점검:

1. Django 프록시 설정이 올바른지 확인
app.use('/api/*', async (req, res) => {
  const targetUrl = `http://localhost:8000${req.url}`;
  // Django 서버 연결 상태 확인
});

2. Vite 프록시 설정 확인
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true,
}));

3. 서버 시작 순서 확인
setTimeout(() => {
  // 프록시 서버는 Django/Vite 시작 후에 실행되어야 함
}, 5000);
```

**점검 사항:**
- Django 서버가 완전히 시작되기 전에 프록시가 요청을 보내는지 확인
- `localhost:8000`, `localhost:5173` 주소가 정확한지 확인
- 타임아웃 설정이 적절한지 확인

### 2.2 Django 백엔드 설정
**파일: `backend/business_system/settings.py`**

```python
# 다음 설정들을 점검:

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    # Replit 도메인도 추가해야 함
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5000",
    "http://localhost:5173",
    # Replit 도메인도 추가
]

# 데이터베이스 연결 확인
DATABASES = {
    'default': dj_database_url.parse(os.environ.get("DATABASE_URL"))
}
```

**파일: `backend/business_system/urls.py`**

```python
# URL 패턴이 올바른지 확인
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('app.urls')),  # API 경로 확인
]
```

### 2.3 Django 앱 URL 설정
**파일: `backend/app/urls.py`**

```python
# API 엔드포인트가 올바르게 정의되어 있는지 확인
urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/me/', views.get_current_user, name='current_user'),
    # 기타 API 엔드포인트들...
]
```

### 2.4 환경 변수 파일
**파일: `.env` (프로젝트 루트)**

```env
# 필수 환경 변수들이 설정되어 있는지 확인
DATABASE_URL=postgresql://...
NODE_ENV=development
```

### 2.5 Django 실행 스크립트
**파일: `start_django.py`**

```python
# Django 서버 실행 명령이 올바른지 확인
cmd = [sys.executable, 'manage.py', 'runserver', '0.0.0.0:8000']

# 현재 디렉토리가 올바른지 확인
os.chdir('backend')
```

## 3. 일반적인 원인별 해결책

### 3.1 Django 서버 시작 실패
**원인:**
- 데이터베이스 연결 오류
- 포트 8000 이미 사용 중
- Python 의존성 문제

**해결책:**
```bash
cd backend
python manage.py check        # Django 설정 검증
python manage.py runserver    # Django 단독 실행 테스트
pip install -r requirements.txt  # 의존성 재설치
```

### 3.2 Vite 서버 시작 실패
**원인:**
- Node.js 의존성 문제
- 포트 5173 이미 사용 중
- 빌드 오류

**해결책:**
```bash
npm install              # 의존성 재설치
npx vite --host 0.0.0.0  # Vite 단독 실행 테스트
npm run build            # 빌드 테스트
```

### 3.3 프록시 서버 라우팅 오류
**원인:**
- API 경로 매칭 오류 (`/api/*` vs `/api/`)
- 백엔드 서버 응답 지연
- CORS 설정 문제

**해결책:**
```typescript
// server/index.ts에서 더 상세한 에러 핸들링 추가
app.use('/api', async (req, res) => {
  try {
    const response = await fetch(`http://localhost:8000/api${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    
    if (!response.ok) {
      console.error(`Django 응답 오류: ${response.status}`);
    }
    
    // 응답 전달...
  } catch (error) {
    console.error('Django 서버 연결 실패:', error);
    res.status(502).json({ error: 'Backend server unavailable' });
  }
});
```

## 4. 디버깅 단계별 가이드

### 4.1 1단계: 개별 서버 상태 확인
```bash
# Django 서버 테스트
curl http://localhost:8000/api/auth/me

# Vite 서버 테스트
curl http://localhost:5173/

# 프록시 서버 테스트
curl http://localhost:5000/api/auth/me
```

### 4.2 2단계: 로그 확인
```bash
# Django 로그 (콘솔에서 확인)
# Express 프록시 로그 (콘솔에서 확인)
# 브라우저 개발자 도구 네트워크 탭
```

### 4.3 3단계: 설정 파일 검증
- CORS 설정이 프록시 도메인을 허용하는지
- URL 패턴이 올바른지
- 환경 변수가 로드되는지

### 4.4 4단계: 순차적 재시작
```bash
# 1. Django 종료 후 재시작
pkill -f "python.*manage.py"
python start_django.py

# 2. Vite 재시작
pkill -f "vite"
npx vite --host 0.0.0.0

# 3. 프록시 서버 재시작
npm run dev
```

## 5. Replit 환경 특화 점검사항

### 5.1 포트 바인딩 확인
```python
# Django settings.py에서
# 0.0.0.0으로 바인딩되어 있는지 확인
```

### 5.2 도메인 설정
```python
# ALLOWED_HOSTS에 Replit 도메인 추가
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'your-repl-name.replit.dev',
    'your-repl-name.replit.app',
]
```

### 5.3 워크플로우 재시작
Replit의 "Start application" 워크플로우가 제대로 실행되고 있는지 확인

## 6. 예방 조치

### 6.1 헬스체크 엔드포인트 추가
```python
# backend/app/views.py
def health_check(request):
    return JsonResponse({'status': 'healthy', 'timestamp': timezone.now()})
```

### 6.2 프록시 서버에 재시도 로직 추가
```typescript
// server/index.ts
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Django 서버 연결 시 재시도 로직 구현
```

### 6.3 모니터링 로그 추가
```typescript
// 요청/응답 로깅
console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${response.status}`);
```

## 7. 긴급 복구 명령어

```bash
# 모든 Node.js 프로세스 종료
pkill -f node

# 모든 Python 프로세스 종료
pkill -f python

# 전체 재시작
npm run dev

# 포트 사용 중인 프로세스 강제 종료
sudo lsof -ti:5000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9
```

이 가이드를 따라 단계별로 점검하면 502 Bad Gateway 에러의 원인을 빠르게 파악하고 해결할 수 있습니다.