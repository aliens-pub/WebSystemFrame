# Employee Number Authentication System 구현 가이드

## 개요
기존 username 기반 로그인 시스템을 employee_number(사번) 기반으로 변경하고, emp_info 테이블과 연동하여 자동 사용자명 동기화 기능을 구현한 과정을 정리합니다.

## 요청사항
1. employee 테이블에 employee_number 컬럼 추가
2. 기존 employee 레코드들에 EMP000000X 형식의 사번 할당
3. admin.system 사용자에게 EMP9999999 사번 할당
4. 로그인 시스템을 사번 기반으로 변경

## 구현 과정

### 1단계: Database Schema 변경

#### 1.1 employee_number 컬럼 추가
```sql
-- employee 테이블에 employee_number 컬럼 추가
ALTER TABLE employee ADD COLUMN employee_number VARCHAR(20);
```

#### 1.2 기존 데이터 마이그레이션
```sql
-- 기존 employees에 임시값 설정 (NULL 제약 회피)
UPDATE employee SET employee_number = '0' WHERE employee_number IS NULL;

-- admin.system 사용자에게 특별 사번 할당
UPDATE employee SET employee_number = 'EMP9999999' WHERE username = 'admin.system';

-- 일반 사용자들에게 순차적 사번 할당
UPDATE employee 
SET employee_number = 'EMP' || LPAD(id::text, 7, '0')
WHERE username != 'admin.system';

-- employee_number에 유니크 제약 추가
ALTER TABLE employee ADD CONSTRAINT employee_employee_number_key UNIQUE (employee_number);
```

#### 1.3 테스트 데이터 생성 (emp_info 테이블)
```sql
-- 사번과 매칭되는 직원 정보 생성
INSERT INTO emp_info (name, department, emp_id, created_at, updated_at) VALUES
('관리자시스템', '시스템운영팀', 'EMP9999999', NOW(), NOW()),
('김테스트', '개발팀', 'EMP0000001', NOW(), NOW()),
('정우빈', '기획팀', 'EMP0000002', NOW(), NOW());
```

#### 1.4 중복 사용자명 문제 해결
```sql
-- 중복되는 username 문제 해결
UPDATE employee SET username = username || '_' || employee_number 
WHERE username = '정우빈' AND employee_number != 'EMP0000002';

-- 잘못 생성된 레코드 삭제
DELETE FROM employee 
WHERE id = 10 AND username = 'admin.system' AND employee_number = 'admin.system';
```

### 2단계: Backend Model 수정

#### 2.1 Employee 모델 업데이트
**파일**: `backend/api/models.py`

```python
# employee_number 필드를 필수 필드로 변경
employee_number = models.CharField(max_length=20, unique=True, verbose_name="사번")

# save 메서드에 자동 username 동기화 로직 추가
def save(self, *args, **kwargs):
    # Auto-populate username from emp_info if employee_number matches emp_id
    if self.employee_number:
        try:
            emp_info = EmpInfo.objects.get(emp_id=self.employee_number)
            new_username = emp_info.name
            # Check if this username already exists for a different employee
            if Employee.objects.filter(username=new_username).exclude(pk=self.pk).exists():
                new_username = f"{emp_info.name}_{self.employee_number}"
            self.username = new_username
        except EmpInfo.DoesNotExist:
            # If no matching emp_info, keep existing username or set to employee_number
            if not self.username:
                self.username = self.employee_number
    super().save(*args, **kwargs)
```

### 3단계: Backend API 수정

#### 3.1 Serializer 업데이트
**파일**: `backend/api/serializers.py`

```python
# EmployeeSerializer에 employee_number 필드 추가
class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'username', 'employee_number', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

# LoginSerializer 업데이트 (사번 입력으로 변경)
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="사번을 입력하세요")
    
    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("사번을 입력해주세요.")
        return value
```

#### 3.2 Login View 로직 변경
**파일**: `backend/api/views.py`

```python
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
            # If admin user already exists but not MANAGER, update role
            if employee_number == 'EMP9999999' and employee.role != 'MANAGER':
                employee.role = 'MANAGER'
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
                role=default_role
            )
        
        # Store employee info in session
        request.session['employee_id'] = employee.id
        request.session['employee_username'] = employee.username
        request.session['employee_role'] = employee.role
        request.session['employee_number'] = employee.employee_number
        
        # Set session to not expire
        request.session.set_expiry(0)
        request.session.save()
        
        # Return employee data with mock token
        return Response({
            'user': EmployeeSerializer(employee).data,
            'token': f'mock-jwt-{employee.id}'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 4단계: Frontend 수정

#### 4.1 로그인 모달 업데이트
**파일**: `client/src/components/LoginModal.tsx`

```tsx
// 사용자 안내 메시지 변경
<p className="text-gray-600 text-sm">
  사번을 입력하여 시스템에 접속하세요
</p>

// 입력 필드 레이블 및 플레이스홀더 변경
<FormLabel>사번</FormLabel>
<FormControl>
  <Input
    placeholder="사번을 입력하세요 (예: EMP0000001)"
    {...field}
    disabled={isLoading}
  />
</FormControl>
```

## 검증 및 테스트

### 데이터베이스 상태 확인
```sql
-- employee 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'employee' 
ORDER BY ordinal_position;

-- 제약 조건 확인
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
WHERE tc.table_name = 'employee';

-- 최종 데이터 상태 확인
SELECT id, username, employee_number, role 
FROM employee 
ORDER BY id;
```

### 테스트 계정
시스템에서 사용 가능한 테스트 계정들:
- `EMP9999999`: 관리자시스템 (MANAGER)
- `EMP0000001`: 김테스트 (ENGINEER)
- `EMP0000002`: 정우빈 (MANAGER)
- `EMP0000003`: woobin.jeong (ENGINEER)
- 기타 EMP0000005 ~ EMP0000009

## 주요 변경사항 요약

1. **Database Schema**: employee_number 컬럼 추가 및 유니크 제약 설정
2. **Authentication Logic**: username → employee_number 기반 로그인으로 변경
3. **Auto-sync Feature**: emp_info 테이블과 연동하여 자동 사용자명 동기화
4. **Frontend UX**: 사번 입력 폼으로 변경
5. **Session Management**: employee_number도 세션에 저장하도록 확장

## 주의사항

- employee_number는 유니크 제약이 설정되어 있음
- 기존 username도 유니크 제약이 유지됨
- emp_info 테이블에 매칭되는 emp_id가 없으면 employee_number를 username으로 사용
- 중복되는 username이 있을 경우 `{name}_{employee_number}` 형식으로 처리