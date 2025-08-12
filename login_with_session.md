# 사내 통합 인증 로그인 세션 연동 가이드

## 개요
Django 세션에 저장된 사용자 정보를 React에서 읽어와서 로그인 상태를 확인하고, `/sso/acs/` 엔드포인트를 통한 통합 인증 후 자동으로 Dashboard를 표시하는 시스템을 구현합니다.

**현재 상태 분석**: Django views.py에서 이미 하이브리드 방식(세션 + 가짜 토큰)을 사용하고 있어, 실제 인증은 세션 기반으로 처리되고 있습니다.

## 수정이 필요한 파일들과 절차

### 1. Django 백엔드 수정

#### 1-1. backend/api/views.py - 세션 확인 API 엔드포인트 추가
**현재 상태**: `current_user_view` 함수가 이미 세션 기반 인증을 사용하고 있음
```python
# 기존 current_user_view 함수를 세션 확인용으로 활용 가능
@api_view(['GET'])
@permission_classes([AllowAny])
def session_check_view(request):
    """세션에서 사용자 정보 확인 (SSO 통합인증용)"""
    employee_id = request.session.get('employee_id')
    if not employee_id:
        return Response({'authenticated': False}, status=status.HTTP_200_OK)
    
    try:
        employee = Employee.objects.get(id=employee_id)
        return Response({
            'authenticated': True,
            'user': {
                'id': employee.id,
                'username': employee.username,
                'employee_number': employee.employee_number,
                'auth': employee.auth
            }
        })
    except Employee.DoesNotExist:
        return Response({'authenticated': False}, status=status.HTTP_200_OK)
```

#### 1-2. backend/api/urls.py - 세션 확인 라우트 추가
```python
# urls.py에 새로운 엔드포인트 추가
urlpatterns = [
    # 기존 URL 패턴들...
    path('auth/session/', views.session_check_view, name='session_check'),
    # 기존 current_user_view는 유지 (토큰 방식 호환성을 위해)
    path('auth/me/', views.current_user_view, name='current_user'),
]
```

### 2. React 프론트엔드 수정

#### 2-1. client/src/hooks/useAuth.tsx - 토큰 관리 제거 및 세션 기반으로 단순화
**현재 상태**: 이미 하이브리드 방식이므로 토큰 관리만 제거하면 됨

```typescript
// 주요 변경사항:

// 1. 토큰 상태 관리 완전 제거
// const [token, setToken] = useState(localStorage.getItem("authToken")); // 삭제

// 2. useQuery를 세션 확인 API로 변경
const { data: sessionData, isLoading, error, refetch } = useQuery({
  queryKey: ["/api/auth/session"],  // 기존 "/api/auth/me"에서 변경
  retry: false,
  refetchOnWindowFocus: true,
  staleTime: 5 * 60 * 1000, // 5분
  // enabled: !!token 조건 제거 (항상 실행)
});

// 3. 로그인 뮤테이션 완전 제거 (SSO에서 처리하므로)
// const loginMutation = useMutation({ ... }); // 삭제
// const login = async (data: LoginRequest) => { ... }; // 삭제

// 4. 세션 재확인 함수 추가 (SSO 로그인 후 사용)
const recheckSession = () => {
  refetch();
};

// 5. 로그아웃 함수 단순화
const logout = async () => {
  try {
    await apiRequest("POST", "/api/auth/logout", {});
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    queryClient.setQueryData(["/api/auth/session"], { authenticated: false });
  }
};

// 6. Context value 업데이트 (로그인 함수 제거)
const value = {
  user: sessionData?.authenticated ? sessionData.user : null,
  // login 함수 제거
  logout,
  recheckSession, // SSO 로그인 후 세션 재확인용
  isLoading,
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

## 구현 순서 (현재 상황에 맞게 수정)

### **단계별 구현 순서:**

1. **Django 세션 확인 API 추가** (1-1, 1-2)
   - 새로운 `/api/auth/session` 엔드포인트 생성
   
2. **React useAuth 토큰 로직 제거** (2-1, 2-2)
   - 토큰 상태 관리 완전 제거
   - 로그인 뮤테이션 제거 (SSO가 대신 처리)
   
3. **React 자동 리다이렉션 추가** (2-3)
   - `/?dashboard=true` 파라미터 감지 로직
   
4. **Express 프록시 쿠키 전달 확인** (3-1)
   - 이미 설정되어 있을 가능성 높음

### **간소화된 이유:**
- 현재 Django에서 이미 세션 기반 인증 사용 중
- 토큰은 프론트엔드 호환용 가짜 토큰
- SSO 통합인증이 세션에 정보 저장 예정

## 테스트 시나리오

1. **SSO 통합인증**: `/sso/acs/` 엔드포인트를 통해 로그인
2. **세션 저장**: Django 세션에 `employee_id`, `employee_number` 등 저장
3. **자동 리다이렉션**: `/?dashboard=true`로 이동
4. **세션 확인**: React에서 `/api/auth/session` 호출
5. **자동 대시보드**: 세션이 있으면 Dashboard 자동 표시
6. **LoginModal 표시**: 세션이 없으면 LoginModal 표시

## 현재 구조의 장점

- **점진적 마이그레이션**: 기존 토큰 방식과 호환성 유지
- **실제 보안**: 서버에서는 세션으로 인증 처리
- **SSO 친화적**: 통합인증 시스템과 자연스럽게 연동
- **간단한 구현**: 기존 코드를 크게 변경하지 않고 적용 가능

## 주의사항

- **기존 토큰 로직 완전 제거**: localStorage 관련 코드 모두 삭제
- **쿠키 전달 확인**: Express 프록시에서 세션 쿠키 올바른 전달 확인  
- **CORS 설정**: `credentials: 'include'` 옵션으로 쿠키 포함 요청
- **SSO 연동 테스트**: 통합인증 후 세션 정보가 올바르게 저장되는지 확인