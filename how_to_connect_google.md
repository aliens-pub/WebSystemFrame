# 구글 OAuth2.0 로그인 연동 가이드

## 1. 전제 조건
- 구글 개발자 콘솔에서 OAuth 클라이언트 ID와 시크릿 발급 완료
- 승인된 리디렉션 URI 설정: `https://your-replit-domain.replit.dev/auth/google/callback`

## 2. 환경 변수 설정

프로젝트의 환경 변수에 다음 값들을 추가하세요:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 3. 백엔드 구글 OAuth 설정

### 3.1 Django 백엔드 설정

#### 3.1.1 Django 패키지 설치

```bash
pip install django-allauth
```

#### 3.1.2 Django 설정 파일 수정 (settings.py)

```python
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
```

#### 3.1.3 Django URL 설정 (urls.py)

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

#### 3.1.4 Django 마이그레이션

```bash
python manage.py migrate
```

#### 3.1.5 Django 관리자에서 소셜 애플리케이션 설정

Django 관리자 페널에서 다음 설정:

1. `/admin/` 접속
2. `Social applications` → `Add social application`
3. 다음 정보 입력:
   - Provider: Google
   - Name: Google OAuth
   - Client id: `구글 클라이언트 ID`
   - Secret key: `구글 클라이언트 시크릿`
   - Sites: `example.com` 선택 (기본 사이트)

#### 3.1.6 Django 뷰 수정 (views.py)

구글 로그인 처리를 위한 뷰 추가:

```python
from django.shortcuts import redirect
from django.contrib.auth import login
from django.contrib.auth.models import User
from allauth.socialaccount.models import SocialAccount
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
def google_login_success(request):
    """구글 로그인 성공 후 처리"""
    if request.user.is_authenticated:
        # 사용자 정보를 기존 Employee 모델과 연동
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
            
            return redirect('/')
            
        except SocialAccount.DoesNotExist:
            return redirect('/login?error=social_account_not_found')
    
    return redirect('/login?error=authentication_failed')
```

#### 3.1.7 Django URL 패턴 추가

앱의 urls.py에 추가:

```python
from django.urls import path
from . import views

urlpatterns = [
    # 기존 URL 패턴들...
    path('auth/google/success/', views.google_login_success, name='google_login_success'),
]
```

### 3.2 Express.js 서버 라우트 수정 (server/routes.ts)

