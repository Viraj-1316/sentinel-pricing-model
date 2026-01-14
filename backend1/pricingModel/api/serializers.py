from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
from rest_framework import serializers

class Cammera_PricingSerializer(serializers.ModelSerializer):
    
    class Meta:
        model : Cammera_Pricing
        fields = "__all__"


class userPricingSerializer(serializers.ModelSerializer):
    
    class Meta:
        model : UserPricing
        fields = "__all__"
                
class AI_ENABLEDserializer(serializers.ModelSerializer):
    
        class Meta:
            model : AI_ENABLED
            fields = "__all__"           