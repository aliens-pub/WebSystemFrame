# Business Management System

## Overview

This is a full-stack business management system built with React and Django. The application features role-based authentication with two user roles (MANAGER and ENGINEER), a clean modern UI using shadcn/ui components, and a scalable architecture designed for business operations management. The system uses PostgreSQL database with employee table for user management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Django 5.2.4 with Django REST Framework
- **Language**: Python 3.11+
- **Database**: PostgreSQL with psycopg2-binary connector
- **API Design**: RESTful endpoints with proper error handling
- **Authentication**: Django session-based authentication
- **Development**: Django development server on port 8000

### Authentication System
- **Strategy**: Simple token-based authentication (mock JWT tokens)
- **User Management**: Username-based login with automatic user creation
- **Role System**: Two-tier role system (ENGINEER/MANAGER)
- **Authorization**: Route-level access control based on user roles

## Key Components

### Database Schema
- **Users Table**: Stores user information with roles and timestamps
- **Schema Validation**: Zod schemas for type-safe data validation
- **Migrations**: Drizzle Kit for database schema management

### Frontend Components
- **Authentication**: LoginModal for user authentication
- **Layout**: Header with navigation and user profile
- **Admin Panel**: Role management interface for administrators
- **Page Components**: Dashboard, Menu1-4 pages with role-based access
- **UI Components**: Complete shadcn/ui component library

### Backend Services
- **Storage Layer**: DatabaseStorage class for data persistence
- **Route Handlers**: Express routes for authentication and user management
- **Database Connection**: Neon serverless connection with connection pooling

## Data Flow

1. **User Authentication**: Users log in with username, system creates account if needed
2. **Token Management**: Client stores authentication token in localStorage
3. **API Requests**: All requests include authorization headers when authenticated
4. **Role Verification**: Server validates user roles for protected endpoints
5. **State Synchronization**: TanStack Query manages client-server state synchronization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **wouter**: Lightweight React router
- **react-hook-form**: Form state management with validation

### Development Tools
- **vite**: Modern build tool with HMR
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server (port 5173) with Django backend (port 8000)
- **Proxy Server**: Node.js proxy server on port 5000 routes API calls to Django and frontend to Vite
- **Hot Reload**: Full-stack hot module replacement
- **Database**: PostgreSQL database instance with dj-database-url integration

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: Django production server with proper WSGI configuration
- **Deployment Target**: Replit autoscale deployment
- **Port Configuration**: Proxy server runs on port 5000, exposed as port 80

### Environment Configuration
- **Database**: Requires DATABASE_URL environment variable
- **Node Modules**: nodejs-20, web, and postgresql-16 Replit modules
- **Build Process**: npm run build creates production-ready assets

## Docker 배포

### Docker 파일 구성
- **Dockerfile**: 프로덕션용 컨테이너 빌드 설정
- **Dockerfile.dev**: 개발용 핫 리로드 지원 컨테이너
- **docker-compose.yml**: PostgreSQL과 함께 전체 시스템 실행
- **docker-compose.dev.yml**: 개발 환경용 구성
- **init.sql**: 데이터베이스 초기화 스크립트

### 빠른 실행
```bash
# 프로덕션 모드
docker-compose up -d

# 개발 모드
docker-compose -f docker-compose.dev.yml up -d
```

### 특징
- Node.js 20 Alpine 기반 경량 이미지
- PostgreSQL 16 데이터베이스 자동 설정
- 볼륨을 통한 데이터 영속성
- 헬스체크를 통한 의존성 관리
- 개발용 핫 리로드 지원

## Changelog

