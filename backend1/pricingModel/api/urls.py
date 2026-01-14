from django.urls import path,include
from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
from pricingModel.api.views import defaultPricing, aiFeatures, pricingCalculate
urlpatterns = [
    path('cameraPricing/', defaultPricing.as_view(), name='cam'),
    path('ai-feature/', aiFeatures.as_view(), name='ai'),
    path('Pricingcalculation/', pricingCalculate.as_view(), name='cal'),
]
    
