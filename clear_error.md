# Linux 환경에서 Django 프로젝트 502 Bad Gateway 에러 해결 가이드

## 문제 상황

Linux 가상환경에서 Git clone으로 가져온 Django 프로젝트를 `python manage.py runserver`로 포트 8000에서 실행했으나, 브라우저 접속 시 "502 Bad Gateway(nginx)" 에러가 발생하는 상황입니다. 이는 Linux 환경에서 nginx가 리버스 프록시로 설정되어 있거나, 방화벽/네트워크 설정 문제로 발생할 수 있습니다.

## Linux 환경에서 502 에러 발생 원인

### 일반적인 원인들
1. **nginx 리버스 프록시**: 시스템에 nginx가 설치되어 Django 앞단에서 프록시 역할
2. **방화벽 설정**: 포트 8000이 외부 접속에 대해 차단됨
3. **Django 바인딩**: 로컬호스트에만 바인딩되어 외부 접속 불가
4. **nginx 설정 오류**: nginx 설정이 Django 서버를 제대로 찾지 못함
5. **포트 충돌**: 다른 서비스가 포트 8000 사용 중

## 진단 및 해결 방법

### 1. nginx 상태 및 설정 확인

**nginx가 설치되어 있는지 확인:**
```bash
# nginx 설치 여부 확인
which nginx
nginx -v

# nginx 서비스 상태 확인
sudo systemctl status nginx
# 또는
sudo service nginx status

# nginx 프로세스 확인
ps aux | grep nginx
```

**nginx 설정 확인:**
```bash
# nginx 설정 파일 위치 확인
sudo find / -name "nginx.conf" 2>/dev/null
sudo find / -name "default" -path "*/nginx/*" 2>/dev/null

# 일반적인 nginx 설정 위치
sudo cat /etc/nginx/nginx.conf
sudo cat /etc/nginx/sites-available/default
sudo cat /etc/nginx/sites-enabled/default
```

### 2. nginx 설정 문제 해결

**Option A: nginx 완전 중지 (테스트용)**
```bash
# nginx 서비스 중지
sudo systemctl stop nginx
# 또는
sudo service nginx stop

# nginx 프로세스 강제 종료
sudo pkill -f nginx

# Django 서버 재시작
python manage.py runserver 0.0.0.0:8000

# 브라우저에서 http://localhost:8000 직접 접속 테스트
```

**Option B: nginx 설정 수정 (권장)**
```bash
# nginx 설정 백업
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# 새로운 설정 파일 생성
sudo nano /etc/nginx/sites-available/django-test
```

**nginx 설정 파일 내용:**
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**nginx 설정 적용:**
```bash
# 기존 설정 비활성화
sudo rm /etc/nginx/sites-enabled/default

# 새 설정 활성화
sudo ln -s /etc/nginx/sites-available/django-test /etc/nginx/sites-enabled/

# nginx 설정 문법 검사
sudo nginx -t

# nginx 재시작
sudo systemctl restart nginx
```

### 3. Django 서버 설정

**Django 서버를 모든 인터페이스에 바인딩:**
```bash
# 기존 명령어 (문제)
python manage.py runserver
# 또는
python manage.py runserver 127.0.0.1:8000

# 수정된 명령어 (해결)
python manage.py runserver 0.0.0.0:8000
```

**Django settings.py 수정:**
```python
import os

# 1. ALLOWED_HOSTS 설정
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '*',  # 개발 중에만 사용
]

# 2. DEBUG 모드 활성화 (개발용)
DEBUG = True

# 3. 데이터베이스 설정 (기본 SQLite)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 4. 정적 파일 설정
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

### 4. 방화벽 및 포트 확인

**포트 사용 상황 확인:**
```bash
# 포트 8000 사용 상황 확인
sudo netstat -tulpn | grep :8000
# 또는
sudo ss -tulpn | grep :8000
lsof -i :8000

# 포트 80 사용 상황 확인 (nginx용)
sudo netstat -tulpn | grep :80
```

**방화벽 설정 확인:**
```bash
# UFW 방화벽 상태 확인
sudo ufw status

# iptables 규칙 확인
sudo iptables -L

# 포트 8000 허용 (필요한 경우)
sudo ufw allow 8000
sudo ufw allow 80
```

**프로세스 정리:**
```bash
# Django 프로세스 종료
pkill -f "python.*manage.py.*runserver"

# 포트 8000 사용 프로세스 강제 종료
sudo kill -9 $(lsof -ti:8000)

# 새로 Django 서버 시작
python manage.py runserver 0.0.0.0:8000
```

### 5. 환경 설정 확인

**Python 가상환경 확인:**
```bash
# 가상환경 활성화 여부 확인
echo $VIRTUAL_ENV

# 가상환경 활성화 (필요한 경우)
source venv/bin/activate  # 또는 해당 가상환경 경로

# Django 설치 확인
python -c "import django; print(django.VERSION)"
pip list | grep Django
```

**의존성 설치:**
```bash
# requirements.txt가 있는 경우
pip install -r requirements.txt

# Django 기본 설치
pip install django

# 프로젝트 의존성 확인
python manage.py check
```

## 단계별 해결 가이드

### 단계 1: nginx 상태 확인 및 처리
```bash
# 1. nginx 설치 및 실행 여부 확인
sudo systemctl status nginx

# 2. nginx가 실행 중이면 일시 중지 (테스트용)
sudo systemctl stop nginx

# 3. Django 서버 직접 실행 테스트
python manage.py runserver 0.0.0.0:8000

