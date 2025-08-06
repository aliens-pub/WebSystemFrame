# 구글 OAuth 8000포트 리다이렉트 구현 가이드

## 현재 상황 분석

### 현재 아키텍처
- **포트 5000**: Express 프록시 서버 (메인 접속점)
- **포트 8000**: Django 백엔드 (구글 OAuth 구현됨)
- **포트 5173**: Vite React 개발 서버

### 현재 로그인 플로우
1. `http://localhost:5000` 접속
2. `useAuth` 훅에서 토큰 확인
3. 토큰 없으면 `LoginModal.tsx` 표시
4. 사번 입력 후 Django API로 로그인 요청

## 수정 목표

**LoginModal 대신 8000포트 구글 OAuth로 즉시 리다이렉트**

## 수정 방법 1: App.tsx에서 리다이렉트 (권장)

### 파일: `client/src/App.tsx`

```typescript
// 기존 34-36번 줄 수정
if (!isAuthenticated) {
  // LoginModal 대신 구글 OAuth로 리다이렉트
  window.location.href = 'http://localhost:8000/auth/google/';
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">구글 로그인으로 이동 중...</p>
      </div>
    </div>
  );
}
```

### 장점
- 간단하고 직접적인 방법
- 기존 LoginModal 코드 유지 가능
- 즉시 리다이렉트 실행

### 단점
- 하드코딩된 URL
- 조건부 리다이렉트 어려움

## 수정 방법 2: useAuth 훅에서 리다이렉트

### 파일: `client/src/hooks/useAuth.tsx`

```typescript
// AuthProvider 함수 내부에 추가
useEffect(() => {
  if (!token && !isLoading) {
    // 토큰이 없고 로딩이 끝났으면 구글 OAuth로 리다이렉트
    window.location.href = 'http://localhost:8000/auth/google/';
  }
}, [token, isLoading]);
```

### 장점
- 인증 로직과 함께 관리
- 중앙집중식 리다이렉트 관리

### 단점
- 렌더링 전에 리다이렉트가 실행될 수 있음

## 수정 방법 3: 전용 리다이렉트 컴포넌트 생성

### 파일: `client/src/components/GoogleAuthRedirect.tsx` (신규 생성)

```typescript
import { useEffect } from 'react';

export function GoogleAuthRedirect() {
  useEffect(() => {
    // 구글 OAuth로 리다이렉트
    window.location.href = 'http://localhost:8000/auth/google/';
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">구글 로그인으로 이동 중...</p>
        <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}
```

### 파일: `client/src/App.tsx` 수정

```typescript
import { GoogleAuthRedirect } from "@/components/GoogleAuthRedirect";

// 34-36번 줄 수정
if (!isAuthenticated) {
  return <GoogleAuthRedirect />;
}
```

### 장점
- 깔끔한 컴포넌트 분리
- 로딩 화면과 함께 사용자 경험 향상
- 재사용 가능

## 수정 방법 4: Express 프록시 서버에서 리다이렉트

### 파일: `server/index.ts`

```typescript
// 77번 줄 이전에 추가
// 루트 경로 접속 시 구글 OAuth로 리다이렉트
app.get('/', (req, res) => {
  // 쿠키나 세션에서 인증 상태 확인
  const isAuthenticated = req.headers.authorization || req.headers.cookie?.includes('sessionid');
  
  if (!isAuthenticated) {
    return res.redirect('http://localhost:8000/auth/google/');
  }
  
  // 인증된 경우 Vite로 프록시
  next();
});
```

### 장점
- 서버 레벨에서 처리
- React 앱 로딩 전에 리다이렉트

### 단점
- 인증 상태 확인 복잡함
- 프록시 로직 복잡해짐

## 추천 방법

**방법 3 (전용 리다이렉트 컴포넌트)**를 추천합니다:

1. **사용자 경험**: 로딩 화면으로 자연스러운 전환
2. **코드 관리**: 컴포넌트 분리로 유지보수 용이
3. **확장성**: 나중에 조건부 리다이렉트 로직 추가 가능
4. **디버깅**: 리다이렉트 전 상태 확인 가능

## 구현 후 확인사항

1. **포트 8000 접속 확인**: Django 서버에서 구글 OAuth 정상 작동
2. **리다이렉트 URL**: Django에서 성공 후 5000포트로 돌아오는 설정
3. **토큰 처리**: 구글 OAuth 후 JWT 토큰을 프론트엔드에서 받을 수 있는지 확인
4. **세션 유지**: 로그인 후 새로고침해도 인증 상태 유지되는지 확인

## 주의사항

- **CORS 설정**: Django에서 5000포트 허용 확인
- **환경변수**: 개발/프로덕션 환경별 URL 분리 고려
- **에러 처리**: 8000포트 접속 불가 시 대체 방안 준비
- **보안**: 프로덕션에서는 HTTPS 사용 필수