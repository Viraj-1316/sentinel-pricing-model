from rest_framework import generics
from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
from pricingModel.api.serializers import userPricingSerializer,Cammera_PricingSerializer, AI_ENABLEDserializer
from rest_framework import response
from rest_framework.validators import ValidationError
from django.db.models import Q

def cameraRange(cameras, ai_features):
    
    pricing_range = Cammera_Pricing.objects.filter(min_cammera = )

class defaultPricing(generics.ListAPIView):
    
    queryset = Cammera_Pricing.objects.all()
    serializer_class = Cammera_PricingSerializer
    
class aiFeatures(generics.ListAPIView):
    
    queryset = AI_ENABLED.objects.all()
    serializer_class =  AI_ENABLEDserializer   

class pricingCalculate(generics.ListCreateAPIView):
    
    serializer_class = userPricingSerializer
    
    def get_queryset(self):
        return UserPricing.objects.all()
    
    def perform_create(self, serializer):
        cameras = serializer.validated_data['cammera']
        ai_features = serializer.validated_data.get(ai_features, [])
        
        
            