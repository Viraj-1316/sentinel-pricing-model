from django.urls import path
from pricingModel.api.views import (
    aiFeatures,
    defaultPricingListCreate,
    pricingCalculate,
    defaultPricingDetail,
    UserQuotationList,
  
     send_quotation_email,
   download_quotation_pdf,
   # ✅ ADD THIS
)
from pricingModel.api.views import send_quotation_email

urlpatterns = [
    path(
        'cameraPricing/',
        defaultPricingListCreate.as_view(),
        name='cam'
    ),
    path(
        'cameraPricing/<int:pk>/',
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

    # ✅ NEW: Download quotation PDF
    path(
        'quotation/<int:pk>/pdf/',
        download_quotation_pdf,
        name='quotation-pdf'
    ),
    path(
        'quotation/<int:pk>/send-email/',
        send_quotation_email,
        name='quotation-pdf'
    ),

]
