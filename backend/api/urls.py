from django.urls import path
from . import views

urlpatterns = [
    path('auth/login', views.login_view, name='login'),
    path('auth/session', views.session_view, name='session'),
    path('auth/me', views.current_user_view, name='current_user'),
    path('auth/logout', views.logout_view, name='logout'),
    path('admin/users', views.users_list_view, name='users_list'),
    path('admin/users/<int:user_id>/role', views.update_user_role_view, name='update_user_role'),
    path('stats', views.system_stats_view, name='system_stats'),
    path('employees', views.employee_list_view, name='employee_list'),
    path('emp-info', views.emp_info_list_view, name='emp_info_list'),
    path('email-templates', views.email_template_list_view, name='email_template_list'),
    path('email-templates/<str:department>', views.email_template_detail_view, name='email_template_detail'),
    path('request-submissions', views.request_submission_view, name='request_submission'),
    path('request-submissions/<int:submission_id>/delete', views.delete_request_submission_view, name='delete_request_submission'),
    path('request-submissions/<int:submission_id>', views.request_submission_detail_view, name='request_submission_detail'),
    path('employees/update-roles', views.update_employee_roles_view, name='update_employee_roles'),
    path('approval-roles', views.approval_roles_view, name='approval_roles'),
    path('guide-db', views.guide_db_view, name='guide_db'),
    path('guide-db/<int:guide_id>', views.guide_db_detail_view, name='guide_db_detail'),
]