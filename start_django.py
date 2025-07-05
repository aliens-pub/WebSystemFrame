#!/usr/bin/env python3
import os
import subprocess
import sys

def start_django():
    """Django 백엔드 서버를 시작합니다."""
    os.chdir('backend')
    
    # Django 서버 실행
    cmd = [sys.executable, 'manage.py', 'runserver', '0.0.0.0:8000']
    
    print("Django 백엔드 서버를 시작합니다...")
    print(f"실행 명령: {' '.join(cmd)}")
    
    try:
        process = subprocess.Popen(cmd)
        print(f"Django 서버가 포트 8000에서 시작되었습니다. (PID: {process.pid})")
        process.wait()
    except KeyboardInterrupt:
        print("\nDjango 서버를 종료합니다...")
        process.terminate()
    except Exception as e:
        print(f"에러 발생: {e}")

if __name__ == '__main__':
    start_django()