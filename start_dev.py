#!/usr/bin/env python3
"""
Django + React 개발 서버 실행 스크립트
"""
import os
import subprocess
import sys
import threading
import time
import signal

def start_django():
    """Django 백엔드 서버를 시작합니다."""
    os.chdir('backend')
    
    # 마이그레이션 실행
    print("Django 마이그레이션 실행 중...")
    subprocess.run([sys.executable, 'manage.py', 'makemigrations'], check=False)
    subprocess.run([sys.executable, 'manage.py', 'migrate'], check=False)
    
    # Django 서버 실행
    print("Django 서버 시작 중... (포트 8000)")
    cmd = [sys.executable, 'manage.py', 'runserver', '0.0.0.0:8000']
    return subprocess.Popen(cmd, cwd='.')

def start_vite():
    """Vite 프론트엔드 서버를 시작합니다."""
    print("Vite 프론트엔드 서버 시작 중... (포트 5173)")
    cmd = ['npm', 'run', 'vite']
    return subprocess.Popen(cmd, cwd='.')

def main():
    """개발 서버들을 동시에 실행합니다."""
    print("=== Django + React 개발 서버 시작 ===")
    
    # 두 서버 프로세스 시작
    django_process = start_django()
    time.sleep(3)  # Django 서버가 먼저 시작되도록 대기
    vite_process = start_vite()
    
    # 종료 신호 처리
    def signal_handler(signum, frame):
        print("\n서버들을 종료합니다...")
        django_process.terminate()
        vite_process.terminate()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # 두 프로세스 모두 살아있는지 확인
        while True:
            if django_process.poll() is not None:
                print("Django 서버가 종료되었습니다.")
                break
            if vite_process.poll() is not None:
                print("Vite 서버가 종료되었습니다.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n키보드 인터럽트로 서버들을 종료합니다...")
    finally:
        django_process.terminate()
        vite_process.terminate()

if __name__ == '__main__':
    main()