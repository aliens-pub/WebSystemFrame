#!/usr/bin/env python3
import os
import django
import random

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'business_system.settings')
django.setup()

from api.models import EmpInfo

# 샘플 데이터 생성
def create_sample_employees():
    # 기존 데이터 삭제
    EmpInfo.objects.all().delete()
    
    # 한국어 이름 예시
    korean_names = [
        "김민수", "이수지", "박재현", "정소영", "최동현",
        "한지민", "윤태영", "오혜진", "임성수", "조은아",
        "강호준", "송미라", "안정훈", "배서연", "노찬영",
        "홍나영", "유재석", "문지현", "신동욱", "고유진"
    ]
    
    # 부서 예시
    departments = [
        "개발팀", "디자인팀", "마케팅팀", "영업팀", "인사팀",
        "기획팀", "QA팀", "운영팀", "재무팀", "법무팀"
    ]
    
    # 20명의 직원 데이터 생성
    employees = []
    for i in range(20):
        name = random.choice(korean_names)
        department = random.choice(departments)
        emp_id = f"EMP{2025:04d}{i+1:03d}"  # EMP2025001, EMP2025002, ...
        
        employee = EmpInfo.objects.create(
            name=name,
            department=department,
            emp_id=emp_id
        )
        employees.append(employee)
        print(f"생성됨: {employee}")
    
    print(f"\n총 {len(employees)}명의 직원 데이터가 생성되었습니다.")

if __name__ == "__main__":
    create_sample_employees()