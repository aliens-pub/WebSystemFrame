# Google OAuth JWT 토큰 복호화 및 Employee 테이블 저장 가이드

## 개요

구글 OAuth 로그인 완료 후 받은 JWT 토큰을 복호화하여 사용자 정보(`user_id`, `first_name`, `last_name` 등)를 추출하고, 이를 기존 `employee` 테이블에 저장하는 방법을 설명합니다.

## 1. JWT 토큰 복호화 및 Employee 테이블 저장 흐름

### 1.1 전체 처리 흐름
1. 구글 OAuth 콜백에서 JWT 토큰 수신
2. JWT 토큰 복호화하여 사용자 정보 추출
3. 추출된 정보를 `employee` 테이블에 저장 또는 업데이트
4. 세션 생성 후 기존 로그인 페이지로 리다이렉트

### 1.2 수정 필요 파일 목록
- `backend/business_system/views.py` (콜백 처리 로직)
- `backend/app/models.py` (Employee 모델 필드 확인/추가)
- `backend/requirements.txt` (JWT 라이브러리 추가)

## 2. JWT 라이브러리 설치

### 2.1 requirements.txt 업데이트
`backend/requirements.txt`에 다음 라이브러리 추가:

```txt
PyJWT==2.8.0
cryptography==41.0.7
```

### 2.2 라이브러리 설치
```bash
cd backend
pip install PyJWT cryptography
```

## 3. Employee 모델 필드 확인 및 추가

### 3.1 현재 Employee 모델 확인
`backend/app/models.py`에서 Employee 모델의 현재 필드 확인:

```python
class Employee(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ENGINEER')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 구글 OAuth 관련 필드 추가 필요
    google_user_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    is_google_authenticated = models.BooleanField(default=False)
```

### 3.2 필요한 필드 추가
구글 OAuth 연동을 위해 다음 필드들을 추가:

```python
# backend/app/models.py에 추가할 필드들
google_user_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
is_google_authenticated = models.BooleanField(default=False)
google_email = models.EmailField(blank=True, null=True)
last_google_login = models.DateTimeField(blank=True, null=True)
```

### 3.3 마이그레이션 실행
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 4. JWT 토큰 복호화 및 저장 로직 구현

### 4.1 Django Views에서 JWT 처리
`backend/business_system/views.py`에 다음 함수들 추가:

```python
import jwt
import json
from datetime import datetime
from django.contrib.auth import login
from django.contrib.sessions.models import Session
from django.shortcuts import redirect
from django.http import JsonResponse
from app.models import Employee

def decode_google_jwt(token, client_id):
    """
    구글 JWT 토큰을 복호화하여 사용자 정보 추출
    """
    try:
        # 구글 공개키로 JWT 토큰 검증 및 복호화
        decoded_token = jwt.decode(
            token, 
            options={"verify_signature": False},  # 개발용, 실제로는 구글 공개키로 검증 필요
            audience=client_id
        )
        
        return {
            'user_id': decoded_token.get('sub'),  # 구글 사용자 ID
            'email': decoded_token.get('email'),
            'first_name': decoded_token.get('given_name', ''),
            'last_name': decoded_token.get('family_name', ''),
            'name': decoded_token.get('name', ''),
            'picture': decoded_token.get('picture', ''),
        }
    except jwt.InvalidTokenError as e:
        print(f"JWT 토큰 복호화 실패: {e}")
        return None

def save_google_user_to_employee(user_info):
    """
    복호화된 구글 사용자 정보를 Employee 테이블에 저장
    """
    try:
        # 구글 사용자 ID로 기존 직원 검색
        employee, created = Employee.objects.get_or_create(
            google_user_id=user_info['user_id'],
            defaults={
                'username': user_info['email'].split('@')[0],  # 이메일에서 username 생성
                'email': user_info['email'],
                'google_email': user_info['email'],
                'first_name': user_info['first_name'],
                'last_name': user_info['last_name'],
                'is_google_authenticated': True,
                'last_google_login': datetime.now(),
                'role': 'ENGINEER',  # 기본 역할
            }
        )
        
        # 기존 직원인 경우 구글 로그인 정보 업데이트
        if not created:
            employee.first_name = user_info['first_name']
            employee.last_name = user_info['last_name']
            employee.google_email = user_info['email']
            employee.is_google_authenticated = True
            employee.last_google_login = datetime.now()
            employee.save()
            
        return employee
        
    except Exception as e:
        print(f"Employee 저장 실패: {e}")
        return None

def google_oauth_callback(request):
    """
    구글 OAuth 콜백 처리 - JWT 토큰 복호화 및 Employee 저장
    """
    try:
        # 구글에서 전달받은 JWT 토큰 (실제 구현에서는 OAuth 라이브러리를 통해 받음)
        jwt_token = request.GET.get('id_token') or request.POST.get('id_token')
        
        if not jwt_token:
            return JsonResponse({'error': '토큰이 없습니다'}, status=400)
        
        # JWT 토큰 복호화
        client_id = os.getenv('GOOGLE_CLIENT_ID')
        user_info = decode_google_jwt(jwt_token, client_id)
        
        if not user_info:
            return JsonResponse({'error': '토큰 복호화 실패'}, status=400)
        
        # Employee 테이블에 저장
        employee = save_google_user_to_employee(user_info)
        
        if not employee:
            return JsonResponse({'error': '사용자 저장 실패'}, status=500)
        
        # Django 세션 생성 (기존 로그인 시스템과 호환)
        request.session['employee_id'] = employee.id
        request.session['employee_number'] = employee.employee_number
        request.session['username'] = employee.username
        request.session['role'] = employee.role
        request.session['is_google_authenticated'] = True
        
        # 기존 로그인 페이지로 리다이렉트
        return redirect('/')
        
    except Exception as e:
        print(f"구글 OAuth 콜백 처리 실패: {e}")
        return JsonResponse({'error': '로그인 처리 실패'}, status=500)
```

