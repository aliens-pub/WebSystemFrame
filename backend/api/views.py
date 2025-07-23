from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.sessions.models import Session
from .models import Employee, EmpInfo, EmailTemplate, RequestSubmission, ApprovalRole
from .serializers import EmployeeSerializer, LoginSerializer, UpdateRoleSerializer, SystemStatsSerializer, EmpInfoSerializer, EmailTemplateSerializer, RequestSubmissionSerializer, ApprovalRoleSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        
        # Special admin user gets MANAGER role (for deployment testing)
        default_role = 'MANAGER' if username == 'admin.system' else 'ENGINEER'
        
        # Get or create employee
        employee, created = Employee.objects.get_or_create(
            username=username,
            defaults={'role': default_role}
        )
        
        # If admin.system user already exists but not MANAGER, update role
        if username == 'admin.system' and employee.role != 'MANAGER':
            employee.role = 'MANAGER'
            employee.save()
        
        # Store employee info in session
        request.session['employee_id'] = employee.id
        request.session['employee_username'] = employee.username
        request.session['employee_role'] = employee.role
        
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
        if current_employee.role != 'MANAGER':
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
        # Only managers can update roles
        if current_employee.role != 'MANAGER':
            return Response(
                {'message': '관리자만 접근할 수 있습니다.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        target_employee = Employee.objects.get(id=user_id)
        
        serializer = UpdateRoleSerializer(data=request.data)
        if serializer.is_valid():
            target_employee.role = serializer.validated_data['role']
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
        if current_employee.role != 'MANAGER':
            return Response({'error': '권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        
        updates = request.data.get('updates', [])
        if not updates:
            return Response({'error': '업데이트할 데이터가 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        
        updated_employees = []
        
        for update in updates:
            employee_id_to_update = update.get('employee_id')
            new_role = update.get('role')
            
            if not employee_id_to_update or not new_role:
                continue
                
            if new_role not in ['ENGINEER', 'MANAGER']:
                continue
                
            try:
                employee = Employee.objects.get(id=employee_id_to_update)
                employee.role = new_role
                employee.save()
                updated_employees.append({
                    'id': employee.id,
                    'username': employee.username,
                    'role': employee.role
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

@api_view(['POST'])
@permission_classes([AllowAny])
def approval_roles_view(request):
    """결재 역할 저장"""
    try:
        # 로그인 확인
        employee_id = request.session.get('employee_id')
        if not employee_id:
            print(f"No employee_id in session: {dict(request.session)}")
            return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 현재 사용자 권한 확인 (MANAGER만 결재 역할 설정 가능)
        current_employee = Employee.objects.get(id=employee_id)
        if current_employee.role != 'MANAGER':
            return Response({'error': '권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        
        updates = request.data.get('updates', [])
        if not updates:
            return Response({'error': '업데이트할 데이터가 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_roles = []
        updated_roles = []
        
        for update in updates:
            employee_id_to_update = update.get('employee_id')
            role = update.get('role')
            department = update.get('department')
            
            if not all([employee_id_to_update, role, department]):
                continue
                
            if role not in ['결재', '병렬결재', '합의', '통보']:
                continue
            
            try:
                # EmpInfo에서 직원 정보 가져오기
                emp_info = EmpInfo.objects.get(id=employee_id_to_update)
                
                # 기존 역할이 있는지 확인
                approval_role, created = ApprovalRole.objects.update_or_create(
                    employee_id=employee_id_to_update,
                    department=department,
                    defaults={
                        'employee_name': emp_info.name,
                        'role': role
                    }
                )
                
                role_data = {
                    'employee_id': approval_role.employee_id,
                    'employee_name': approval_role.employee_name,
                    'department': approval_role.department,
                    'role': approval_role.role
                }
                
                if created:
                    created_roles.append(role_data)
                else:
                    updated_roles.append(role_data)
                    
            except EmpInfo.DoesNotExist:
                continue
        
        return Response({
            'message': f'{len(created_roles)}개의 새로운 역할이 생성되고, {len(updated_roles)}개의 기존 역할이 업데이트되었습니다.',
            'created_roles': created_roles,
            'updated_roles': updated_roles
        })
        
    except Employee.DoesNotExist:
        return Response({'error': '사용자를 찾을 수 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)