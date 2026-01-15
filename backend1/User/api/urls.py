from django.urls import path
from .views import user_registration
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from .views import me
urlpatterns = [
    path('register/', user_registration),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path("api/me/", me, name="me"),

]