### 4.2 URL 패턴 추가
`backend/business_system/urls.py`에 콜백 URL 추가:

```python
from django.urls import path
from . import views

urlpatterns = [
    # 기존 URL 패턴들...
    path('accounts/google/login/callback/', views.google_oauth_callback, name='google_oauth_callback'),
]
```

## 5. 프론트엔드 연동

### 5.1 기존 로그인 모달에 구글 로그인 버튼 추가
`client/src/components/LoginModal.tsx`에 구글 로그인 버튼 추가:

```tsx
// 구글 로그인 버튼
<Button 
  type="button" 
  variant="outline" 
  className="w-full"
  onClick={() => {
    window.location.href = '/accounts/google/login/';
  }}
>
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    {/* 구글 아이콘 SVG */}
  </svg>
  구글로 로그인
</Button>
```

## 6. 환경 변수 설정

### 6.1 .env 파일에 구글 OAuth 설정 추가
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 6.2 Django settings.py에서 환경 변수 로드
```python
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_OAUTH2_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
```

## 7. 테스트 및 확인

### 7.1 테스트 절차
1. 구글 개발자 콘솔에서 OAuth 설정 완료
2. 환경 변수 설정 확인
3. Django 마이그레이션 실행
4. 서버 재시작 (`npm run dev`)
5. 브라우저에서 구글 로그인 테스트
6. Django 관리자에서 Employee 테이블 확인

### 7.2 확인 사항
- JWT 토큰이 정상적으로 복호화되는지
- 복호화된 정보가 Employee 테이블에 저장되는지
- 세션이 생성되어 기존 로그인 상태와 호환되는지
- 기존 로그인 페이지로 정상 리다이렉트되는지

## 8. 보안 고려사항

### 8.1 JWT 토큰 검증
- 실제 구현에서는 구글 공개키로 JWT 서명 검증 필수
- `verify_signature=False`는 개발용, 프로덕션에서는 제거

### 8.2 데이터 검증
- 구글에서 받은 데이터의 유효성 검증
- SQL 인젝션 방지를 위한 Django ORM 사용

### 8.3 세션 보안
- HTTPS 환경에서만 세션 쿠키 전송
- 세션 타임아웃 적절히 설정

## 9. 에러 처리

### 9.1 일반적인 오류들
- **JWT 복호화 실패**: 토큰 형식 또는 만료 확인
- **Employee 저장 실패**: 데이터베이스 제약 조건 확인
- **세션 생성 실패**: Django 세션 설정 확인

### 9.2 디버깅 팁
- Django 콘솔에서 JWT 토큰 내용 출력
- Employee 테이블의 제약 조건 확인
- 세션 테이블에서 세션 생성 여부 확인

이 가이드를 따라 구현하면 구글 OAuth 로그인 후 JWT 토큰을 복호화하여 사용자 정보를 Employee 테이블에 안전하게 저장할 수 있습니다.