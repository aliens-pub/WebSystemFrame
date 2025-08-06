# Debian 환경에서 Django 프로젝트 502 Bad Gateway 에러 해결 가이드

## 문제 상황

Debian 환경에서 Git clone으로 가져온 Django 프로젝트를 `python manage.py runserver`로 포트 8000에서 실행했으나, 브라우저 접속 시 "502 Bad Gateway(nginx)" 에러가 발생하는 상황입니다. 이는 Debian 환경에서 nginx가 기본적으로 설치되어 리버스 프록시로 설정되어 있거나, 방화벽/네트워크 설정 문제로 발생할 수 있습니다.

## Debian 환경에서 502 에러 발생 원인

### Debian 특화 원인들
1. **nginx 기본 설치**: Debian에서 nginx가 기본 패키지로 설치되어 자동 실행
2. **Apache와 충돌**: Debian에서 Apache와 nginx가 동시에 설치된 경우 포트 충돌
3. **systemd 서비스**: nginx가 systemd로 자동 시작되어 백그라운드 실행
4. **Debian 방화벽**: iptables/ufw 방화벽이 포트 8000 차단
5. **Django 바인딩**: 127.0.0.1에만 바인딩되어 nginx 프록시에서 접근 불가
6. **패키지 관리**: apt로 설치된 nginx의 기본 설정이 Django와 충돌

## 진단 및 해결 방법

### 1. nginx 상태 및 설정 확인

**Debian에서 nginx 설치 여부 확인:**
```bash
# nginx 설치 여부 확인
which nginx
nginx -v

# Debian 패키지 확인
dpkg -l | grep nginx
apt list --installed | grep nginx

# nginx 서비스 상태 확인 (Debian systemd)
sudo systemctl status nginx
sudo service nginx status

# nginx 프로세스 확인
ps aux | grep nginx
```

**Debian nginx 설정 파일 확인:**
```bash
# Debian nginx 설정 파일 위치
sudo cat /etc/nginx/nginx.conf
sudo cat /etc/nginx/sites-available/default
sudo cat /etc/nginx/sites-enabled/default

# Debian nginx 모듈 확인
sudo nginx -V

# 설정 파일 문법 검사
sudo nginx -t

# Apache 설치 여부 확인 (포트 80 충돌 방지)
dpkg -l | grep apache2
sudo systemctl status apache2
```

### 2. nginx 설정 문제 해결

**Option A: Debian에서 nginx 완전 중지 (테스트용)**
```bash
# Debian systemd로 nginx 서비스 중지
sudo systemctl stop nginx
sudo systemctl disable nginx  # 부팅 시 자동 시작 방지

# Apache도 중지 (포트 80 충돌 방지)
sudo systemctl stop apache2
sudo systemctl disable apache2

# 기존 프로세스 강제 종료
sudo pkill -f nginx
sudo pkill -f apache2

# Django 서버 재시작
python3 manage.py runserver 0.0.0.0:8000

# 브라우저에서 http://localhost:8000 직접 접속 테스트
```

**Option B: Debian nginx 설정 수정 (권장)**
```bash
# Debian nginx 설정 백업
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# 새로운 Django용 설정 파일 생성
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

**Debian 방화벽 설정 확인:**
```bash
# Debian UFW 방화벽 상태 확인
sudo ufw status
sudo ufw --version

# Debian iptables 규칙 확인
sudo iptables -L -n
sudo iptables -L INPUT -n

# 포트 8000 허용 (Debian에서)
sudo ufw allow 8000/tcp
sudo ufw allow 80/tcp

# iptables 직접 규칙 추가 (UFW 미설치 시)
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
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

**Debian Python 환경 확인:**
```bash
# Python 버전 확인 (Debian 기본)
python3 --version
which python3

# 가상환경 확인
echo $VIRTUAL_ENV
which pip3

# 가상환경 생성 및 활성화 (Debian)
python3 -m venv venv
source venv/bin/activate

# Django 설치 확인
python3 -c "import django; print(django.VERSION)"
pip3 list | grep Django
```

