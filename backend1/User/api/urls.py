from django.urls import path
from .views import user_registration, RegisterSendEmailOTP, RegisterVerifyEmailOTP, VerifyPassword,ChangePassword
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from .views import me
urlpatterns = [
    path('register/', user_registration),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path("api/me/", me, name="me"),
    path("send-email-otp/", RegisterSendEmailOTP.as_view()),
    path("verify-email-otp/", RegisterVerifyEmailOTP.as_view()),
    path("verify-password/", VerifyPassword.as_view()),
    path("change-password/", ChangePassword.as_view()),
]
