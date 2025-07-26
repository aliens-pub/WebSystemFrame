# 📊 Business Management System - Database & Page Visualization

이 문서는 현재 관리 중인 데이터베이스 구조와 각 페이지에서의 데이터 활용 방식을 시각화한 draw.io 다이어그램들을 포함합니다.

## 📁 다이어그램 파일 목록

### 1. 🗄️ Database Schema (`database-schema.drawio`)
**데이터베이스 스키마 구조**
- 5개 주요 테이블 구조 상세 정보
- 테이블 간 관계 (emp_id 연결)
- 필드 타입 및 제약조건
- Primary Key, Unique 제약조건 표시

**포함된 테이블:**
- `Employee`: 사용자 인증 및 권한 관리
- `EmpInfo`: 직원 상세 정보 및 부서 정보
- `EmailTemplate`: 부서별 이메일 템플릿
- `RequestSubmission`: 의뢰 상신 기록
- `EmpApprovalRole`: 직원별 결재 역할

### 2. 🔄 Page Data Flow (`page-data-flow.drawio`)
**페이지별 데이터 활용 흐름**
- 각 페이지에서 사용하는 API 엔드포인트
- 데이터베이스 테이블 연결 관계
- 사용자 권한별 접근 제어
- 데이터 흐름 방향 표시

**주요 페이지:**
- **Dashboard**: 시스템 통계 및 사용자 정보
- **Menu1**: 의뢰 목록 조회 (페이지네이션)
- **Menu2**: 의뢰 상신 (부서 검색, 템플릿 로드)
- **Admin**: 사용자 관리 (MANAGER 권한)
- **Settings**: 시스템 설정 관리

### 3. 🔗 API Endpoints Mapping (`api-endpoints-mapping.drawio`)
**API 엔드포인트와 데이터베이스 매핑**
- 모든 REST API 엔드포인트 목록
- 각 API가 사용하는 데이터베이스 테이블
- HTTP 메서드별 분류 (GET, POST, PUT, DELETE)
- 페이지별 API 사용 현황

**API 카테고리:**
- **Authentication**: 로그인, 사용자 확인
- **Employee Management**: 직원/부서 정보 관리
- **Request Management**: 의뢰 상신 및 조회
- **Email Templates**: 이메일 양식 관리
- **Approval Roles**: 결재 경로 설정

### 4. 🏢 System Overview (`system-overview.drawio`)
**전체 시스템 아키텍처 개요**
- Frontend, Backend, Database 레이어 구조
- 기술 스택 상세 정보
- 사용자 권한 체계 (ENGINEER/MANAGER)
- 주요 기능 및 데이터 흐름

**시스템 구성:**
- **Frontend Layer**: React + TypeScript + shadcn/ui
- **API Layer**: RESTful APIs
- **Backend Layer**: Django + DRF
- **Database Layer**: PostgreSQL

## 🎯 데이터 활용 패턴

### 📋 조회 패턴
```
Menu1 → GET /api/request-submissions → RequestSubmission 테이블
Menu2 → GET /api/emp-info → EmpInfo 테이블 (부서 목록)
```

### ✉️ 생성 패턴
```
Menu2 → POST /api/request-submissions → RequestSubmission 테이블
Settings → POST /api/email-templates → EmailTemplate 테이블
```

### ⚙️ 관리 패턴
```
Admin → PUT /api/admin/users/{id}/role → Employee 테이블
Settings → PUT /api/approval-roles → EmpApprovalRole 테이블
```

## 🔐 권한 기반 접근 제어

### 👨‍💻 ENGINEER 권한
- Dashboard, Menu1, Menu2 접근 가능
- 의뢰 조회 및 상신 기능
- 기본 사용자 기능

### 👨‍💼 MANAGER 권한
- 모든 ENGINEER 기능 + 관리 기능
- Admin, Settings 전체 접근
- 사용자 관리 및 시스템 설정

## 📊 주요 관계

```
EmpInfo (emp_id) ←→ EmpApprovalRole (emp_id)
└── 직원 정보와 결재 역할 연결

EmailTemplate (department) ←→ Menu2 부서 선택
└── 부서별 이메일 템플릿 자동 로드

Employee (username) ←→ 모든 API 인증
└── 세션 기반 사용자 인증
```

## 🔄 데이터 생명주기

1. **사용자 등록**: Employee 테이블 생성
2. **직원 정보 추가**: EmpInfo 테이블 입력
3. **결재 역할 설정**: EmpApprovalRole 테이블 연결
4. **이메일 템플릿 설정**: EmailTemplate 테이블 구성
5. **의뢰 상신**: RequestSubmission 테이블 기록

---

*이 다이어그램들은 draw.io에서 열어서 상세히 확인할 수 있으며, 시스템 이해와 개발에 활용하실 수 있습니다.*