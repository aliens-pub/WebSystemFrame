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
- July 7, 2025: 설정 페이지 모듈화 완료 - Settings.tsx에서 의뢰 양식 설정, 결재 경로 설정, 권한 설정을 별도 파일로 분리하여 유지보수성 향상, 독립적인 라우팅 구조 구현
- July 7, 2025: 직원 정보 시스템 구현 완료 - PostgreSQL emp_info 테이블 생성, Django DRF API 엔드포인트 구현, Menu2에서 부서별 직원 조회 기능 추가 (20명 예시 데이터 포함)
- July 4, 2025: 프록시 서버 및 로그인 오류 해결 완료 - Django URL 패턴 수정, CSRF 비활성화, 요청 본문 파싱 추가로 로그인 API 정상 작동, admin.system 특별 관리자 계정 추가 (MANAGER 권한 자동 부여)
- July 4, 2025: Django 백엔드 설정 수정 및 앱 실행 성공 - MySQL에서 PostgreSQL로 데이터베이스 변경, 프록시 서버 설정으로 Django+React 통합 개발 환경 구축 완료
- July 4, 2025: Express.js에서 Django로 백엔드 완전 마이그레이션 완료 - Employee 모델 구현, 세션 기반 인증 시스템 적용
- July 2, 2025: Docker 컨테이너 지원 추가 - 복잡한 의존성 설치 없이 Linux/Debian 환경에서 한번에 실행 가능
- June 27, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.