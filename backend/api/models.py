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
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.username} - {self.role}"

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
    STATUS_CHOICES = [
        ('대기중', '대기중'),
        ('진행중', '진행중'),
        ('완료', '완료'),
        ('보류', '보류'),
    ]
    
    department = models.CharField(max_length=100, verbose_name="부서")
    title = models.CharField(max_length=200, verbose_name="의뢰 제목", default="")
    content = models.TextField(verbose_name="의뢰 내용")
    submitted_by = models.CharField(max_length=100, verbose_name="상신자")
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="상신 시간")
    
    # 새로 추가되는 컬럼들
    line_id = models.CharField(max_length=50, blank=True, null=True, verbose_name="Line ID")
    ppid = models.CharField(max_length=50, blank=True, null=True, verbose_name="PPID")
    eqpid = models.CharField(max_length=50, blank=True, null=True, verbose_name="EQPID")
    change_request_items = models.CharField(max_length=200, blank=True, null=True, verbose_name="변경의뢰 항목")
    # Excel 표를 HTML 그대로 저장
    excel_1 = models.TextField(blank=True, null=True, verbose_name="엑셀 표1 (HTML)")
    excel_2 = models.TextField(blank=True, null=True, verbose_name="엑셀 표2 (HTML)")
    max_tat = models.IntegerField(blank=True, null=True, verbose_name="Max TAT", help_text="선택된 변경 항목 중 가장 긴 표준 TAT")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='대기중', verbose_name="상태")
    assignee = models.CharField(max_length=100, blank=True, null=True, verbose_name="담당자")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'request_submissions'
        verbose_name = '의뢰 상신'
        verbose_name_plural = '의뢰 상신'
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.department} - {self.submitted_by} ({self.submitted_at.strftime('%Y-%m-%d %H:%M')})"

class EmpApprovalRole(models.Model):
    ROLE_CHOICES = [
        ('결재', '결재'),
        ('병렬결재', '병렬결재'),
        ('합의', '합의'),
        ('병렬합의', '병렬합의'),
        ('통보', '통보'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="직원 이름")
    emp_id = models.CharField(max_length=20, unique=True, verbose_name="사번")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name="결재 역할")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'emp_approval_role'
        verbose_name = '직원 결재 역할'
        verbose_name_plural = '직원 결재 역할'
    
    def __str__(self):
        return f"{self.name} ({self.emp_id}) - {self.role}"

class GuideDB(models.Model):
    item = models.CharField(max_length=200, verbose_name="변경 아이템")
    standard_TAT = models.IntegerField(verbose_name="표준 TAT(일)", help_text="표준 처리 시간(일 단위)")
    comment = models.TextField(blank=True, null=True, verbose_name="코멘트")
    reference = models.CharField(max_length=200, blank=True, null=True, verbose_name="참고사항")
    
    # 10개의 phpsi 컬럼
    phpsi_1 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 1")
    phpsi_2 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 2")
    phpsi_3 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 3")
    phpsi_4 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 4")
    phpsi_5 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 5")
    phpsi_6 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 6")
    phpsi_7 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 7")
    phpsi_8 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 8")
    phpsi_9 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 9")
    phpsi_10 = models.CharField(max_length=100, blank=True, null=True, verbose_name="PHPSI 10")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'guide_db'
        verbose_name = '가이드 DB'
        verbose_name_plural = '가이드 DB'
        ordering = ['item']
    
    def __str__(self):
        return f"{self.item} (TAT: {self.standard_TAT}일)"
