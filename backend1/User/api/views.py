from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from User.api.serializers import registration_serializer
from User.models import UserProfile


@api_view(['POST'])
def user_registration(request):

    serializer = registration_serializer(data=request.data)

    if serializer.is_valid():
        account = serializer.save()

        profile = UserProfile.objects.filter(user=account).first()
        phone_number = profile.phone_number if profile else None

        refresh = RefreshToken.for_user(account)

        data = {
            "response": "Registration Successful",
            "username": account.username,
            "email": account.email,
            "phone_number": phone_number,
            "token": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }

        return Response(data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
