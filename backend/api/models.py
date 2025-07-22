from django.db import models

class Employee(models.Model):
    ROLE_CHOICES = [
        ('ENGINEER', 'Engineer'),
        ('MANAGER', 'Manager'),
    ]
    
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='ENGINEER'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'employee'
    
    def __str__(self):
        return f"{self.username} ({self.role})"

class EmpInfo(models.Model):
    name = models.CharField(max_length=100, verbose_name="직원 이름")
    department = models.CharField(max_length=100, verbose_name="소속 부서")
    emp_id = models.CharField(max_length=20, unique=True, verbose_name="사번")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'emp_info'
        verbose_name = "직원 정보"
        verbose_name_plural = "직원 정보"
    
    def __str__(self):
        return f"{self.name} ({self.emp_id}) - {self.department}"

class EmailTemplate(models.Model):
    department = models.CharField(max_length=100, unique=True, verbose_name="부서명")
    subject = models.CharField(max_length=200, verbose_name="이메일 제목")
    content = models.TextField(verbose_name="이메일 내용")
    auto_send = models.BooleanField(default=False, verbose_name="자동 발송")
    require_approval = models.BooleanField(default=False, verbose_name="승인 필요")
    cc_manager = models.BooleanField(default=False, verbose_name="매니저 참조")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'email_template'
        verbose_name = "이메일 템플릿"
        verbose_name_plural = "이메일 템플릿"
    
    def __str__(self):
        return f"{self.department} - {self.subject}"

class RequestSubmission(models.Model):
    department = models.CharField(max_length=100, verbose_name="부서")
    content = models.TextField(verbose_name="의뢰 내용")
    submitted_by = models.CharField(max_length=100, verbose_name="상신자")
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="상신 시간")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'request_submissions'
        verbose_name = '의뢰 상신'
        verbose_name_plural = '의뢰 상신'
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.department} - {self.submitted_by} ({self.submitted_at.strftime('%Y-%m-%d %H:%M')})"
