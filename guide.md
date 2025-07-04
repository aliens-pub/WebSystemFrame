# WebSystemFrame 프로젝트 새로운 가상환경 배포 가이드

## 개요
이 가이드는 Replit에서 개발된 WebSystemFrame 프로젝트를 Debian 기반 가상환경으로 이전하여 배포하는 방법을 설명합니다.

**목표 환경 특징:**
- 운영체제: Debian
- 네트워크: 외부 인터넷망과 분리된 내부 네트워크
- 데이터베이스: MySQL (pymysql 연결)
- 용도: 내부 네트워크 사용자들을 위한 웹 시스템

## 1. 사전 준비사항

### 1.1 시스템 패키지 설치
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y curl git build-essential

# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3.11 설치 (Debian 12에는 기본 포함)
sudo apt install -y python3 python3-pip python3-venv

# MySQL 클라이언트 설치
sudo apt install -y mysql-client libmysqlclient-dev
```

### 1.2 프로젝트 다운로드
```bash
# 프로젝트 디렉토리 생성 및 이동
mkdir -p /home/websystem
cd /home/websystem

# 프로젝트 파일 복사 (USB, 네트워크 공유 등을 통해)
# 또는 git clone (내부 git 서버가 있는 경우)
```

## 2. 백엔드 설정 (Django)

### 2.1 Python 가상환경 생성
```bash
cd /home/websystem
python3 -m venv venv
source venv/bin/activate
```

### 2.2 Python 패키지 설치
```bash
# 기본 패키지 설치
pip install django==5.2.4
pip install djangorestframework
pip install django-cors-headers
pip install pymysql
pip install python-dotenv

# 또는 requirements.txt가 있는 경우
pip install -r requirements.txt
```

### 2.3 Django 설정 파일 수정

**파일: `backend/business_system/settings.py`**

**기존 데이터베이스 설정을 다음과 같이 변경:**
```python
# 기존 코드 (83~91줄 근처)
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL', 'postgresql://postgres:@localhost:5432/business_system'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}
```

**새로운 코드로 교체:**
```python
import pymysql
pymysql.install_as_MySQLdb()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'db',  # 실제 데이터베이스 이름으로 변경
        'USER': 'user',  # 실제 사용자명으로 변경
        'PASSWORD': 'password',  # 실제 비밀번호로 변경
        'HOST': '12.123.12.123',  # 실제 DB IP로 변경
        'PORT': '12345',  # 실제 포트로 변경
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}
```

**ALLOWED_HOSTS 설정 추가:**
```python
# 현재 빈 리스트인 ALLOWED_HOSTS를 다음과 같이 변경
ALLOWED_HOSTS = ['*']  # 내부 네트워크에서만 사용하므로 모든 IP 허용
```

### 2.4 Employee 테이블 생성
```bash
# Django 마이그레이션 파일 생성
cd backend
python manage.py makemigrations

# 데이터베이스에 테이블 생성
python manage.py migrate
```

## 3. 프론트엔드 설정 (React)

### 3.1 Node.js 패키지 설치
```bash
cd /home/websystem
npm install
```

### 3.2 Vite 설정 수정

**파일: `vite.config.ts`**

**기존 서버 설정 확인 및 수정:**
```typescript
export default defineConfig({
  // ... 기존 설정 유지
  server: {
    host: '0.0.0.0',  // 외부 접속 허용
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

## 4. 프록시 서버 설정

### 4.1 프록시 서버 수정

**파일: `server/index.ts`**

**포트 바인딩 수정:**
```typescript
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on http://0.0.0.0:${PORT}`);
});
```

## 5. 시스템 실행

### 5.1 개발 서버 실행

**방법 1: 개별 실행**
```bash
# 터미널 1: Django 백엔드 실행
cd /home/websystem/backend
source ../venv/bin/activate
python manage.py runserver 0.0.0.0:8000

# 터미널 2: React 프론트엔드 실행
cd /home/websystem
npm run dev

# 터미널 3: 프록시 서버 실행
cd /home/websystem
npm run server
```

**방법 2: 통합 실행**
```bash
cd /home/websystem
npm run dev  # 모든 서버를 동시에 실행
```

### 5.2 접속 확인
```bash
# 웹 브라우저에서 다음 주소로 접속
http://[서버IP]:5000
```

## 6. 데이터베이스 초기 설정

### 6.1 관리자 계정 생성
시스템 첫 실행 후 다음 계정으로 로그인하면 자동으로 관리자 권한이 부여됩니다:

**계정명:** `admin.system`
**권한:** MANAGER (자동 부여)

### 6.2 사용자 데이터 복원 (선택사항)
기존 사용자 데이터를 복원하려면 MySQL에서 다음 SQL 실행:
```sql
INSERT INTO employee (username, role, created_at, updated_at) VALUES 
('testuser', 'ENGINEER', NOW(), NOW()),
('woobin', 'ENGINEER', NOW(), NOW()),
('woobin.jeong', 'ENGINEER', NOW(), NOW()),
('admin.system', 'MANAGER', NOW(), NOW());
```

## 7. 방화벽 설정

### 7.1 필요한 포트 열기
```bash
# UFW 방화벽 설정 (설치되어 있는 경우)
sudo ufw allow 5000/tcp  # 프록시 서버
sudo ufw allow 8000/tcp  # Django 백엔드
sudo ufw allow 5173/tcp  # React 프론트엔드
```

## 8. 서비스 등록 (선택사항)

### 8.1 Systemd 서비스 생성
영구 실행을 위한 systemd 서비스 파일 생성:

**파일: `/etc/systemd/system/websystem.service`**
```ini
[Unit]
Description=WebSystemFrame Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/websystem
ExecStart=/usr/bin/npm run dev
Restart=always

[Install]
WantedBy=multi-user.target
```

**서비스 활성화:**
```bash
sudo systemctl enable websystem
sudo systemctl start websystem
sudo systemctl status websystem
```

## 9. 문제 해결

### 9.1 데이터베이스 연결 오류
- MySQL 서버가 실행 중인지 확인
- 방화벽에서 MySQL 포트가 열려있는지 확인
- 사용자 권한이 올바른지 확인

### 9.2 프론트엔드 연결 오류
- 프록시 서버가 정상 실행되는지 확인
- Django 백엔드가 8000번 포트에서 실행되는지 확인
- CORS 설정이 올바른지 확인

### 9.3 권한 오류
- 파일 소유권과 권한 확인
- Python 가상환경 활성화 확인
- Node.js 버전 확인 (20.x 권장)

## 10. 보안 고려사항

### 10.1 내부 네트워크 전용
- 이 설정은 내부 네트워크 전용입니다
- 외부 인터넷에 노출하지 마세요
- 필요시 HTTPS 인증서 적용을 고려하세요

### 10.2 데이터베이스 보안
- 데이터베이스 접근 권한을 최소화하세요
- 정기적인 백업을 수행하세요
- 사용자 비밀번호 정책을 수립하세요

## 11. 추가 정보

### 11.1 로그 확인
```bash
# Django 로그 확인
tail -f /var/log/django.log

# 시스템 로그 확인
journalctl -u websystem -f
```

### 11.2 성능 최적화
- 프로덕션 환경에서는 DEBUG=False 설정
- 정적 파일 서빙을 위한 nginx 설정 고려
- 데이터베이스 연결 풀링 설정

이 가이드를 따라 진행하면 새로운 가상환경에서 WebSystemFrame 프로젝트를 성공적으로 실행할 수 있습니다.