# 4. 브라우저에서 http://localhost:8000 직접 접속 테스트
```

### 단계 2: Django 설정 수정
```python
# settings.py에 다음 설정 추가
ALLOWED_HOSTS = ['*']  # 개발용 임시 설정
DEBUG = True
```

### 단계 3: 포트 및 프로세스 정리
```bash
# 1. 포트 8000 사용 프로세스 확인
sudo netstat -tulpn | grep :8000

# 2. 충돌 프로세스 종료
sudo kill -9 $(lsof -ti:8000)

# 3. Django 서버 재시작
python manage.py runserver 0.0.0.0:8000
```

### 단계 4: nginx 설정 수정 (nginx 사용 시)
```bash
# 1. nginx 설정 백업
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# 2. Django 프록시 설정 추가
sudo nano /etc/nginx/sites-available/default

# 3. nginx 재시작
sudo systemctl restart nginx
```

## Linux 환경 Django 실행 스크립트

**파일명: `run_django_linux.py`**

```python
#!/usr/bin/env python3
import os
import sys
import subprocess
import signal

def check_nginx():
    """nginx 실행 여부 확인"""
    try:
        result = subprocess.run(['systemctl', 'is-active', 'nginx'], 
                              capture_output=True, text=True)
        return result.stdout.strip() == 'active'
    except:
        return False

def stop_nginx():
    """nginx 일시 중지"""
    try:
        subprocess.run(['sudo', 'systemctl', 'stop', 'nginx'], check=True)
        print("nginx를 일시 중지했습니다.")
        return True
    except:
        print("nginx 중지에 실패했습니다.")
        return False

def kill_port_8000():
    """포트 8000 사용 프로세스 종료"""
    try:
        result = subprocess.run(['lsof', '-ti:8000'], capture_output=True, text=True)
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                os.kill(int(pid), signal.SIGTERM)
            print(f"포트 8000 사용 프로세스 {len(pids)}개를 종료했습니다.")
    except:
        pass

def main():
    print("Linux 환경에서 Django 서버 시작...")
    
    # nginx 실행 여부 확인 및 처리
    if check_nginx():
        print("nginx가 실행 중입니다.")
        choice = input("nginx를 일시 중지하시겠습니까? (y/n): ")
        if choice.lower() == 'y':
            stop_nginx()
    
    # 포트 8000 정리
    kill_port_8000()
    
    # 마이그레이션 실행
    print("마이그레이션 실행 중...")
    subprocess.run([sys.executable, 'manage.py', 'migrate'], check=False)
    
    # 서버 시작
    print("Django 서버 시작 중...")
    print("접속 URL: http://localhost:8000")
    
    try:
        subprocess.run([
            sys.executable, 
            'manage.py', 
            'runserver', 
            '0.0.0.0:8000'
        ])
    except KeyboardInterrupt:
        print("\nDjango 서버를 종료합니다...")

if __name__ == '__main__':
    main()
```

**실행 방법:**
```bash
python run_django_linux.py
```

## 접속 URL 확인

Linux 환경에서는 다음 URL로 접속합니다:

### nginx 중지 후 Django 직접 접속:
```
http://localhost:8000/
```

### nginx 프록시를 통한 접속:
```
http://localhost/        # nginx가 포트 80에서 Django로 프록시
http://localhost:80/     # 명시적 포트 지정
```

## 문제 지속 시 추가 확인사항

### 1. 로그 분석
```bash
# nginx 에러 로그 확인
sudo tail -f /var/log/nginx/error.log

# nginx 액세스 로그 확인
sudo tail -f /var/log/nginx/access.log

# 시스템 로그 확인
sudo journalctl -u nginx -f
```

### 2. Django 프로젝트 검증
```bash
# Django 버전 확인
python -c "import django; print(django.VERSION)"

# 프로젝트 구조 확인
ls -la manage.py
python manage.py check

# 의존성 확인
pip list | grep -i django
```

### 3. 네트워크 연결 테스트
```bash
# Django 서버 응답 테스트
curl -I http://localhost:8000/

# nginx 응답 테스트 (nginx 사용 시)
curl -I http://localhost:80/

# 포트 접근 가능성 테스트
telnet localhost 8000
```

### 4. 환경 변수 및 권한 확인
```bash
# Python 경로 확인
which python
which python3

# 현재 사용자 확인
whoami

# Django 프로젝트 디렉토리 권한 확인
ls -la
```

## 성공 확인 방법

### 1. Django 서버 정상 실행 확인
```bash
# 콘솔 출력 예시
Django version X.X.X, using settings 'myproject.settings'
Starting development server at http://0.0.0.0:8000/
Quit the server with CONTROL-C.
```

### 2. 브라우저 접속 테스트
- **nginx 중지 후**: `http://localhost:8000/`
- **nginx 프록시 사용 시**: `http://localhost/`

### 3. API 응답 테스트
```bash
# 기본 페이지 응답 확인
curl -v http://localhost:8000/

# HTTP 상태 코드가 200이면 성공
```

## 최종 문제 해결 체크리스트

- [ ] nginx 상태 확인 및 필요시 중지
- [ ] Django 서버를 `0.0.0.0:8000`으로 바인딩
- [ ] `ALLOWED_HOSTS`에 필요한 도메인 추가
- [ ] 포트 8000 충돌 프로세스 제거
- [ ] 방화벽에서 포트 8000 허용
- [ ] Django 의존성 및 설정 검증
- [ ] 브라우저 접속 테스트 성공

이 가이드를 따라하면 Linux 환경에서 Git clone으로 가져온 Django 프로젝트의 502 Bad Gateway 에러를 체계적으로 해결할 수 있습니다.