#!/usr/bin/env python3
"""
Nginx 프록시 서버를 포함한 개발 환경 실행 스크립트

이 스크립트는 다음을 순서대로 실행합니다:
1. Nginx 프록시 서버 (Docker) - Port 5500
2. Django Backend 서버 - Port 8000
3. Vite Frontend 서버 - Port 5173

사용법: python start_with_nginx.py
접속: http://localhost:5500 (통합 프록시)
"""

import os
import subprocess
import sys
import threading
import time
import signal
import platform

def run_command(command, description, cwd=None):
    """명령어 실행 함수"""
    print(f"\n🚀 {description}")
    print(f"명령어: {' '.join(command) if isinstance(command, list) else command}")
    
    try:
        if platform.system() == "Windows":
            # Windows에서는 shell=True 사용
            if isinstance(command, list):
                command = ' '.join(command)
            process = subprocess.Popen(
                command,
                shell=True,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
        else:
            # Unix 계열에서는 리스트 형태로 실행
            process = subprocess.Popen(
                command,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
        return process
    except Exception as e:
        print(f"❌ {description} 실행 실패: {e}")
        return None

def start_nginx():
    """Nginx 프록시 서버 시작"""
    print("🔧 Nginx 프록시 서버 시작 중...")
    
    # Docker Compose로 Nginx 실행
    nginx_process = run_command(
        ["docker", "compose", "-f", "docker-compose.nginx.yml", "up", "-d", "nginx"],
        "Nginx 프록시 서버 (Docker)",
        cwd="."
    )
    
    if nginx_process and nginx_process.returncode is None:
        # Docker compose 명령이 성공적으로 완료될 때까지 대기
        nginx_process.wait()
        print("✅ Nginx 프록시 서버가 시작되었습니다 (Port 5500)")
        return True
    else:
        print("❌ Nginx 시작 실패")
        return False

def start_django():
    """Django 백엔드 서버 시작"""
    print("\n🐍 Django 백엔드 서버 시작 중...")
    
    # 마이그레이션 실행
    migrate_process = run_command(
        ["python", "manage.py", "migrate"],
        "Django 마이그레이션",
        cwd="backend"
    )
    if migrate_process:
        migrate_process.wait()
    
    # Django 서버 실행
    django_process = run_command(
        ["python", "manage.py", "runserver", "0.0.0.0:8000"],
        "Django 백엔드 서버 (Port 8000)",
        cwd="backend"
    )
    
    if django_process:
        print("✅ Django 서버가 시작되었습니다")
        return django_process
    else:
        print("❌ Django 서버 시작 실패")
        return None

def start_vite():
    """Vite 프론트엔드 서버 시작"""
    print("\n⚡ Vite 프론트엔드 서버 시작 중...")
    
    vite_process = run_command(
        ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"],
        "Vite 프론트엔드 서버 (Port 5173)",
        cwd="."
    )
    
    if vite_process:
        print("✅ Vite 서버가 시작되었습니다")
        return vite_process
    else:
        print("❌ Vite 서버 시작 실패")
        return None

def stop_nginx():
    """Nginx 프록시 서버 중지"""
    print("\n🛑 Nginx 프록시 서버 중지 중...")
    stop_process = run_command(
        ["docker", "compose", "-f", "docker-compose.nginx.yml", "down"],
        "Nginx 프록시 서버 중지",
        cwd="."
    )
    if stop_process:
        stop_process.wait()
        print("✅ Nginx 프록시 서버가 중지되었습니다")

def monitor_process(process, name):
    """프로세스 모니터링 (로그 출력)"""
    if not process:
        return
        
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"[{name}] {line.rstrip()}")
    except:
        pass

def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("🚀 WebSystemFrame 개발 서버 (Nginx 프록시 포함) 시작")
    print("=" * 60)
    
    processes = []
    
    try:
        # 1. Nginx 프록시 서버 시작
        if not start_nginx():
            print("❌ Nginx 시작 실패로 인해 종료됩니다.")
            return
        
        time.sleep(2)  # Nginx가 시작될 시간을 줌
        
        # 2. Django 서버 시작
        django_process = start_django()
        if django_process:
            processes.append(('Django', django_process))
            
            # Django 로그 모니터링을 별도 스레드에서 실행
            django_thread = threading.Thread(
                target=monitor_process, 
                args=(django_process, "Django"),
                daemon=True
            )
            django_thread.start()
        
        time.sleep(3)  # Django가 시작될 시간을 줌
        
        # 3. Vite 서버 시작
        vite_process = start_vite()
        if vite_process:
            processes.append(('Vite', vite_process))
            
            # Vite 로그 모니터링을 별도 스레드에서 실행
            vite_thread = threading.Thread(
                target=monitor_process, 
                args=(vite_process, "Vite"),
                daemon=True
            )
            vite_thread.start()
        
        time.sleep(2)
        
        # 시작 완료 메시지
        print("\n" + "=" * 60)
        print("🎉 모든 서버가 시작되었습니다!")
        print("=" * 60)
        print("📍 서비스 접속 주소:")
        print("   🌐 통합 서비스 (Nginx): http://localhost:5500")
        print("   ⚡ Frontend (Vite):     http://localhost:5173")
        print("   🐍 Backend (Django):   http://localhost:8000")
        print("=" * 60)
        print("⚠️  서버를 중지하려면 Ctrl+C를 누르세요")
        print("=" * 60)
        
        # 서버 상태 모니터링
        while True:
            time.sleep(1)
            # 프로세스가 종료되었는지 확인
            for name, process in processes:
                if process.poll() is not None:
                    print(f"❌ {name} 서버가 예기치 않게 종료되었습니다.")
                    raise KeyboardInterrupt
                    
    except KeyboardInterrupt:
        print("\n🛑 서버 종료 중...")
        
        # 실행 중인 프로세스들 종료
        for name, process in processes:
            try:
                print(f"   {name} 서버 중지...")
                if platform.system() == "Windows":
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(process.pid)], 
                                 capture_output=True)
                else:
                    process.terminate()
                    process.wait(timeout=5)
            except:
                pass
        
        # Nginx 중지
        stop_nginx()
        
        print("✅ 모든 서버가 정상적으로 종료되었습니다.")
    
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        
        # 오류 시에도 정리 작업
        for name, process in processes:
            try:
                process.terminate()
            except:
                pass
        stop_nginx()

if __name__ == '__main__':
    main()