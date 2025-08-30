#!/usr/bin/env python3
"""
종합적인 샘플 데이터 생성 스크립트
모든 기능을 시연할 수 있도록 필요한 테이블들에 예시 데이터를 생성합니다.
"""

import os
import django
import sys
from datetime import datetime, timedelta
import random

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'business_system.settings')
django.setup()

from api.models import Employee, EmpInfo, EmailTemplate, RequestSubmission, EmpApprovalRole

def clear_existing_data():
    """기존 데이터 정리"""
    print("기존 데이터 정리 중...")
    Employee.objects.all().delete()
    EmpInfo.objects.all().delete()
    EmailTemplate.objects.all().delete()
    RequestSubmission.objects.all().delete()
    EmpApprovalRole.objects.all().delete()
    print("기존 데이터 정리 완료")

def create_emp_info_data():
    """직원 정보 생성"""
    print("직원 정보 생성 중...")
    
    departments = ['개발팀', '기획팀', '운영팀', 'QA팀', '디자인팀', '마케팅팀', '영업팀', '재무팀']
    names = [
        '김철수', '이영희', '박민수', '정소영', '최대호', '한미래', '강지훈', '윤서연',
        '임성수', '조미영', '송현우', '배지은', '오세진', '서하늘', '안정훈', '노은별',
        '문지현', '유재석', '홍길동', '백설공주', '심청이', '흥부', '놀부', '콩쥐',
        '팥쥐', '신데렐라', '백조', '미녀', '야수', '알라딘'
    ]
    
    employees = []
    for i in range(30):
        emp = EmpInfo.objects.create(
            name=names[i % len(names)],
            department=random.choice(departments),
            emp_id=f"EMP{2025}{str(i+1).zfill(3)}"
        )
        employees.append(emp)
        print(f"직원정보: {emp.name} ({emp.emp_id}) - {emp.department}")
    
    return employees

def create_employee_data():
    """Employee 테이블 데이터 생성 (로그인 사용자)"""
    print("\n로그인 사용자 계정 생성 중...")
    
    # 관리자 계정
    admin = Employee.objects.create(
        username="시스템관리자",
        role="MANAGER"
    )
    print(f"관리자: {admin.username} - {admin.role}")
    
    # 일반 사용자들 (EmpInfo와 연동)
    emp_infos = list(EmpInfo.objects.all()[:15])  # 처음 15명만 사용자 계정 생성
    for emp_info in emp_infos:
        role = "MANAGER" if random.random() < 0.3 else "ENGINEER"  # 30% 확률로 매니저
        employee = Employee.objects.create(
            username=emp_info.name,
            role=role
        )
        print(f"사용자: {employee.username} - {employee.role}")

def create_email_templates():
    """이메일 템플릿 생성"""
    print("\n이메일 템플릿 생성 중...")
    
    departments = EmpInfo.objects.values_list('department', flat=True).distinct()
    
    template_contents = {
        '개발팀': """
        <p>안녕하세요, <strong>개발팀</strong>입니다.</p>
        <p>아래와 같이 개발 업무를 의뢰드립니다.</p>
        <p><br></p>
        <p><strong>■ 개발 요청사항:</strong></p>
        <p>- 기능 구현 또는 버그 수정</p>
        <p><br></p>
        <p><strong>■ 예상 소요시간:</strong></p>
        <p><br></p>
        <p><strong>■ 우선순위:</strong> 높음/보통/낮음</p>
        <p><br></p>
        <p><strong>■ 참고사항:</strong></p>
        <p>- 관련 문서나 참고 자료</p>
        <p><br></p>
        <p>검토 후 회신 부탁드립니다.</p>
        """,
        '기획팀': """
        <p>안녕하세요, <strong>기획팀</strong>입니다.</p>
        <p>아래와 같이 기획 업무를 의뢰드립니다.</p>
        <p><br></p>
        <p><strong>■ 기획 요청사항:</strong></p>
        <p>- 서비스 기획 또는 개선안</p>
        <p><br></p>
        <p><strong>■ 목표 달성시점:</strong></p>
        <p><br></p>
        <p><strong>■ 예상 효과:</strong></p>
        <p><br></p>
        <p><strong>■ 참고사항:</strong></p>
        <p>- 시장조사 자료나 경쟁사 분석</p>
        <p><br></p>
        <p>협의 후 진행 부탁드립니다.</p>
        """,
        '운영팀': """
        <p>안녕하세요, <strong>운영팀</strong>입니다.</p>
        <p>아래와 같이 시스템 운영 업무를 의뢰드립니다.</p>
        <p><br></p>
        <p><strong>■ 운영 요청사항:</strong></p>
        <p>- 서버 관리 또는 배포 작업</p>
        <p><br></p>
        <p><strong>■ 작업 일정:</strong></p>
        <p><br></p>
        <p><strong>■ 영향도:</strong> 전체/부분</p>
        <p><br></p>
        <p><strong>■ 롤백 계획:</strong></p>
        <p><br></p>
        <p>사전 검토 부탁드립니다.</p>
        """,
        'QA팀': """
        <p>안녕하세요, <strong>QA팀</strong>입니다.</p>
        <p>아래와 같이 품질보증 업무를 의뢰드립니다.</p>
        <p><br></p>
        <p><strong>■ 테스트 요청사항:</strong></p>
        <p>- 기능 테스트 또는 성능 테스트</p>
        <p><br></p>
        <p><strong>■ 테스트 범위:</strong></p>
        <p><br></p>
        <p><strong>■ 완료 목표일:</strong></p>
        <p><br></p>
        <p><strong>■ 테스트 환경:</strong></p>
        <p><br></p>
        <p>테스트 계획 수립 후 진행 부탁드립니다.</p>
        """
    }
    
    for dept in departments:
        template_content = template_contents.get(dept, f"""
        <p>안녕하세요, <strong>{dept}</strong>입니다.</p>
        <p>아래와 같이 업무를 의뢰드립니다.</p>
        <p><br></p>
        <p><strong>■ 의뢰 내용:</strong></p>
        <p><br></p>
        <p><strong>■ 요청 기한:</strong></p>
        <p><br></p>
        <p><strong>■ 우선순위:</strong></p>
        <p><br></p>
        <p><strong>■ 참고사항:</strong></p>
        <p><br></p>
        <p>감사합니다.</p>
        """)
        
        template = EmailTemplate.objects.create(
            department=dept,
            subject=f"[{dept}] 업무 의뢰",
            content=template_content.strip(),
            auto_send=random.choice([True, False]),
            require_approval=random.choice([True, False]),
            cc_manager=True
        )
        print(f"템플릿: {template.department} - 자동발송: {template.auto_send}, 승인필요: {template.require_approval}")

