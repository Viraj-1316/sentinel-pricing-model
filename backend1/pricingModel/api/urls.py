from django.urls import path,include
from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
from pricingModel.api.views import aiFeatures, defaultPricingListCreate, pricingCalculate,defaultPricingDetail,UserQuotationList


urlpatterns = [
    path('cameraPricing/', 
         defaultPricingListCreate.as_view(), 
         name='cam'
         ),
    path('cameraPricing/<int:pk>/', 
         defaultPricingDetail.as_view(), 
         name='cam-detail'
         ),
    path(
        'ai-feature/', 
        aiFeatures.as_view(), 
        name='ai'
        ),
    path(
        'Pricingcalculation/', 
        pricingCalculate.as_view(), 
        name='cal'
        ),
    path(
        'user-quotations/',
        UserQuotationList.as_view(),
        name='user-quotations'
    ),
]
    
