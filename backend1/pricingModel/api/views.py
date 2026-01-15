from rest_framework import generics
from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
from pricingModel.api.serializers import userPricingSerializer,Cammera_PricingSerializer, AI_ENABLEDserializer, AIFeatureQuotationSerializer, QuotationSerializer
from rest_framework import response
from rest_framework.validators import ValidationError
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, IsAdminUser
# from rest_framework.permissions import IsAuthenticated
# from rest_framework_simplejwt.authentication import JWTAuthentication  
from rest_framework import generics

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response



class defaultPricingListCreate(generics.ListCreateAPIView):
    queryset = Cammera_Pricing.objects.all()
    serializer_class = Cammera_PricingSerializer
    def get_permissions(self):
        # Everyone logged in can view list
        if self.request.method in ["GET"]:
            return [IsAuthenticated()]

        # Only superuser/staff can add/update/delete
        return [IsAuthenticated(), IsAdminUser()]
    
    
class defaultPricingDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Cammera_Pricing.objects.all()
    serializer_class = Cammera_PricingSerializer

    
    
class aiFeatures(generics.ListCreateAPIView):
    queryset = AI_ENABLED.objects.all()
    serializer_class = AI_ENABLEDserializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]
  

class pricingCalculate(generics.CreateAPIView):
    
    serializer_class = userPricingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserPricing.objects.all()
    
    def perform_create(self, serializer):
        cameras = serializer.validated_data['cammera']
        ai_features = serializer.validated_data.get('ai_features', [])
        
        pricing_range = Cammera_Pricing.objects.filter(min_cammera__lte = cameras ).filter(Q(max_cammera__gte = cameras) | Q(max_cammera__isnull=True)).first()
        
        camera_cost = pricing_range.total_costing
        ai_cost = sum(ai.costing for ai in ai_features)
        
        total_cost = int(camera_cost + ai_cost)
        
        print("AUTH USER:", self.request.user)
        print("IS AUTH:", self.request.user.is_authenticated)
        
        serializer.save(
             user_name=self.request.user,
             total_costing=total_cost
        )
    
class UserQuotationList(generics.ListAPIView):
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserPricing.objects.filter(
            user_name=self.request.user
        ).order_by('-created_at')        
            