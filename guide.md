# Django + React 개발 가이드

## 프로젝트 구조

```
프로젝트 루트/
├── backend/                # Django 백엔드
│   ├── api/               # API 앱
│   │   ├── models.py      # Employee 모델
│   │   ├── views.py       # API 뷰
│   │   ├── serializers.py # 데이터 직렬화
│   │   └── urls.py        # API URL 라우팅
│   ├── business_system/   # Django 프로젝트 설정
│   │   ├── settings.py    # 데이터베이스 및 앱 설정
│   │   └── urls.py        # 메인 URL 설정
│   └── manage.py          # Django 관리 명령어
├── client/                # React 프론트엔드
│   └── src/
│       ├── components/    # UI 컴포넌트
│       ├── pages/         # 페이지 컴포넌트
│       ├── hooks/         # 커스텀 훅
│       └── lib/           # 유틸리티 함수
├── start_dev.py           # 개발 서버 실행 스크립트
├── start_django.py        # Django 서버 단독 실행
└── guide.md               # 이 가이드 파일
```

## 시스템 개요

- **백엔드**: Django REST Framework (포트 8000)
- **프론트엔드**: React + Vite (포트 5173)
- **데이터베이스**: MySQL
- **인증**: 세션 기반 인증

## 필수 의존성 설치

### Python 패키지 설치
```bash
pip install django djangorestframework django-cors-headers pymysql python-dotenv
```

### Node.js 패키지 설치
```bash
npm install
```

## 개발 서버 실행 방법

### 1. 전체 시스템 실행 (추천)
```bash
python start_dev.py
```
- Django 백엔드 (포트 8000)와 React 프론트엔드 (포트 5173)를 동시에 실행
- 자동으로 마이그레이션 실행
- 브라우저에서 http://localhost:5173 접속

### 2. 개별 서버 실행

#### Django 백엔드만 실행
```bash
python start_django.py
```
또는
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

#### React 프론트엔드만 실행
```bash
npm run dev
```

## 데이터베이스 설정

### MySQL 데이터베이스 설정
1. MySQL 서버 실행
2. 데이터베이스 생성:
   ```sql
   CREATE DATABASE business_system;
   ```

3. 환경 변수 설정 (선택사항):
   ```bash
   export MYSQL_DATABASE=business_system
   export MYSQL_USER=root
   export MYSQL_PASSWORD=your_password
   export MYSQL_HOST=localhost
   export MYSQL_PORT=3306
   ```

### 마이그레이션 실행
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 주요 기능

### 1. 사용자 관리
- **로그인**: 사용자명으로 로그인 (자동 계정 생성)
- **권한 관리**: ENGINEER/MANAGER 권한 시스템
- **계정 생성**: 로그인 시 자동으로 employee 테이블에 데이터 저장

### 2. 권한 시스템
- **ENGINEER**: 기본 권한
- **MANAGER**: 관리자 권한 (다른 사용자 권한 변경 가능)

### 3. API 엔드포인트
- `POST /api/auth/login/` - 로그인
- `GET /api/auth/me/` - 현재 사용자 정보
- `POST /api/auth/logout/` - 로그아웃
- `GET /api/users/` - 사용자 목록 (MANAGER만)
- `PUT /api/users/{id}/role/` - 사용자 권한 변경 (MANAGER만)
- `GET /api/stats/` - 시스템 통계

## 사용 예시

### 1. 로그인 과정
1. 사용자가 username 입력 (예: "woobin")
2. 백엔드에서 employee 테이블에 자동 생성
3. 기본 권한 ENGINEER로 설정
4. 로그인 성공

### 2. 권한 변경 과정
1. MANAGER 권한 사용자로 로그인
2. 사용자 관리 페이지에서 다른 사용자 선택
3. 권한을 ENGINEER → MANAGER로 변경
4. 변경 사항이 employee 테이블에 반영

## 문제 해결

### 1. 마이그레이션 에러
```bash
cd backend
python manage.py makemigrations api
python manage.py migrate
```

### 2. 포트 충돌
- Django: 포트 8000 사용
- React: 포트 5173 사용
- 다른 애플리케이션이 해당 포트를 사용 중이면 종료 후 재시도

### 3. MySQL 연결 에러
- MySQL 서버가 실행 중인지 확인
- 데이터베이스 인증 정보 확인
- pymysql 패키지 설치 확인

### 4. CORS 에러
- Django settings.py에서 CORS 설정 확인
- django-cors-headers 패키지 설치 확인

## 개발 팁

### 1. 디버깅
- Django 로그: 터미널에서 Django 서버 로그 확인
- React 로그: 브라우저 개발자 도구 Console 탭 확인

### 2. 데이터베이스 관리
```bash
# Django 관리자 계정 생성
cd backend
python manage.py createsuperuser

# Django 관리자 페이지 접속
# http://localhost:8000/admin/
```

### 3. API 테스트
```bash
# 로그인 테스트
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'

# 사용자 목록 조회
curl -X GET http://localhost:8000/api/users/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

## 프로덕션 배포

### 1. 환경 변수 설정
```bash
export DJANGO_SECRET_KEY="your-secret-key"
export MYSQL_PASSWORD="your-production-password"
export DEBUG=False
```

### 2. 정적 파일 수집
```bash
cd backend
python manage.py collectstatic
```

### 3. 프론트엔드 빌드
```bash
npm run build
```

이 가이드를 따라 Django 백엔드와 React 프론트엔드를 성공적으로 실행할 수 있습니다.