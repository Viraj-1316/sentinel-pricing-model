from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from .serializers import registration_serializer
from ..models import UserProfile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from User.models import EmailOTP
from User.api.utils import generate_otp, hash_otp, verify_otp, send_otp_email, normalize_email
User= get_user_model()
from .serializers import MeSerializer

@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user

    if request.method == "GET":
        serializer = MeSerializer(user)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = MeSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            data = serializer.validated_data

            if "email" in data:
                user.email = data["email"]
                user.save()

            phone = data.get("userprofile", {}).get("phone_number")
            if phone is not None:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.phone_number = phone
                profile.save()

            return Response(MeSerializer(user).data)

        return Response(serializer.errors, status=400)


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

class VerifyPassword(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password")

        if not password:
            return Response({"message": "Password required"}, status=400)

        if request.user.check_password(password):
            return Response({"message": "Verified"}, status=200)

        return Response({"message": "Wrong password"}, status=400)
class ChangePassword(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not request.user.check_password(current_password):
            return Response({"message": "Wrong current password"}, status=400)

        request.user.set_password(new_password)
        request.user.save()

        return Response({"message": "Password updated successfully"}, status=200)
class RegisterSendEmailOTP(APIView):
    def post(self, request):
        email = request.data.get("email")

        try:
            email = normalize_email(email)
        except ValueError as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ STRICT EMAIL CHECK
        if User.objects.filter(email=email).exists():
            return Response(
                {"message": "Email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp = generate_otp()

        EmailOTP.objects.update_or_create(
            email=email,
            defaults={
                "otp_hash": hash_otp(otp),
                "attempts": 0,
            }
        )

        resp = send_otp_email(email, otp)

        return Response({
            "message": "OTP sent",
            "gateway_response": resp
        }, status=status.HTTP_200_OK)


class RegisterVerifyEmailOTP(APIView):
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")
        password = request.data.get("password")
        full_name = request.data.get("full_name")
        username = request.data.get("username")   # ✅ ADD THIS

        # ✅ Validate email
        try:
            email = normalize_email(email)
        except ValueError as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Validate username
        if not username:
            return Response({"message": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)

        username = str(username).strip()

        if User.objects.filter(username=username).exists():
            return Response({"message": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"message": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Find OTP
        otp_obj = EmailOTP.objects.filter(email=email).first()
        if not otp_obj:
            return Response({"message": "OTP not found"}, status=status.HTTP_400_BAD_REQUEST)

        if otp_obj.is_expired():
            otp_obj.delete()
            return Response({"message": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)

        if otp_obj.attempts >= 5:
            return Response(
                {"message": "Too many attempts. Please resend OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # ✅ Verify OTP
        otp_clean = str(otp).strip().replace(" ", "")
        if not verify_otp(otp_clean, otp_obj.otp_hash):
            otp_obj.attempts += 1
            otp_obj.save()
            return Response({"message": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Create user after OTP success
        user = User.objects.create_user(
            username=username,       # ✅ REAL USERNAME
            email=email,             # ✅ EMAIL
            password=password,
            first_name=full_name
        )

        otp_obj.delete()

        return Response({"message": "Account created successfully"}, status=status.HTTP_201_CREATED)