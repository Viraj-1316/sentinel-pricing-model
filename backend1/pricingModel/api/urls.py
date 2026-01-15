from django.urls import path,include
from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
from pricingModel.api.views import aiFeatures, aiFeaturesDetail, defaultPricingListCreate, pricingCalculate,defaultPricingDetail

urlpatterns = [
    path('cameraPricing/', defaultPricingListCreate.as_view(), name='cam'),
    path('cameraPricing/<int:pk>/', defaultPricingDetail.as_view(), name='cam-detail'),
    path('ai-feature/', aiFeatures.as_view(), name='ai'),
    path('ai-feature/<int:pk>/', aiFeaturesDetail.as_view(), name='ai-detail'),
    path('Pricingcalculation/', pricingCalculate.as_view(), name='cal'),
]
    
