# 사내 통합 인증 로그인 세션 연동 가이드

## 개요
Django 세션에 저장된 사용자 정보를 React에서 읽어와서 로그인 상태를 확인하고, `/sso/acs/` 엔드포인트를 통한 통합 인증 후 자동으로 Dashboard를 표시하는 시스템을 구현합니다.

## 수정이 필요한 파일들과 절차

### 1. Django 백엔드 수정

#### 1-1. backend/views.py - 세션 확인 API 엔드포인트 추가
```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["GET"])
def check_session(request):
    """세션에서 사용자 정보 확인"""
    if 'employee_number' in request.session:
        return JsonResponse({
            'authenticated': True,
            'user': {
                'username': request.session.get('username'),
                'employee_number': request.session.get('employee_number'),
                # 필요한 다른 세션 정보들도 추가
            }
        })
    else:
        return JsonResponse({'authenticated': False})
```

#### 1-2. backend/urls.py - 세션 확인 라우트 추가
```python
from django.urls import path, include
from . import views

urlpatterns = [
    # 기존 URL 패턴들...
    path('api/auth/session/', views.check_session, name='check_session'),
    # SSO 관련 URL들...
    path('sso/', include('your_sso_app.urls')),  # SSO 앱이 있다면
]
```

### 2. React 프론트엔드 수정

#### 2-1. client/src/hooks/useAuth.tsx - 세션 기반 인증으로 변경
기존 토큰 기반 인증을 세션 기반으로 변경:

```typescript
// 기존 코드에서 변경할 부분들:

// 1. useState에서 토큰 대신 세션 상태 관리
const [isSessionChecked, setIsSessionChecked] = useState(false);

// 2. useQuery를 세션 확인 API로 변경
const { data: sessionData, isLoading, error, refetch } = useQuery({
  queryKey: ["/api/auth/session"],
  retry: false,
  refetchOnWindowFocus: true,
  staleTime: 5 * 60 * 1000, // 5분
});

// 3. 세션 체크 완료 상태 업데이트
useEffect(() => {
  if (!isLoading) {
    setIsSessionChecked(true);
  }
}, [isLoading]);

// 4. 로그인 함수 수정 (세션 기반)
const loginMutation = useMutation({
  mutationFn: async (data: LoginRequest) => {
    const response = await apiRequest("POST", "/api/auth/login", data);
    return response.json();
  },
  onSuccess: () => {
    // 토큰 저장 대신 세션 데이터 다시 조회
    refetch();
  },
});

// 5. 로그아웃 함수 수정
const logout = async () => {
  try {
    await apiRequest("POST", "/api/auth/logout", {});
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    queryClient.setQueryData(["/api/auth/session"], { authenticated: false });
    // localStorage 정리는 필요없음 (세션 기반이므로)
  }
};

// 6. Context value 업데이트
const value = {
  user: sessionData?.authenticated ? sessionData.user : null,
  login,
  logout,
  isLoading: isLoading || !isSessionChecked,
  isAuthenticated: sessionData?.authenticated || false,
};
```

#### 2-2. client/src/lib/queryClient.ts - API 요청 함수 수정
세션 기반 요청을 위해 토큰 헤더 제거:

```typescript
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any
): Promise<Response> {
  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      // Authorization 헤더 제거 (세션 기반이므로)
    },
    credentials: 'include', // 쿠키/세션을 포함하여 요청
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, config);
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
  
  return response;
}
```

#### 2-3. client/src/App.tsx - 라우팅 로직 수정
SSO 로그인 후 자동 리다이렉션 처리:

```typescript
import { useEffect } from 'react';
import { useLocation } from 'wouter';

function App() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // SSO 로그인 후 Dashboard로 자동 리다이렉션
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isDashboard = urlParams.get('dashboard');
    
    if (isDashboard === 'true' && isAuthenticated && !isLoading) {
      setLocation('/dashboard');
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // 기존 라우팅 로직...
}
```

### 3. Express 프록시 서버 수정

#### 3-1. server/index.ts - 쿠키 전달 설정 추가
세션 쿠키가 올바르게 전달되도록 프록시 설정 수정:

```typescript
// 프록시 설정에 쿠키 전달 옵션 추가
app.use(['/api/*', '/sso/*'], async (req, res) => {
  try {
    const targetUrl = `http://localhost:8000${req.originalUrl}`;
    
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // 쿠키 헤더 전달
    if (req.headers.cookie) {
      headers.Cookie = req.headers.cookie;
    }

    const fetchOptions: any = {
      method: req.method,
      headers,
    };

    if (req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // Django에서 온 쿠키를 클라이언트로 전달
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      res.setHeader('Set-Cookie', setCookieHeader);
    }

    const data = await response.text();
    res.status(response.status).send(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});
```

### 4. Django 설정 수정

#### 4-1. backend/settings.py - 세션 및 CORS 설정
```python
# 세션 설정
SESSION_COOKIE_AGE = 7 * 24 * 60 * 60  # 7일
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # 개발환경에서는 False

# CORS 설정 (django-cors-headers 사용 시)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5000",  # Express 프록시 서버
    "http://localhost:5173",  # Vite 개발 서버
]
```

## 구현 순서

1. **Django 백엔드 수정** (1-1, 1-2)
2. **Express 프록시 서버 수정** (3-1)
3. **React 인증 훅 수정** (2-1, 2-2)
4. **React 앱 라우팅 수정** (2-3)
5. **Django 설정 최종 확인** (4-1)

## 테스트 시나리오

1. `/sso/acs/` 엔드포인트를 통해 통합 인증 로그인
2. Django 세션에 `employee_number`가 저장됨
3. `/?dashboard=true`로 리다이렉션
4. React에서 세션 확인 API 호출
5. 세션이 있으면 자동으로 Dashboard 페이지 표시
6. 세션이 없으면 LoginModal 표시

## 주의사항

- 세션 기반 인증으로 변경되므로 기존 토큰 관련 로직은 모두 제거
- 쿠키/세션이 올바르게 전달되도록 프록시 설정 중요
- CORS 설정에서 `credentials: 'include'` 옵션 필수
- 개발환경과 프로덕션환경의 쿠키 보안 설정 차이 고려