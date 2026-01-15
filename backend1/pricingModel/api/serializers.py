from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
from rest_framework import serializers
from django.db.models import Q


class Cammera_PricingSerializer(serializers.ModelSerializer):
    
        class Meta:
            model = Cammera_Pricing
            fields = "__all__"


class userPricingSerializer(serializers.ModelSerializer):
    total_costing = serializers.IntegerField(read_only=True)
    camera_cost = serializers.IntegerField(read_only=True)
    ai_cost = serializers.IntegerField(read_only=True)

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

                
class AI_ENABLEDserializer(serializers.ModelSerializer):
    
        class Meta:
            model = AI_ENABLED
            fields = ['id', 'AI_feature', 'costing']          
            
class AIFeatureQuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AI_ENABLED
        fields = ['AI_feature', 'costing']

class QuotationSerializer(serializers.ModelSerializer):
    ai_features = AIFeatureQuotationSerializer(many=True, read_only=True)

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
            min_cammera__lte=obj.camera
        ).filter(
            Q(max_cammera__gte=obj.cammera) | Q(max_cammera__isnull=True)
        ).first()

        return pricing_range.total_costing