**Debian 의존성 설치:**
```bash
# Debian 시스템 패키지 업데이트
sudo apt update

# Python 개발 도구 설치
sudo apt install python3-pip python3-venv python3-dev

# 가상환경에서 Django 설치
pip3 install django

# requirements.txt가 있는 경우
pip3 install -r requirements.txt

# 프로젝트 의존성 확인
python3 manage.py check
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

## Debian 환경 Django 실행 스크립트

**파일명: `run_django_debian.py`**

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

def check_apache():
    """Apache 실행 여부 확인"""
    try:
        result = subprocess.run(['systemctl', 'is-active', 'apache2'], 
                              capture_output=True, text=True)
        return result.stdout.strip() == 'active'
    except:
        return False

def stop_apache():
    """Apache 일시 중지"""
    try:
        subprocess.run(['sudo', 'systemctl', 'stop', 'apache2'], check=True)
        print("Apache를 일시 중지했습니다.")
        return True
    except:
        print("Apache 중지에 실패했습니다.")
        return False

def main():
    print("Debian 환경에서 Django 서버 시작...")
    
    # nginx 실행 여부 확인 및 처리
    if check_nginx():
        print("nginx가 실행 중입니다.")
        choice = input("nginx를 일시 중지하시겠습니까? (y/n): ")
        if choice.lower() == 'y':
            stop_nginx()
    
    # Apache 실행 여부 확인 및 처리
    if check_apache():
        print("Apache가 실행 중입니다.")
        choice = input("Apache를 일시 중지하시겠습니까? (y/n): ")
        if choice.lower() == 'y':
            stop_apache()
    
    # 포트 8000 정리
    kill_port_8000()
    
    # 마이그레이션 실행
    print("마이그레이션 실행 중...")
    subprocess.run(['python3', 'manage.py', 'migrate'], check=False)
    
    # 서버 시작
    print("Django 서버 시작 중...")
    print("접속 URL: http://localhost:8000")
    
    try:
        subprocess.run([
            'python3', 
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
python3 run_django_debian.py
```

## 접속 URL 확인

Debian 환경에서는 다음 URL로 접속합니다:

### nginx/Apache 중지 후 Django 직접 접속:
```
http://localhost:8000/
```

### nginx 프록시를 통한 접속:
```
http://localhost/        # nginx가 포트 80에서 Django로 프록시
http://localhost:80/     # 명시적 포트 지정
```

### Apache 가상호스트를 통한 접속 (Apache 사용 시):
```
http://localhost/        # Apache가 포트 80에서 Django로 프록시
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

이 가이드를 따라하면 Debian 환경에서 Git clone으로 가져온 Django 프로젝트의 502 Bad Gateway 에러를 체계적으로 해결할 수 있습니다.

## Debian 환경 추가 고려사항

### 1. Debian 버전별 차이점
- **Debian 10 (Buster)**: Python 3.7 기본, systemd 사용
- **Debian 11 (Bullseye)**: Python 3.9 기본, nginx 1.18
- **Debian 12 (Bookworm)**: Python 3.11 기본, nginx 1.22

### 2. 패키지 관리자 활용
```bash
# 설치된 웹서버 패키지 전체 확인
dpkg -l | grep -E "(nginx|apache|lighttpd)"

# apt를 통한 완전 제거 (설정파일 포함)
sudo apt purge nginx nginx-common nginx-core
sudo apt purge apache2 apache2-utils apache2-bin
sudo apt autoremove
```

### 3. Debian 서비스 관리
```bash
# systemctl로 모든 웹서버 서비스 확인
sudo systemctl list-unit-files | grep -E "(nginx|apache)"

# 서비스 영구 비활성화
sudo systemctl mask nginx
sudo systemctl mask apache2
```