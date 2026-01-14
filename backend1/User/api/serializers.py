from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from ..models import UserProfile

class registration_serializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number', 'password', 'password2']
        extra_kwargs = {'password': {'write_only': True}}

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
