from django.urls import path
from .views import user_registration, RegisterSendPhoneOTP, RegisterVerifyPhoneOTP, VerifyPassword,ChangePassword
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from .views import me
urlpatterns = [
    path('register/', user_registration),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path("api/me/", me, name="me"),
    path("send-phone-otp/", RegisterSendPhoneOTP.as_view()),
    path("verify-phone-otp/", RegisterVerifyPhoneOTP.as_view()),
    path("verify-password/", VerifyPassword.as_view()),
    path("change-password/", ChangePassword.as_view()),
]
