from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.sessions.models import Session
from .models import Employee, EmpInfo, EmailTemplate
from .serializers import EmployeeSerializer, LoginSerializer, UpdateRoleSerializer, SystemStatsSerializer, EmpInfoSerializer, EmailTemplateSerializer

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