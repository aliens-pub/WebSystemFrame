from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.sessions.models import Session
from .models import Employee, EmpInfo, EmailTemplate, RequestSubmission, EmpApprovalRole, GuideDB
from .serializers import EmployeeSerializer, LoginSerializer, UpdateRoleSerializer, SystemStatsSerializer, EmpInfoSerializer, EmailTemplateSerializer, RequestSubmissionSerializer, EmpApprovalRoleSerializer, GuideDBSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        employee_number = serializer.validated_data['username']  # username field now contains employee_number
        
        # Special admin user gets MANAGER role (for deployment testing)
        default_role = 'MANAGER' if employee_number == 'EMP9999999' else 'ENGINEER'
        
        # Try to find existing employee by employee_number
        try:
            employee = Employee.objects.get(employee_number=employee_number)
            # If admin user already exists but not MANAGER, update auth
            if employee_number == 'EMP9999999' and employee.auth != 'MANAGER':
                employee.auth = 'MANAGER'
                employee.save()
        except Employee.DoesNotExist:
            # Create new employee
            # Try to get username from emp_info
            username = employee_number  # default to employee_number
            try:
                emp_info = EmpInfo.objects.get(emp_id=employee_number)
                username = emp_info.name
            except EmpInfo.DoesNotExist:
                pass
            
            employee = Employee.objects.create(
                username=username,
                employee_number=employee_number,
                auth=default_role
            )
        
        # Store employee info in session
        request.session['employee_id'] = employee.id
        request.session['employee_username'] = employee.username
        request.session['employee_role'] = employee.auth
        request.session['employee_number'] = employee.employee_number
        
        # Set session to not expire
        request.session.set_expiry(0)  # 0 means never expire (until browser closes if SESSION_EXPIRE_AT_BROWSER_CLOSE is True)
        request.session.save()
        
        # Return employee data with mock token
        return Response({
            'user': EmployeeSerializer(employee).data,
            'token': f'mock-jwt-{employee.id}'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def session_view(request):
    """세션 기반 인증을 위한 엔드포인트 - SSO 통합인증용"""
    employee_id = request.session.get('employee_id')
    if not employee_id:
        return Response({
            'authenticated': False
        })
    
    try:
        employee = Employee.objects.get(id=employee_id)
        return Response({
            'authenticated': True,
            'user': EmployeeSerializer(employee).data
        })
    except Employee.DoesNotExist:
        return Response({
            'authenticated': False
        })

@api_view(['GET'])
@permission_classes([AllowAny])
def current_user_view(request):
    employee_id = request.session.get('employee_id')
    if not employee_id:
        return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        employee = Employee.objects.get(id=employee_id)
        serializer = EmployeeSerializer(employee)
        return Response(serializer.data)
    except Employee.DoesNotExist:
        return Response({'error': '사용자를 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    request.session.flush()
    return Response({'message': '로그아웃되었습니다.'})

@api_view(['GET'])
@permission_classes([AllowAny])
def users_list_view(request):
    employee_id = request.session.get('employee_id')
    if not employee_id:
        return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        current_employee = Employee.objects.get(id=employee_id)
        # Only managers can view all users
        if current_employee.auth != 'MANAGER':
            return Response(
                {'message': '관리자만 접근할 수 있습니다.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        employees = Employee.objects.all()
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)
    except Employee.DoesNotExist:
        return Response({'error': '사용자를 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_user_role_view(request, user_id):
    employee_id = request.session.get('employee_id')
    if not employee_id:
        return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        current_employee = Employee.objects.get(id=employee_id)
        # Only managers can update auth
        if current_employee.auth != 'MANAGER':
            return Response(
                {'message': '관리자만 접근할 수 있습니다.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        target_employee = Employee.objects.get(id=user_id)
        
        serializer = UpdateRoleSerializer(data=request.data)
        if serializer.is_valid():
            target_employee.auth = serializer.validated_data['auth']
            target_employee.save()
            return Response(EmployeeSerializer(target_employee).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Employee.DoesNotExist:
        return Response(
            {'message': '사용자를 찾을 수 없습니다.'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def system_stats_view(request):
    total_users = Employee.objects.count()
    active_sessions = Session.objects.count()
    
    stats = {
        'total_users': total_users,
        'active_sessions': active_sessions,
        'system_status': 'running'
    }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([AllowAny])
def employee_list_view(request):
    """모든 직원 정보를 반환합니다."""
    try:
        employees = Employee.objects.all()
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def emp_info_list_view(request):
    """모든 직원 정보(emp_info)를 반환합니다."""
    try:
        emp_infos = EmpInfo.objects.all().order_by('emp_id')
        serializer = EmpInfoSerializer(emp_infos, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def email_template_list_view(request):
    """이메일 템플릿 목록 조회 및 생성"""
    if request.method == 'GET':
        try:
            templates = EmailTemplate.objects.all().order_by('department')
            serializer = EmailTemplateSerializer(templates, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    elif request.method == 'POST':
        try:
            serializer = EmailTemplateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def email_template_detail_view(request, department):
    """특정 부서의 이메일 템플릿 조회, 수정, 삭제"""
    try:
        template = EmailTemplate.objects.get(department=department)
    except EmailTemplate.DoesNotExist:
        if request.method == 'GET':
            return Response({'error': '해당 부서의 템플릿이 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
        # PUT 요청 시 새로 생성
        template = None
    
    if request.method == 'GET':
        serializer = EmailTemplateSerializer(template)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if template:
            # 기존 템플릿 업데이트
            serializer = EmailTemplateSerializer(template, data=request.data)
        else:
            # 새 템플릿 생성
            serializer = EmailTemplateSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if template:
            template.delete()
            return Response({'message': '템플릿이 삭제되었습니다.'}, status=status.HTTP_204_NO_CONTENT)
        return Response({'error': '해당 부서의 템플릿이 없습니다.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def request_submission_view(request):
    """의뢰 상신 목록 조회 및 처리"""
    if request.method == 'GET':
        try:
            # 페이지네이션 파라미터
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            
            # 최신순으로 정렬하여 페이지네이션
            submissions = RequestSubmission.objects.all().order_by('-submitted_at')
            
            # 페이지네이션 계산
            total_count = submissions.count()
            start_index = (page - 1) * page_size
            end_index = start_index + page_size
            
            page_submissions = submissions[start_index:end_index]
            
            serializer = RequestSubmissionSerializer(page_submissions, many=True)
            
            return Response({
                'results': serializer.data,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            serializer = RequestSubmissionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_request_submission_view(request, submission_id):
    """의뢰 삭제 - 의뢰자와 현재 사용자가 일치할 때만 삭제 가능"""
    try:
        # 로그인 확인
        employee_id = request.session.get('employee_id')
        if not employee_id:
            return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 현재 사용자 정보 가져오기
        current_employee = Employee.objects.get(id=employee_id)
        
        # 삭제할 의뢰 찾기
        try:
            submission = RequestSubmission.objects.get(id=submission_id)
        except RequestSubmission.DoesNotExist:
            return Response({'error': '의뢰를 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
        
        # 의뢰자와 현재 사용자가 일치하는지 확인
        if submission.submitted_by != current_employee.username:
            return Response({'error': '본인이 작성한 의뢰만 삭제할 수 있습니다.'}, status=status.HTTP_403_FORBIDDEN)
        
        # 의뢰 삭제
        submission.delete()
        
        return Response({'message': '의뢰가 삭제되었습니다.'}, status=status.HTTP_204_NO_CONTENT)
        
    except Employee.DoesNotExist:
        return Response({'error': '사용자를 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_employee_roles_view(request):
    """직원 권한 일괄 업데이트"""
    try:
        # 세션 디버깅
        print(f"Session data: {dict(request.session)}")
        print(f"Session key: {request.session.session_key}")
        
        # 로그인 확인
        employee_id = request.session.get('employee_id')
        if not employee_id:
            print(f"No employee_id in session: {dict(request.session)}")
            return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 현재 사용자 권한 확인 (MANAGER만 권한 수정 가능)
        current_employee = Employee.objects.get(id=employee_id)
        if current_employee.auth != 'MANAGER':
            return Response({'error': '권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        
        updates = request.data.get('updates', [])
        if not updates:
            return Response({'error': '업데이트할 데이터가 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        
        updated_employees = []
        
        for update in updates:
            employee_id_to_update = update.get('employee_id')
            new_auth = update.get('auth')
            
            if not employee_id_to_update or not new_auth:
                continue
                
            if new_auth not in ['ENGINEER', 'MANAGER']:
                continue
                
            try:
                employee = Employee.objects.get(id=employee_id_to_update)
                employee.auth = new_auth
                employee.save()
                updated_employees.append({
                    'id': employee.id,
                    'username': employee.username,
                    'auth': employee.auth
                })
            except Employee.DoesNotExist:
                continue
        
        return Response({
            'message': f'{len(updated_employees)}명의 권한이 업데이트되었습니다.',
            'updated_employees': updated_employees
        })
        
    except Employee.DoesNotExist:
        return Response({'error': '사용자를 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def approval_roles_view(request):
    """직원 결재 역할 조회 및 저장"""
    if request.method == 'GET':
        try:
            department = request.GET.get('department')
            if not department:
                # 모든 결재 역할 조회
                approval_roles = EmpApprovalRole.objects.all()
            else:
                # 해당 부서의 직원들 중 결재 역할이 설정된 직원들 조회
                dept_emp_ids = EmpInfo.objects.filter(department=department).values_list('emp_id', flat=True)
                approval_roles = EmpApprovalRole.objects.filter(emp_id__in=dept_emp_ids)
            
            serializer = EmpApprovalRoleSerializer(approval_roles, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PUT':
        try:
            # 로그인 확인
            employee_id = request.session.get('employee_id')
            if not employee_id:
                return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # 현재 사용자 권한 확인 (MANAGER만 결재 역할 설정 가능)
            current_employee = Employee.objects.get(id=employee_id)
            if current_employee.auth != 'MANAGER':
                return Response({'error': '권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
            
            roles = request.data.get('roles', {})
            
            if not roles:
                return Response({'error': '역할 데이터가 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)
            
            updated_roles = []
            
            # 각 직원의 역할을 저장/업데이트
            for emp_id, role in roles.items():
                if not role:  # 역할이 선택되지 않은 경우 건너뜀
                    continue
                    
                try:
                    # emp_info에서 직원 정보 가져오기
                    emp_info = EmpInfo.objects.get(emp_id=emp_id)
                    
                    # 기존 역할이 있으면 업데이트, 없으면 생성
                    approval_role, created = EmpApprovalRole.objects.update_or_create(
                        emp_id=emp_id,
                        defaults={
                            'name': emp_info.name,
                            'role': role
                        }
                    )
                    
                    updated_roles.append({
                        'emp_id': approval_role.emp_id,
                        'name': approval_role.name,
                        'role': approval_role.role,
                        'created': created
                    })
                    
                except EmpInfo.DoesNotExist:
                    continue
            
            return Response({
                'message': f'{len(updated_roles)}명의 결재 역할이 저장되었습니다.',
                'updated_roles': updated_roles
            })
            
        except Employee.DoesNotExist:
            return Response({'error': '사용자를 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def request_submission_detail_view(request, submission_id):
    """특정 의뢰 상신의 정보 업데이트 (담당자 변경 등)"""
    try:
        submission = RequestSubmission.objects.get(id=submission_id)
    except RequestSubmission.DoesNotExist:
        return Response({'error': '해당 의뢰를 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PATCH':
        try:
            serializer = RequestSubmissionSerializer(submission, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def guide_db_view(request):
    """Guide_DB 목록 조회 및 새 항목 생성"""
    if request.method == 'GET':
        try:
            guide_items = GuideDB.objects.all().order_by('item')
            serializer = GuideDBSerializer(guide_items, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            serializer = GuideDBSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def guide_db_detail_view(request, guide_id):
    """특정 Guide_DB 항목 조회, 수정, 삭제"""
    try:
        guide_item = GuideDB.objects.get(id=guide_id)
    except GuideDB.DoesNotExist:
        return Response({'error': '해당 항목을 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = GuideDBSerializer(guide_item)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        try:
            serializer = GuideDBSerializer(guide_item, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            guide_item.delete()
            return Response({'message': '항목이 삭제되었습니다.'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)