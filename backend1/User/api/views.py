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
from User.models import PhoneOTP
from User.api.utils import generate_otp, normalize_phone, hash_otp
from User.api.sms import send_otp_sms_fast2sms
from .utils import verify_otp
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
class RegisterSendPhoneOTP(APIView):
    def post(self, request):
        phone = request.data.get("phone") or request.data.get("phone_number")

        try:
            phone = normalize_phone(phone)
        except ValueError as e:
            return Response({"message": str(e)}, status=400)

        if User.objects.filter(username=phone).exists():
            return Response({"message": "Phone already registered"}, status=400)

        otp = generate_otp()

        # reset old OTP
        PhoneOTP.objects.update_or_create(
            phone=phone,
            defaults={
                "otp_hash": hash_otp(otp),
                "attempts": 0,
            }
        )

        # send sms
        resp = send_otp_sms_fast2sms(phone, otp)

        return Response({
            "message": "OTP sent",
            "gateway_response": resp
        }, status=200)

User = get_user_model()

from .utils import verify_otp

class RegisterVerifyPhoneOTP(APIView):
    def post(self, request):
        phone = request.data.get("phone")
        otp = request.data.get("otp")
        password = request.data.get("password")
        full_name = request.data.get("full_name")

        try:
            phone = normalize_phone(phone)
        except ValueError as e:
            return Response({"message": str(e)}, status=400)

        otp_obj = PhoneOTP.objects.filter(phone=phone).first()
        if not otp_obj:
            return Response({"message": "OTP not found"}, status=400)

        if otp_obj.is_expired():
            otp_obj.delete()
            return Response({"message": "OTP expired"}, status=400)

        if otp_obj.attempts >= 5:
            return Response({"message": "Too many attempts. Please resend OTP."}, status=429)

        if not verify_otp(str(otp), otp_obj.otp_hash):
            otp_obj.attempts += 1
            otp_obj.save()
            return Response({"message": "Invalid OTP"}, status=400)

        # ✅ Create user after OTP success
        user = User.objects.create_user(
            username=phone,         # store phone in username OR use custom model
            password=password,
            first_name=full_name
        )

        otp_obj.delete()

        return Response({"message": "Account created successfully"}, status=201)