기존 `registerRoutes` 함수에 구글 OAuth 라우트를 추가:

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// 구글 OAuth 전략 설정
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 구글 프로필 정보로 사용자 찾기 또는 생성
    let user = await storage.getUserByEmail(profile.emails?.[0]?.value);
    
    if (!user) {
      // 새 사용자 생성
      user = await storage.createUser({
        username: `google_${profile.id}`,
        email: profile.emails?.[0]?.value || '',
        role: 'EMPLOYEE',
        department: 'GENERAL',
        employee_number: `GOOGLE_${Date.now()}`
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// 구글 OAuth 라우트 추가
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // 성공적으로 인증되면 기존 로그인 페이지로 리다이렉트
    res.redirect('/');
  }
);
```

### 3.2 스토리지 인터페이스 확장 (server/storage.ts)

`IStorage` 인터페이스에 이메일로 사용자 찾기 메서드 추가:

```typescript
export interface IStorage {
  // 기존 메서드들...
  getUserByEmail(email: string): Promise<User | undefined>;
}

// DatabaseStorage 클래스에 구현 추가
export class DatabaseStorage implements IStorage {
  // 기존 메서드들...
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
}
```

### 3.3 스키마 수정 (shared/schema.ts)

users 테이블에 email 필드가 없다면 추가:

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(), // 이 필드 추가
  role: varchar("role", { length: 50 }).notNull().default("EMPLOYEE"),
  department: varchar("department", { length: 100 }).notNull(),
  employee_number: varchar("employee_number", { length: 50 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

## 4. 프론트엔드 구글 로그인 버튼 추가

### 4.1 LoginModal 컴포넌트 수정 (client/src/components/LoginModal.tsx)

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
        // Django 백엔드를 사용하는 경우
        window.location.href = '/accounts/google/login/';
        // Express.js 백엔드를 사용하는 경우 (위의 Express 설정 시)
        // window.location.href = '/auth/google';
      }}
    >
      <FcGoogle className="mr-2 h-4 w-4" />
      구글로 로그인
    </Button>
  </div>
</div>
```

### 4.2 Django 백엔드 사용 시 추가 고려사항

#### 4.2.1 CSRF 토큰 처리

Django와 React가 분리된 경우, CSRF 처리를 위해 다음 설정 추가:

```python
# settings.py
CSRF_TRUSTED_ORIGINS = [
    'https://your-replit-domain.replit.dev',
]

# CORS 설정 (django-cors-headers 사용 시)
CORS_ALLOWED_ORIGINS = [
    "https://your-replit-domain.replit.dev",
]

CORS_ALLOW_CREDENTIALS = True
```

#### 4.2.2 Django 템플릿 대신 API 응답 처리

구글 로그인 성공 후 JSON 응답으로 처리하려면:

```python
# views.py에서 redirect 대신 JSON 응답 사용
from django.http import JsonResponse

@api_view(['GET'])
def google_login_success(request):
    if request.user.is_authenticated:
        try:
            social_account = SocialAccount.objects.get(user=request.user, provider='google')
            employee, created = Employee.objects.get_or_create(
                email=request.user.email,
                defaults={
                    'username': f'google_{social_account.uid}',
                    'employee_number': f'GOOGLE_{social_account.uid}',
                    'role': 'EMPLOYEE',
                    'department': 'GENERAL',
                }
            )
            
            # 세션 설정
            request.session['employee_id'] = employee.id
            request.session['employee_username'] = employee.username
            request.session['employee_role'] = employee.role
            request.session['employee_number'] = employee.employee_number
            
            # React 앱으로 리다이렉트
            return JsonResponse({
                'success': True,
                'user': {
                    'id': employee.id,
                    'username': employee.username,
                    'role': employee.role,
                    'department': employee.department
                }
            })
            
        except SocialAccount.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'social_account_not_found'})
    
    return JsonResponse({'success': False, 'error': 'authentication_failed'})
```

## 5. 데이터베이스 마이그레이션

스키마 변경 후 데이터베이스 업데이트:

```bash
npm run db:push
```

## 6. 세션 설정 확인

### 6.1 Express 세션 미들웨어 설정 (server/routes.ts)

```typescript
import session from 'express-session';

// 세션 미들웨어 추가 (이미 있다면 확인만)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 세션 직렬화/역직렬화
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
```

## 6. Django 모델 수정 (필요한 경우)

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

## 7. 백엔드 선택 및 설정

### 7.1 Django 백엔드 사용 시
- Django allauth 패키지 설치 및 설정
- 구글 로그인 URL: `/accounts/google/login/`
- 관리자 패널에서 소셜 애플리케이션 설정 필요

### 7.2 Express.js 백엔드 사용 시
- Passport.js Google 전략 설정
- 구글 로그인 URL: `/auth/google`
- 환경 변수로만 설정 가능

### 7.3 혼합 사용 시 (권장하지 않음)
두 백엔드를 모두 사용하는 경우 세션 공유 문제가 발생할 수 있으므로, 하나의 백엔드를 선택하여 OAuth를 처리하는 것을 권장합니다.

## 8. 테스트 및 확인

### 8.1 Django 백엔드 사용 시
1. Django 서버 재시작: `python manage.py runserver`
2. 브라우저에서 로그인 페이지 접속
3. "구글로 로그인" 버튼 클릭
4. 구글 인증 페이지로 리다이렉트 확인
5. 구글 로그인 완료 후 기존 로그인 페이지로 리다이렉트 확인
6. Django 관리자에서 생성된 사용자 및 소셜 계정 확인

### 8.2 Express.js 백엔드 사용 시
1. Express 서버 재시작: `npm run dev`
2. 브라우저에서 로그인 페이지 접속
3. "구글로 로그인" 버튼 클릭
4. 구글 인증 페이지로 리다이렉트 확인
5. 구글 로그인 완료 후 기존 로그인 페이지로 리다이렉트 확인
6. 데이터베이스에서 생성된 사용자 확인

## 9. 리디렉션 URI 설정

### 9.1 개발 환경 (Replit)
구글 개발자 콘솔에서 다음 URI들을 승인된 리디렉션 URI에 추가:

**Django 백엔드 사용 시:**
```
https://your-replit-domain.replit.dev/accounts/google/login/callback/
```

**Express.js 백엔드 사용 시:**
```
https://your-replit-domain.replit.dev/auth/google/callback
```

### 9.2 프로덕션 환경 (배포 후)
배포된 도메인도 추가:
```
https://your-app-name.replit.app/accounts/google/login/callback/
https://your-app-name.replit.app/auth/google/callback
```

## 10. 주의사항

- 구글 개발자 콘솔에서 리디렉션 URI를 정확히 설정해야 함
- Django와 Express.js 중 하나의 백엔드만 선택하여 OAuth 처리
- 프로덕션 배포 시에는 배포된 도메인도 리디렉션 URI에 추가
- 환경 변수가 올바르게 설정되었는지 확인
- HTTPS 환경에서만 정상 작동 (Replit은 기본적으로 HTTPS 제공)

## 11. 에러 해결

### 11.1 일반적인 오류들

**redirect_uri_mismatch:**
- 구글 콘솔의 승인된 리디렉션 URI 설정 확인
- 정확한 도메인과 경로 사용 (`/accounts/google/login/callback/` vs `/auth/google/callback`)

**invalid_client:**
- 클라이언트 ID/시크릿 환경 변수 확인
- 구글 콘솔에서 OAuth 클라이언트 상태 확인

**unauthorized_client:**
- OAuth 동의 화면 설정 완료 여부 확인
- 테스트 사용자 추가 (개발 단계)

**CSRF verification failed (Django):**
- CSRF_TRUSTED_ORIGINS 설정 확인
- CORS 설정 확인

### 11.2 Django 특정 오류들

**Social application not found:**
- Django 관리자에서 소셜 애플리케이션 설정 확인
- Sites 프레임워크 설정 확인

**No such table: socialaccount_socialapp:**
- `python manage.py migrate` 실행

### 11.3 Express.js 특정 오류들

**Passport session support required:**
- 세션 미들웨어와 Passport 초기화 순서 확인
- `app.use(passport.session())` 추가 확인

### 11.4 디버깅 팁

- 브라우저 개발자 도구의 네트워크 탭에서 요청 확인
- 서버 콘솔 로그 확인
- 환경 변수 출력으로 값 확인 (시크릿 제외)
- 구글 콘솔의 사용량 및 오류 로그 확인

### 11.5 테스트 명령어

**Django 설정 확인:**
```bash
python manage.py shell
>>> from django.conf import settings
>>> print(settings.SOCIALACCOUNT_PROVIDERS)
```

**Express.js 환경 변수 확인:**
```bash
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```