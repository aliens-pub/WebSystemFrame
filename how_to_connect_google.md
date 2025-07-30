# 구글 OAuth2.0 로그인 연동 가이드 (Django 백엔드)

## 1. 전제 조건
- 구글 개발자 콘솔에서 OAuth 클라이언트 ID와 시크릿 발급 완료
- 승인된 리디렉션 URI 설정: `https://your-replit-domain.replit.dev/accounts/google/login/callback/`

## 2. 환경 변수 설정

프로젝트의 환경 변수에 다음 값들을 추가하세요:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 3. Django 백엔드 구글 OAuth 설정

### 3.1 Django 패키지 설치

```bash
pip install django-allauth
```

### 3.2 Django 설정 파일 수정 (settings.py)

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

# OAuth 리디렉션 설정
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# 환경 변수 설정
GOOGLE_OAUTH2_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')

# CSRF 및 CORS 설정 (React와 분리된 경우)
CSRF_TRUSTED_ORIGINS = [
    'https://your-replit-domain.replit.dev',
]

# CORS 설정 (django-cors-headers 사용 시)
CORS_ALLOWED_ORIGINS = [
    "https://your-replit-domain.replit.dev",
]

CORS_ALLOW_CREDENTIALS = True
```

### 3.3 Django URL 설정 (urls.py)

메인 urls.py에 allauth URL 추가:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # 기존 URL 패턴들...
    path('accounts/', include('allauth.urls')),
]
```

### 3.4 Django 마이그레이션

```bash
python manage.py migrate
```

### 3.5 Django 관리자에서 소셜 애플리케이션 설정

Django 관리자 패널에서 다음 설정:

1. `/admin/` 접속
2. `Social applications` → `Add social application`
3. 다음 정보 입력:
   - Provider: Google
   - Name: Google OAuth
   - Client id: `구글 클라이언트 ID`
   - Secret key: `구글 클라이언트 시크릿`
   - Sites: `example.com` 선택 (기본 사이트)

### 3.6 Django 뷰 수정 (views.py)

구글 로그인 처리를 위한 뷰 추가:

```python
from django.shortcuts import redirect
from django.contrib.auth import login
from django.contrib.auth.models import User
from allauth.socialaccount.models import SocialAccount
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
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
            
            # React 앱으로 리다이렉트
            return redirect('/')
            
        except SocialAccount.DoesNotExist:
            return redirect('/?error=social_account_not_found')
    
    return redirect('/?error=authentication_failed')
```

### 3.7 Django URL 패턴 추가

앱의 urls.py에 추가:

```python
from django.urls import path
from . import views

urlpatterns = [
    # 기존 URL 패턴들...
    path('auth/google/success/', views.google_login_success, name='google_login_success'),
]
```

## 4. Django 모델 수정 (필요한 경우)

Employee 모델에 email 필드가 없다면 추가:

```python
# models.py
class Employee(models.Model):
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True)  # 이 필드 추가
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

## 5. 프론트엔드 구글 로그인 버튼 추가

### 5.1 LoginModal 컴포넌트 수정 (client/src/components/LoginModal.tsx)

기존 로그인 폼 아래에 구글 로그인 버튼 추가:

```tsx
// import 추가
import { FcGoogle } from "react-icons/fc";

// 기존 로그인 폼 아래에 추가
<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">또는</span>
    </div>
  </div>

  <div className="mt-6">
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = '/accounts/google/login/';
      }}
    >
      <FcGoogle className="mr-2 h-4 w-4" />
      구글로 로그인
    </Button>
  </div>
</div>
```

## 6. 리디렉션 URI 설정

### 6.1 개발 환경 (Replit)
구글 개발자 콘솔에서 다음 URI를 승인된 리디렉션 URI에 추가:

```
https://ced818b8-44d5-4f9c-9d49-403d57d2d79b-00-2jpswcpobth6w.worf.replit.dev/accounts/google/login/callback/
```

### 6.2 프로덕션 환경 (배포 후)
배포된 도메인도 추가:
```
https://your-app-name.replit.app/accounts/google/login/callback/
```

## 7. 테스트 및 확인

1. Django 서버 재시작: `python manage.py runserver`
2. 브라우저에서 로그인 페이지 접속
3. "구글로 로그인" 버튼 클릭
4. 구글 인증 페이지로 리다이렉트 확인
5. 구글 로그인 완료 후 기존 로그인 페이지로 리다이렉트 확인
6. Django 관리자에서 생성된 사용자 및 소셜 계정 확인

## 8. 주의사항

- 구글 개발자 콘솔에서 리디렉션 URI를 정확히 설정해야 함
- 프로덕션 배포 시에는 배포된 도메인도 리디렉션 URI에 추가
- 환경 변수가 올바르게 설정되었는지 확인
- HTTPS 환경에서만 정상 작동 (Replit은 기본적으로 HTTPS 제공)

## 9. 에러 해결

### 9.1 일반적인 오류들

**redirect_uri_mismatch:**
- 구글 콘솔의 승인된 리디렉션 URI 설정 확인
- 정확한 도메인과 경로 사용 (`/accounts/google/login/callback/`)

**invalid_client:**
- 클라이언트 ID/시크릿 환경 변수 확인
- 구글 콘솔에서 OAuth 클라이언트 상태 확인

**unauthorized_client:**
- OAuth 동의 화면 설정 완료 여부 확인
- 테스트 사용자 추가 (개발 단계)

**CSRF verification failed:**
- CSRF_TRUSTED_ORIGINS 설정 확인
- CORS 설정 확인

### 9.2 Django 특정 오류들

**Social application not found:**
- Django 관리자에서 소셜 애플리케이션 설정 확인
- Sites 프레임워크 설정 확인

**No such table: socialaccount_socialapp:**
- `python manage.py migrate` 실행

### 9.3 디버깅 팁

- 브라우저 개발자 도구의 네트워크 탭에서 요청 확인
- Django 서버 콘솔 로그 확인
- 환경 변수 출력으로 값 확인 (시크릿 제외)
- 구글 콘솔의 사용량 및 오류 로그 확인

### 9.4 테스트 명령어

**Django 설정 확인:**
```bash
python manage.py shell
>>> from django.conf import settings
>>> print(settings.SOCIALACCOUNT_PROVIDERS)
>>> print(settings.GOOGLE_OAUTH2_CLIENT_ID)  # None이 아닌지 확인
```

**환경 변수 확인:**
```bash
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

## 10. 완성 체크리스트

- [ ] django-allauth 패키지 설치
- [ ] settings.py에 OAuth 설정 추가
- [ ] urls.py에 allauth URL 패턴 추가
- [ ] 마이그레이션 실행
- [ ] Django 관리자에서 소셜 애플리케이션 설정
- [ ] Employee 모델에 email 필드 추가 (필요 시)
- [ ] 프론트엔드에 구글 로그인 버튼 추가
- [ ] 구글 개발자 콘솔에서 리디렉션 URI 설정
- [ ] 환경 변수 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 설정
- [ ] 테스트 실행 및 확인