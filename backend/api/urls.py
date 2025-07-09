from django.urls import path
from . import views

urlpatterns = [
    path('auth/login', views.login_view, name='login'),
    path('auth/me', views.current_user_view, name='current_user'),
    path('auth/logout', views.logout_view, name='logout'),
    path('admin/users', views.users_list_view, name='users_list'),
    path('admin/users/<int:user_id>/role', views.update_user_role_view, name='update_user_role'),
    path('stats', views.system_stats_view, name='system_stats'),
    path('employees', views.employee_list_view, name='employee_list'),
    path('emp-info', views.emp_info_list_view, name='emp_info_list'),
    path('email-templates', views.email_template_list_view, name='email_template_list'),
    path('email-templates/<str:department>', views.email_template_detail_view, name='email_template_detail'),
]