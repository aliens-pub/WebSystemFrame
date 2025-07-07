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
