# Docker로 WebSystemFrame 실행하기

이 프로젝트는 Docker를 사용하여 복잡한 의존성 설치 없이 어떤 Linux/Debian 환경에서도 쉽게 실행할 수 있습니다.

## 빠른 시작

### 1. 필요한 프로그램 설치

Ubuntu/Debian 시스템에서:
```bash
# Docker 설치
sudo apt update
sudo apt install docker.io docker-compose -y

# Docker 서비스 시작
sudo systemctl start docker
sudo systemctl enable docker

# 현재 사용자를 docker 그룹에 추가 (재로그인 필요)
sudo usermod -aG docker $USER
```

### 2. 프로젝트 실행

```bash
# 프로젝트 폴더로 이동
cd WebSystemFrame

# Docker Compose로 실행 (자동으로 빌드하고 시작)
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 3. 접속하기

브라우저에서 `http://localhost:5000`으로 접속하세요.

기본 관리자 계정:
- 사용자명: `admin`
- 역할: MANAGER

## 개발 모드로 실행

코드를 수정하면서 개발하려면 개발 모드를 사용하세요:

```bash
# 개발 모드로 실행
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f app
```

## 주요 명령어

```bash
# 서비스 중지
docker-compose down

# 컨테이너와 볼륨까지 완전히 삭제
docker-compose down -v

# 이미지 다시 빌드
docker-compose build --no-cache

# 데이터베이스만 실행
docker-compose up postgres -d
```

## 문제 해결

### 포트 충돌 오류
이미 포트 5000이나 5432가 사용 중이라면:

```bash
# 사용 중인 포트 확인
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :5432

# 프로세스 종료 후 다시 시도
sudo kill -9 <PID>
```

### 권한 오류
Docker 명령어에 `sudo`가 필요하다면:

```bash
# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER

# 로그아웃 후 다시 로그인
exit
```

### 컨테이너 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs app
docker-compose logs postgres

# 실시간 로그 보기
docker-compose logs -f
```

## 프로덕션 배포

실제 서버에 배포할 때는:

1. 환경변수 파일 생성:
```bash
# .env 파일 생성
cat > .env << EOF
POSTGRES_PASSWORD=your-secure-password
DATABASE_URL=postgresql://postgres:your-secure-password@postgres:5432/business_system
EOF
```

2. 보안 설정:
```bash
# 방화벽 설정 (포트 5000만 허용)
sudo ufw allow 5000
sudo ufw enable
```

3. 백그라운드 실행:
```bash
docker-compose up -d
```

## 백업과 복원

### 데이터베이스 백업
```bash
docker-compose exec postgres pg_dump -U postgres business_system > backup.sql
```

### 데이터베이스 복원
```bash
docker-compose exec -T postgres psql -U postgres business_system < backup.sql
```