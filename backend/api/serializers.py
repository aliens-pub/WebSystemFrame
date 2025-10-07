from rest_framework import serializers
from .models import Employee, EmpInfo, EmailTemplate, RequestSubmission, EmpApprovalRole, GuideDB

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'username', 'employee_number', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="사번을 입력하세요")
    
    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("사번을 입력해주세요.")
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

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ['id', 'department', 'subject', 'content', 'auto_send', 'require_approval', 'cc_manager', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class RequestSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestSubmission
        fields = ['id', 'department', 'title', 'content', 'submitted_by', 'submitted_at',
                 'line_id', 'ppid', 'eqpid', 'change_request_items', 'excel_1', 'excel_2', 'max_tat', 'status', 'assignee',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'submitted_at', 'created_at', 'updated_at']

class EmpApprovalRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpApprovalRole
        fields = ['id', 'name', 'emp_id', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class GuideDBSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideDB
        fields = ['id', 'item', 'standard_TAT', 'comment', 'reference',
                 'phpsi_1', 'phpsi_2', 'phpsi_3', 'phpsi_4', 'phpsi_5',
                 'phpsi_6', 'phpsi_7', 'phpsi_8', 'phpsi_9', 'phpsi_10',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
