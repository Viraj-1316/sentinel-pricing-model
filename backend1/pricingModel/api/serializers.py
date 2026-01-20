from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED, AuditLog
from rest_framework import serializers
from django.db.models import Q
from django.contrib.auth.models import User

class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'date_joined', 'last_login', 'role']

    def get_role(self, obj):
        return "Admin" if obj.is_staff else "User"


class AdminQuotationSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    ai_features = serializers.SerializerMethodField()

    class Meta:
        model = UserPricing
        fields = [
            "id",
            "username",
            "cammera",
            "camera_cost",
            "ai_cost",
            "total_costing",
            "ai_features",
            "created_at",
        ]

    def get_username(self, obj):
        return obj.user_name.username if obj.user_name else None

    def get_ai_features(self, obj):
        return list(obj.ai_features.values("AI_feature", "costing"))


class Cammera_PricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cammera_Pricing
        fields = "__all__"


class AI_ENABLEDserializer(serializers.ModelSerializer):
    class Meta:
        model = AI_ENABLED
        fields = ['id', 'AI_feature', 'costing']


class userPricingSerializer(serializers.ModelSerializer):
    total_costing = serializers.IntegerField(read_only=True)
    camera_cost = serializers.IntegerField(read_only=True)
    ai_cost = serializers.IntegerField(read_only=True)

    ai_features = serializers.PrimaryKeyRelatedField(
        queryset=AI_ENABLED.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = UserPricing
        fields = [
            'id',
            'cammera',
            'ai_features',
            'camera_cost',
            'ai_cost',
            'total_costing',
            'created_at'
        ]
        read_only_fields = ['camera_cost', 'ai_cost', 'total_costing', 'created_at']


class AIFeatureQuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AI_ENABLED
        fields = ['AI_feature', 'costing']


class QuotationSerializer(serializers.ModelSerializer):
    ai_features = AIFeatureQuotationSerializer(many=True, read_only=True)
    camera_cost = serializers.SerializerMethodField()
    ai_cost = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserPricing
        fields = [
            'id',
            'cammera',
            'camera_cost',
            'ai_cost',
            'ai_features',
            'total_costing',
            'created_at'
        ]

    def get_camera_cost(self, obj):
        pricing_range = Cammera_Pricing.objects.filter(
            min_cammera__lte=obj.cammera
        ).filter(
            Q(max_cammera__gte=obj.cammera) | Q(max_cammera__isnull=True)
        ).first()

        if pricing_range is None:
            pricing_range = Cammera_Pricing.objects.order_by('-min_cammera').first()

        return pricing_range.total_costing if pricing_range else 0


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "action",
            "username",
            "details",
            "ip_address",
            "user_agent",
            "created_at",
        ]
