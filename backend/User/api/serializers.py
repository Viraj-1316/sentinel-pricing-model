from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from ..models import UserProfile
from django.contrib.auth import get_user_model
User = get_user_model()

class MeSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    phone_number = serializers.CharField(
        source="userprofile.phone_number",
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = ["username", "email", "phone_number", "role"]

    def get_role(self, obj):
        return "Admin" if obj.is_staff else "User"


class registration_serializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number', 'password', 'password2']
        extra_kwargs = {'password': {'write_only': True}}

    # ✅ 1) Validate password matching
    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return attrs

    # ✅ 2) Create user + save email + save phone in UserProfile
    def create(self, validated_data):
        phone_number = validated_data.pop("phone_number", None)
        validated_data.pop("password2", None)

        # ✅ Create user using create_user (hashes password properly)
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),   # ✅ store email in User table
            password=validated_data["password"]
        )

        # ✅ Save phone in UserProfile
        UserProfile.objects.update_or_create(
            user=user,
            defaults={"phone_number": phone_number}
        )

        return user

    def validate_phone_number(self, value):
        if not value.isdigit():
            raise ValidationError("Phone number must contain only digits.")
        if len(value) != 10:
            raise ValidationError("Phone number must be exactly 10 digits.")
        return value

    def save(self, **kwargs):
        password = self.validated_data['password']
        password2 = self.validated_data['password2']
        phone_number = self.validated_data['phone_number']

        if password != password2:
            raise ValidationError({"password": "Passwords do not match."})

        if User.objects.filter(email=self.validated_data['email']).exists():
            raise ValidationError({"email": "Email already exists."})

        user = User(
            email=self.validated_data['email'],
            username=self.validated_data['username']
        )
        user.set_password(password)
        user.save()

        UserProfile.objects.create(user=user, phone_number=phone_number)
        return user
