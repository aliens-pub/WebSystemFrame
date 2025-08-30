#!/usr/bin/env python3
"""
Guide_DB 샘플 데이터 생성 스크립트
"""
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'business_system.settings')
django.setup()

from api.models import GuideDB

def create_guide_db_sample_data():
    """Guide_DB에 샘플 데이터 생성"""
    
    # 기존 데이터 삭제
    GuideDB.objects.all().delete()
    print("기존 Guide_DB 데이터를 모두 삭제했습니다.")
    
    sample_data = [
        {
            'item': '포트 번호 변경',
            'standard_TAT': 2,
            'comment': '네트워크 담당자와 합의 필요',
            'reference': '담당자:정통신',
            'phpsi_1': 'IP_ADDRESS',
            'phpsi_2': 'PORT_NUMBER',
            'phpsi_3': None,
            'phpsi_4': None,
            'phpsi_5': None,
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': '데이터베이스 스키마 변경',
            'standard_TAT': 5,
            'comment': 'DBA 승인 후 진행, 백업 필수',
            'reference': '담당자:김데이터베이스',
            'phpsi_1': 'TABLE_NAME',
            'phpsi_2': 'COLUMN_NAME',
            'phpsi_3': 'DATA_TYPE',
            'phpsi_4': 'CONSTRAINT',
            'phpsi_5': None,
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': '서버 접근 권한 변경',
            'standard_TAT': 1,
            'comment': '보안팀 검토 필요',
            'reference': '담당자:이보안',
            'phpsi_1': 'USER_ID',
            'phpsi_2': 'PERMISSION_LEVEL',
            'phpsi_3': 'SERVER_GROUP',
            'phpsi_4': None,
            'phpsi_5': None,
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': 'API 엔드포인트 추가',
            'standard_TAT': 3,
            'comment': '개발팀 리뷰 및 테스트 필요',
            'reference': '담당자:박개발',
            'phpsi_1': 'ENDPOINT_URL',
            'phpsi_2': 'HTTP_METHOD',
            'phpsi_3': 'REQUEST_BODY',
            'phpsi_4': 'RESPONSE_FORMAT',
            'phpsi_5': 'AUTH_TYPE',
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': '로그 보관 정책 변경',
            'standard_TAT': 7,
            'comment': '규정 검토 후 시스템 설정 변경',
            'reference': '담당자:최규정',
            'phpsi_1': 'LOG_TYPE',
            'phpsi_2': 'RETENTION_PERIOD',
            'phpsi_3': 'STORAGE_PATH',
            'phpsi_4': 'COMPRESSION_TYPE',
            'phpsi_5': None,
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': '백업 스케줄 조정',
            'standard_TAT': 2,
            'comment': '시스템 영향도 분석 필요',
            'reference': '담당자:한백업',
            'phpsi_1': 'BACKUP_TYPE',
            'phpsi_2': 'SCHEDULE_CRON',
            'phpsi_3': 'TARGET_PATH',
            'phpsi_4': 'RETENTION_COUNT',
            'phpsi_5': None,
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': '모니터링 알림 임계값 변경',
            'standard_TAT': 1,
            'comment': '운영팀 검토 후 즉시 적용',
            'reference': '담당자:강모니터',
            'phpsi_1': 'METRIC_NAME',
            'phpsi_2': 'THRESHOLD_VALUE',
            'phpsi_3': 'CONDITION',
            'phpsi_4': 'ALERT_CHANNEL',
            'phpsi_5': None,
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': '배치 작업 시간 변경',
            'standard_TAT': 3,
            'comment': '업무 영향도 검토 필요',
            'reference': '담당자:윤배치',
            'phpsi_1': 'JOB_NAME',
            'phpsi_2': 'NEW_SCHEDULE',
            'phpsi_3': 'DEPENDENCY_CHECK',
            'phpsi_4': 'RESOURCE_USAGE',
            'phpsi_5': None,
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': '방화벽 규칙 추가',
            'standard_TAT': 4,
            'comment': '보안팀 승인 및 테스트 필요',
            'reference': '담당자:임방화벽',
            'phpsi_1': 'SOURCE_IP',
            'phpsi_2': 'DESTINATION_IP',
            'phpsi_3': 'PORT_RANGE',
            'phpsi_4': 'PROTOCOL',
            'phpsi_5': 'ACTION',
            'phpsi_6': 'PRIORITY',
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        },
        {
            'item': '계정 권한 등급 변경',
            'standard_TAT': 2,
            'comment': '상급자 승인 필요',
            'reference': '담당자:조권한',
            'phpsi_1': 'USER_ACCOUNT',
            'phpsi_2': 'CURRENT_ROLE',
            'phpsi_3': 'NEW_ROLE',
            'phpsi_4': 'APPROVAL_PATH',
            'phpsi_5': 'EFFECTIVE_DATE',
            'phpsi_6': None,
            'phpsi_7': None,
            'phpsi_8': None,
            'phpsi_9': None,
            'phpsi_10': None
        }
    ]
    
    created_count = 0
    for data in sample_data:
        try:
            guide_item = GuideDB.objects.create(**data)
            print(f"[OK] Guide_DB 생성: {guide_item.item} (TAT: {guide_item.standard_TAT}일)")
            created_count += 1
        except Exception as e:
            print(f"[ERROR] Guide_DB 생성 실패: {data['item']} - {e}")
    
    print(f"\n총 {created_count}개의 Guide_DB 샘플 데이터가 생성되었습니다.")

if __name__ == '__main__':
    create_guide_db_sample_data()