from rest_framework import serializers
from .models import Employee, EmpInfo

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'username', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    
    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("사용자명을 입력해주세요.")
        return value

class UpdateRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Employee.ROLE_CHOICES)
    
    def validate_role(self, value):
        if value not in ['ENGINEER', 'MANAGER']:
            raise serializers.ValidationError("유효하지 않은 역할입니다.")
        return value

class SystemStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    system_status = serializers.CharField()

class EmpInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpInfo
        fields = ['id', 'name', 'department', 'emp_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']