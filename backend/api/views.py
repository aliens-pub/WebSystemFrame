from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.contrib.sessions.models import Session
from django.db.models import Count
from .models import User
from .serializers import UserSerializer, LoginSerializer, UpdateRoleSerializer, SystemStatsSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        
        # Get or create user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={'role': 'MANAGER'}
        )
        
        # Login user
        login(request, user)
        
        # Return user data with mock token
        return Response({
            'user': UserSerializer(user).data,
            'token': f'mock-jwt-{user.id}'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': '로그아웃되었습니다.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list_view(request):
    # Only managers can view all users
    if request.user.role != 'MANAGER':
        return Response(
            {'message': '관리자만 접근할 수 있습니다.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_role_view(request, user_id):
    # Only managers can update roles
    if request.user.role != 'MANAGER':
        return Response(
            {'message': '관리자만 접근할 수 있습니다.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'message': '사용자를 찾을 수 없습니다.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = UpdateRoleSerializer(data=request.data)
    if serializer.is_valid():
        user.role = serializer.validated_data['role']
        user.save()
        return Response(UserSerializer(user).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_stats_view(request):
    total_users = User.objects.count()
    active_sessions = Session.objects.count()
    
    stats = {
        'total_users': total_users,
        'active_sessions': active_sessions,
        'system_status': 'running'
    }
    
    return Response(stats)