Changelog:
- August 15, 2025: CKEditor5 리치 텍스트 에디터 완전 구현 - TipTap에서 CKEditor5 Decoupled Document 빌드로 최종 전환, Excel 표 붙여넣기 시 구조 완벽 보존, 표 셀 직접 편집 기능, 행/열 추가/삭제/병합, 이미지 업로드 어댑터, Office 문서 붙여넣기 지원, 분리된 툴바 구조로 전문적 UI 제공, TipTap 관련 파일 및 패키지 완전 정리
- August 15, 2025: Menu2 리치 텍스트 에디터 최적화 완료 - React Quill로 교체, 클립보드 이미지 붙여넣기 기능 구현 (Base64 변환), better-table 모듈 제거로 안정성 향상, 기본 표 기능 제공
- August 15, 2025: Excel 표 편집 문제 완전 해결 - Menu2에서 Excel 표 붙여넣기 시 편집 가능한 텍스트 형식으로 변환, 헤더와 데이터 행 구분, 파이프(|) 문자로 컬럼 구분하여 가독성 향상, React Quill 표 편집 제약 우회
- August 15, 2025: 전문 풀스택 개발자 요청 완료 - Menu1 테이블 UI 완전 최적화(가로 스크롤 제거, 반응형 컬럼 너비, 텍스트 truncate), Menu2 Excel 표 붙여넣기 고급 기능 구현(첫 행 헤더 자동 인식, 스타일링 개선, 표 삽입 버튼 추가), quill-better-table 모듈 제거로 안정성 향상
- August 15, 2025: Menu1 삭제 기능 및 테이블 최적화, Menu2 표 붙여넣기 기능 추가 - Menu1에 본인 작성 의뢰 삭제 기능 구현, 테이블 컬럼 너비 최적화로 횡스크롤 제거, Menu2에 엑셀 표 복사 붙여넣기 기능 추가 (탭 구분 텍스트를 HTML 테이블로 자동 변환)
- August 15, 2025: Menu2 리치 텍스트 에디터 최적화 완료 - React Quill로 교체, 클립보드 이미지 붙여넣기 기능 구현 (Base64 변환), better-table 모듈 제거로 안정성 향상, 기본 표 기능 제공
- July 26, 2025: Employee number authentication system 구현 완료 - employee 테이블에 employee_number 컬럼 추가, 기존 레코드들에 EMP 형식 사번 할당, 로그인 시스템을 사번 기반으로 변경, emp_info 테이블과 연동한 자동 사용자명 동기화 기능 추가, 프론트엔드 로그인 폼을 사번 입력으로 변경
- July 24, 2025: 결재 경로 설정 시스템 구현 완료 - 부서별 직원 결재 역할 지정 기능 추가, emp_approval_role 테이블 생성하여 직원별 결재역할(결재/병렬결재/합의/병렬합의/통보) 저장, 프론트엔드에서 드롭다운으로 역할 선택 및 저장 기능 구현, department 필드 제거하여 단순화
- July 22, 2025: 의뢰 상신 목록 조회 시스템 완료 - Menu1에서 상신된 request_submissions를 페이지네이션으로 목록 조회, 최신순 정렬, 한 페이지당 10개 항목 표시, 부서별 배지와 상신자 정보 표시, 검색 가능한 부서 선택 드롭다운 추가
- July 22, 2025: 의뢰 상신 페이지 검색 기능 강화 - Menu2 부서 선택에 Command 컴포넌트 기반 실시간 검색 기능 추가, Popover와 키보드 네비게이션 지원, 체크 아이콘으로 선택 상태 표시
- July 9, 2025: 부서별 이메일 템플릿 데이터베이스 연동 완료 - EmailTemplate 모델 추가, API 엔드포인트 구현, 프론트엔드에서 템플릿 저장/로드 기능 구현, 하드코딩 제거하고 실제 데이터베이스 연동으로 변경
- July 9, 2025: 의뢰 양식 설정 페이지 구현 완료 - Menu2 부서 목록 컴포넌트 재사용하여 부서별 이메일 템플릿 관리 기능 추가, 개발팀/마케팅팀/영업팀 등 부서별 맞춤형 기본 템플릿 제공, 검색 기능 및 템플릿 설정 옵션 포함
- July 8, 2025: Menu2 부서 검색 기능 및 세션 유지 문제 완전 해결 - 부서명 포함 검색 지원, Django 세션 강제 저장 및 30일 만료 설정, 프론트엔드 세션 확인 주기 제거하여 안정적인 로그인 상태 유지
- July 8, 2025: 세션 타임아웃 문제 해결 - Django 세션 설정 최적화 (7일 유지, 요청마다 갱신), 프론트엔드 세션 상태 자동 확인 및 만료 시 자동 로그아웃 구현
- July 7, 2025: 설정 페이지 모듈화 완료 - Settings.tsx에서 의뢰 양식 설정, 결재 경로 설정, 권한 설정을 별도 파일로 분리하여 유지보수성 향상, 독립적인 라우팅 구조 구현
- July 7, 2025: 직원 정보 시스템 구현 완료 - PostgreSQL emp_info 테이블 생성, Django DRF API 엔드포인트 구현, Menu2에서 부서별 직원 조회 기능 추가 (20명 예시 데이터 포함)
- July 4, 2025: 프록시 서버 및 로그인 오류 해결 완료 - Django URL 패턴 수정, CSRF 비활성화, 요청 본문 파싱 추가로 로그인 API 정상 작동, admin.system 특별 관리자 계정 추가 (MANAGER 권한 자동 부여)
- July 4, 2025: Django 백엔드 설정 수정 및 앱 실행 성공 - MySQL에서 PostgreSQL로 데이터베이스 변경, 프록시 서버 설정으로 Django+React 통합 개발 환경 구축 완료
- July 4, 2025: Express.js에서 Django로 백엔드 완전 마이그레이션 완료 - Employee 모델 구현, 세션 기반 인증 시스템 적용
- July 2, 2025: Docker 컨테이너 지원 추가 - 복잡한 의존성 설치 없이 Linux/Debian 환경에서 한번에 실행 가능
- June 27, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.