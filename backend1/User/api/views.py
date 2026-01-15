from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import registration_serializer
from ..models import UserProfile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    })

@api_view(['POST'])
def user_registration(request):
    serializer = registration_serializer(data=request.data)

    if serializer.is_valid():
        account = serializer.save()

        profile = UserProfile.objects.filter(user=account).first()
        phone_number = profile.phone_number if profile else None

        refresh = RefreshToken.for_user(account)

        return Response({
            "response": "Registration Successful",
            "username": account.username,
            "email": account.email,
            "phone_number": phone_number,
            "token": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
