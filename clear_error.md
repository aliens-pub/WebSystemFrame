# Replit 환경에서 독립 Django 프로젝트 502 Bad Gateway 에러 해결 가이드

## 문제 상황

독립적인 Django 프로젝트에서 `python manage.py runserver`로 포트 8000에서 서버를 실행했으나, 브라우저 접속 시 "502 Bad Gateway(nginx)" 에러가 발생하는 상황입니다. 이는 Replit 환경의 특수한 네트워킹 구조 때문에 발생하는 문제입니다.

## Replit 환경의 네트워킹 구조

Replit은 사용자가 실행하는 모든 서버 앞에 자체 프록시/로드밸런서를 두고 있습니다. 이 프록시가 사용자의 요청을 받아서 실제 애플리케이션으로 전달하는 역할을 합니다.

### 문제 원인
1. **Replit 프록시**: 모든 HTTP 요청은 Replit의 내부 프록시를 거쳐야 함
2. **포트 바인딩**: Django가 `127.0.0.1:8000`에만 바인딩되어 있으면 프록시에서 접근 불가
3. **도메인 설정**: `ALLOWED_HOSTS`에 Replit 도메인이 없으면 Django가 요청을 거부

## 해결 방법

### 1. Django 서버를 모든 인터페이스에 바인딩

**기존 명령어 (문제):**
```bash
python manage.py runserver
# 또는
python manage.py runserver 127.0.0.1:8000
```

**수정된 명령어 (해결):**
```bash
python manage.py runserver 0.0.0.0:8000
```

### 2. Django settings.py 수정

**수정할 파일: `settings.py`**

```python
import os

# 1. ALLOWED_HOSTS 설정 - Replit 도메인 허용
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '.replit.dev',      # Replit 개발 도메인
    '.replit.app',      # Replit 배포 도메인
    '*',                # 개발 중에만 사용 (프로덕션에서는 제거)
]

# 2. DEBUG 모드 확인 (개발 중에는 True로 설정)
DEBUG = True

# 3. CORS 설정 (필요한 경우)
CORS_ALLOW_ALL_ORIGINS = True  # 개발 중에만 사용

# 4. 데이터베이스 설정 (SQLite 사용 시)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 5. 정적 파일 설정
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

### 3. Django URLs 설정 확인

**수정할 파일: `urls.py` (메인 프로젝트)**

```python
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

# 간단한 루트 뷰 추가
def home_view(request):
    return HttpResponse("<h1>Django 서버가 정상적으로 실행 중입니다!</h1>")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),  # 루트 경로 추가
]
```

### 4. 포트 확인 및 프로세스 정리

```bash
# 1. 현재 8000 포트를 사용 중인 프로세스 확인
lsof -i :8000

# 2. 기존 Django 프로세스 종료 (필요한 경우)
pkill -f "python.*manage.py.*runserver"

# 3. 포트 강제 해제 (필요한 경우)
kill -9 $(lsof -ti:8000)

# 4. 새로 서버 시작
python manage.py runserver 0.0.0.0:8000
```

### 5. Replit 환경 변수 확인

```bash
# Replit 관련 환경 변수 확인
echo $REPL_SLUG
echo $REPL_OWNER
echo $REPLIT_DB_URL

# Django 실행 전 환경 변수 설정 (필요한 경우)
export DJANGO_SETTINGS_MODULE=myproject.settings
export PYTHONPATH=$PYTHONPATH:/home/runner/$REPL_SLUG
```

## 단계별 해결 가이드

### 단계 1: 즉시 해결 시도
```bash
# 1. 기존 서버 종료
pkill -f "python.*manage.py"

# 2. 올바른 바인딩으로 서버 재시작
python manage.py runserver 0.0.0.0:8000

# 3. 브라우저에서 다시 접속 테스트
```

### 단계 2: settings.py 수정
```python
# settings.py에 다음 설정 추가
ALLOWED_HOSTS = ['*']  # 개발용 임시 설정
DEBUG = True
```

### 단계 3: URL 패턴 확인
```python
# urls.py에 기본 홈페이지 추가
from django.http import HttpResponse

def home(request):
    return HttpResponse("Hello, Django!")

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
]
```

### 단계 4: 마이그레이션 실행
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Replit 특화 Django 실행 스크립트

**파일명: `run_django.py`**

```python
#!/usr/bin/env python3
import os
import sys
import subprocess

def main():
    # Replit 환경에서 Django 서버 실행
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    
    # 마이그레이션 실행
    print("마이그레이션 실행 중...")
    subprocess.run([sys.executable, 'manage.py', 'migrate'], check=False)
    
    # 정적 파일 수집 (필요한 경우)
    print("정적 파일 수집 중...")
    subprocess.run([sys.executable, 'manage.py', 'collectstatic', '--noinput'], check=False)
    
    # 서버 시작
    print("Django 서버 시작 중...")
    print("접속 URL: https://{}.replit.dev".format(os.getenv('REPL_SLUG', 'your-repl')))
    
    subprocess.run([
        sys.executable, 
        'manage.py', 
        'runserver', 
        '0.0.0.0:8000'
    ])

if __name__ == '__main__':
    main()
```

**실행 방법:**
```bash
python run_django.py
```

## 접속 URL 확인

Replit에서는 다음 URL로 접속해야 합니다:

```
https://your-repl-name.replit.dev/
```

**포트 번호는 URL에 포함하지 마세요!** Replit 프록시가 자동으로 포트 8000으로 라우팅합니다.

## 문제 지속 시 추가 확인사항

### 1. Django 버전 호환성
```bash
python -c "import django; print(django.VERSION)"
pip install --upgrade django
```

### 2. Python 경로 확인
```bash
which python
python --version
```

### 3. Django 프로젝트 구조 확인
```bash
tree -L 2  # 프로젝트 구조 확인
ls -la manage.py  # manage.py 파일 존재 확인
```

### 4. Replit 콘솔에서 로그 확인
Django 서버 실행 시 콘솔에 나타나는 모든 오류 메시지를 확인하세요.

## 성공 확인 방법

1. **콘솔 출력 확인:**
   ```
   Django version X.X.X, using settings 'myproject.settings'
   Starting development server at http://0.0.0.0:8000/
   Quit the server with CONTROL-C.
   ```

2. **브라우저 접속 성공:** `https://your-repl-name.replit.dev`에서 Django 기본 페이지 또는 설정한 홈페이지가 표시

3. **관리자 페이지 접속 가능:** `https://your-repl-name.replit.dev/admin/`

이 가이드를 따라하면 Replit 환경에서 독립적인 Django 프로젝트의 502 Bad Gateway 에러를 해결할 수 있습니다.