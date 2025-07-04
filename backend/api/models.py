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
