from pricingModel.models import Pricing, UserPricing, AI_ENABLED
from rest_framework import serializers

class pricingSerializer(serializers.ModelSerializer):
    class Meta:
        model : Pricing
        fields = "__all__"


class userPricingSerializer(serializers.ModelSerializer):
    
    class Meta:
        model : UserPricing
        fields = "__all__"
                
class AI_ENABLEDserializer(serializers.ModelSerializer):
    
        class Meta:
            model : AI_ENABLED
            fields = "__all__"           