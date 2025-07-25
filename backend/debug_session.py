#!/usr/bin/env python
"""
Django 세션 디버깅 스크립트
사용법: python debug_session.py
"""

import os
import sys
import django
from pathlib import Path

# Django 설정 경로 추가
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'business_system.settings')
django.setup()

from django.contrib.sessions.models import Session
from django.utils import timezone
from api.models import Employee

def debug_sessions():
    print("=== Django 세션 디버깅 ===\n")
    
    # 1. 현재 활성 세션 수
    active_sessions = Session.objects.filter(expire_date__gt=timezone.now())
    print(f"활성 세션 수: {active_sessions.count()}")
    
    # 2. 최근 5개 세션 상세 정보
    print("\n=== 최근 활성 세션 목록 ===")
    recent_sessions = active_sessions.order_by('-expire_date')[:5]
    
    for i, session in enumerate(recent_sessions, 1):
        print(f"\n{i}. 세션 키: {session.session_key}")
        print(f"   만료일: {session.expire_date}")
        
        try:
            session_data = session.get_decoded()
            print(f"   세션 데이터: {session_data}")
            
            # employee_id가 있으면 직원 정보도 출력
            employee_id = session_data.get('employee_id')
            if employee_id:
                try:
                    employee = Employee.objects.get(id=employee_id)
                    print(f"   연결된 직원: {employee.username} ({employee.role})")
                except Employee.DoesNotExist:
                    print(f"   경고: employee_id {employee_id}에 해당하는 직원이 없음")
                    
        except Exception as e:
            print(f"   오류: 세션 데이터 디코딩 실패 - {e}")
    
    # 3. 모든 직원 목록
    print("\n=== 등록된 직원 목록 ===")
    employees = Employee.objects.all().order_by('id')
    for emp in employees:
        print(f"ID: {emp.id:2d} | {emp.username:15s} | {emp.role:8s} | 생성일: {emp.created_at.strftime('%Y-%m-%d %H:%M')}")

if __name__ == "__main__":
    debug_sessions()