# 구글 OAuth 자동 로그인 설정 가이드

## 전제 조건
- 구글 개발자 콘솔에서 OAuth 클라이언트 ID와 시크릿 발급 완료

## 원하는 동작
1. 웹페이지 접속 시 로그인 페이지 없이 바로 구글 자동 로그인 실행
2. 로그인 완료되면 Dashboard로 리다이렉트

## 필요한 코드 수정/추가 절차

### 1. Django 패키지 설치

```bash
pip install django-allauth
```

### 2. Django settings.py 수정

```python
import os

# INSTALLED_APPS에 추가
INSTALLED_APPS = [
    # 기존 앱들...
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
]

# 사이트 ID 설정
SITE_ID = 1

# 인증 백엔드 설정
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# 구글 OAuth 설정
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'OAUTH_PKCE_ENABLED': True,
    }
}

# 리다이렉트 설정 - Dashboard로 바로 이동
LOGIN_REDIRECT_URL = '/?dashboard=true'
LOGOUT_REDIRECT_URL = '/'

# 환경 변수 설정
GOOGLE_OAUTH2_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
```

### 3. Django 메인 urls.py 수정

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # 기존 URL 패턴들...
    path('accounts/', include('allauth.urls')),
]
```

### 4. Django 마이그레이션 실행

```bash
python manage.py migrate
```

### 5. Express 프록시 서버 수정 (server/index.ts)

기존 `/api/*` 프록시를 `/api/*`와 `/accounts/*` 모두 처리하도록 수정:

```typescript
// Manual proxy for API requests and accounts (OAuth) to preserve prefix
app.use(['/api/*', '/accounts/*'], async (req, res) => {
  try {
    const targetUrl = `http://localhost:8000${req.originalUrl}`;
    console.log('Proxying request:', req.originalUrl, 'to', targetUrl);
    
    // Forward all headers including cookies
    const headers: any = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Accept': 'application/json'
    };
    
    // Forward authorization and cookie headers
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers.cookie) {
      headers['Cookie'] = req.headers.cookie;
    }
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.text();
    res.status(response.status);
    
    // Forward response headers including set-cookie
    const responseHeaders = Object.fromEntries(response.headers.entries());
    res.set(responseHeaders);
    
    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});
```

### 6. App.tsx 수정 - 자동 구글 로그인 리다이렉트

```tsx
// client/src/App.tsx
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 바로 구글 로그인으로 리다이렉트
  if (!isAuthenticated) {
    window.location.href = '/accounts/google/login/';
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">구글 로그인으로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 인증된 경우 Dashboard 표시
  return (
    <div className="min-h-screen w-full">
      <Router>
        <Header />
        <main className="p-4">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/menu1" component={Menu1} />
            <Route path="/menu2" component={Menu2} />
            <Route path="/menu3" component={Menu3} />
            <Route path="/menu4" component={Menu4} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </Router>
    </div>
  );
}
```

### 7. Django 구글 로그인 성공 처리 뷰 추가 (api/views.py)

```python
from django.shortcuts import redirect
from django.contrib.auth import login
from allauth.socialaccount.models import SocialAccount
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Employee

@api_view(['GET'])
def google_login_success(request):
    """구글 로그인 성공 후 처리"""
    if request.user.is_authenticated:
        try:
            social_account = SocialAccount.objects.get(user=request.user, provider='google')
            
            # Employee 객체 찾기 또는 생성
            employee, created = Employee.objects.get_or_create(
                email=request.user.email,
                defaults={
                    'username': f'google_{social_account.uid}',
                    'employee_number': f'GOOGLE_{social_account.uid}',
                    'role': 'EMPLOYEE',
                    'department': 'GENERAL',
                }
            )
            
            # 세션에 employee 정보 저장
            request.session['employee_id'] = employee.id
            request.session['employee_username'] = employee.username
            request.session['employee_role'] = employee.role
            request.session['employee_number'] = employee.employee_number
            
            # Dashboard로 리다이렉트
            return redirect('/?dashboard=true')
            
        except SocialAccount.DoesNotExist:
            return redirect('/?error=social_account_not_found')
    
    return redirect('/?error=authentication_failed')
```

### 8. Django URL 패턴 추가 (api/urls.py)

```python
from django.urls import path
from . import views

urlpatterns = [
    # 기존 URL 패턴들...
    path('auth/google/success/', views.google_login_success, name='google_login_success'),
]
```

### 9. Employee 모델 수정 (필요한 경우)

Employee 모델에 email 필드가 없다면 추가:

```python
# api/models.py
class Employee(models.Model):
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True)  # 추가 필요
    role = models.CharField(max_length=50, default='EMPLOYEE')
    department = models.CharField(max_length=100)
    employee_number = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

마이그레이션 실행:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 10. Django Admin에서 소셜 애플리케이션 설정

1. `http://localhost:8000/admin/` 접속
2. `Social applications` → `Add social application`
3. 다음 정보 입력:
   - Provider: Google
   - Name: Google OAuth
   - Client id: 구글 클라이언트 ID
   - Secret key: 구글 클라이언트 시크릿
   - Sites: `example.com` 선택

### 11. 환경 변수 설정

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 12. 구글 개발자 콘솔에서 리디렉션 URI 설정

승인된 리디렉션 URI에 추가:
```
https://your-domain.replit.dev/accounts/google/login/callback/
```

## 실행 순서

1. 위 모든 설정 완료 후 서버 재시작
2. `http://localhost:5000` 접속
3. 자동으로 구글 로그인 페이지로 리다이렉트
4. 구글 인증 완료 후 Dashboard 표시

## 주의사항

- 프록시 서버 설정을 반드시 수정해야 `/accounts/*` 요청이 Django로 전달됨
- 환경 변수가 올바르게 설정되어야 함
- HTTPS 환경에서만 정상 작동 (Replit은 기본 HTTPS 제공)