def create_request_submissions():
    """의뢰 상신 데이터 생성"""
    print("\n의뢰 상신 데이터 생성 중...")
    
    departments = list(EmpInfo.objects.values_list('department', flat=True).distinct())
    employees = list(Employee.objects.all())
    statuses = ['대기중', '진행중', '완료', '보류']
    
    line_ids = [f"LINE-{str(i+1).zfill(3)}" for i in range(10)]
    ppids = [f"PP-{str(i+1).zfill(3)}" for i in range(5)]
    eqpids = [f"EQP-{str(i+1).zfill(3)}" for i in range(8)]
    change_items = ['설정값 변경', '프로세스 파라미터 조정', '레시피 수정', '알람 임계값 변경', '운전 조건 변경']
    
    sample_contents = [
        "긴급 시스템 점검이 필요합니다. 성능 저하 이슈가 발견되어 즉시 대응이 필요한 상황입니다.",
        "신규 기능 개발 요청드립니다. 사용자 피드백을 반영한 개선사항 적용이 필요합니다.",
        "데이터베이스 최적화 작업을 진행해주시기 바랍니다. 쿼리 성능이 저하되고 있습니다.",
        "보안 패치 적용을 요청드립니다. 최신 보안 업데이트가 필요한 상황입니다.",
        "사용자 인터페이스 개선 작업이 필요합니다. UX/UI 개선점을 적용해주시기 바랍니다.",
    ]
    
    for i in range(20):  # 20개의 의뢰 상신 생성
        submitter = random.choice(employees)
        dept = random.choice(departments)
        
        # 시간 분산 (최근 30일)
        submitted_time = datetime.now() - timedelta(days=random.randint(0, 30))
        
        request = RequestSubmission.objects.create(
            department=dept,
            title=f"[{random.choice(line_ids)}_{random.choice(ppids)}_{random.choice(eqpids)}_{random.choice(change_items)}]",
            content=random.choice(sample_contents),
            submitted_by=submitter.username,
            submitted_at=submitted_time,
            line_id=random.choice(line_ids),
            ppid=random.choice(ppids),
            eqpid=random.choice(eqpids),
            change_request_items=random.choice(change_items),
            status=random.choice(statuses),
            assignee=random.choice([None, random.choice(employees).username])
        )
        
        print(f"의뢰상신: {request.title[:30]}... - {request.department} ({request.status})")

def create_approval_roles():
    """결재 역할 데이터 생성"""
    print("\n결재 역할 데이터 생성 중...")
    
    employees = EmpInfo.objects.all()[:15]  # 처음 15명에 대해서만 결재 역할 부여
    roles = ['결재', '병렬결재', '합의', '병렬합의', '통보']
    
    for emp in employees:
        role = random.choice(roles)
        approval_role = EmpApprovalRole.objects.create(
            name=emp.name,
            emp_id=emp.emp_id,
            role=role
        )
        print(f"결재역할: {approval_role.name} ({approval_role.emp_id}) - {approval_role.role}")

def main():
    """메인 실행 함수"""
    print("=== 종합 샘플 데이터 생성 시작 ===")
    
    # 1. 기존 데이터 정리
    clear_existing_data()
    
    # 2. 직원 정보 생성
    create_emp_info_data()
    
    # 3. 로그인 사용자 생성
    create_employee_data()
    
    # 4. 이메일 템플릿 생성
    create_email_templates()
    
    # 5. 의뢰 상신 데이터 생성
    create_request_submissions()
    
    # 6. 결재 역할 생성
    create_approval_roles()
    
    print("\n=== 데이터 생성 완료 ===")
    print(f"Employee: {Employee.objects.count()}개")
    print(f"EmpInfo: {EmpInfo.objects.count()}개")
    print(f"EmailTemplate: {EmailTemplate.objects.count()}개")
    print(f"RequestSubmission: {RequestSubmission.objects.count()}개")
    print(f"EmpApprovalRole: {EmpApprovalRole.objects.count()}개")
    
    print("\n사용 가능한 테스트 계정:")
    for emp in Employee.objects.all()[:10]:
        print(f"  - {emp.username} ({emp.role})")

if __name__ == '__main__':
    main()