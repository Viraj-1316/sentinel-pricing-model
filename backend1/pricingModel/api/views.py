from rest_framework import generics
from pricingModel.models import Pricing, UserPricing, AI_ENABLED
from pricingModel.api.serializers import userPricingSerializer,pricingSerializer, AI_ENABLEDserializer
from rest_framework import response
from rest_framework.validators import ValidationError
class defaultPricing(generics.ListAPIView):
    
    queryset = Pricing.objects.all()
    serializer_class = pricingSerializer

class pricingCalculate(generics.ListCreateAPIView):
    
    serializer_class = userPricingSerializer
    
    def get_queryset(self):
        return UserPricing.objects.all()
    
    def perform_create(self, serializer):
        
        cammera = serializer.validated_data.get('cammera')
        ai_features = serializer.validated_data.get('ai_features')
        
        pricing = Pricing.objects.filter(
            ai_features = ai_features
            ).first()
        
        ai_enabled = AI_ENABLED.objects.all()
        
        if not pricing:
            raise ValidationError("Pricing not configured by admin")
        
        camera_ratio = cammera / pricing.cammera
        ai_enable_count = ai_features.count()
        
        Camera_costing = int(pricing.total_costing * camera_ratio)
        ai_costing = int(ai_enable_count * ai_enabled.costPerUnit)
        total_cost = int(Camera_costing + ai_costing)
        
        serializer.save(
            user_name=self.request.user,
            total_costing = total_cost
        )