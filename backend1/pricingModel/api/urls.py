from django.urls import path
from pricingModel.api.views import (
    aiFeatures,
    pricingCalculate,
    defaultPricingDetail,
    CameraPricingGet,
    send_quotation_email,
    download_quotation_pdf,
    UserQuotationList,
    storageCosting,
    creatingCategory
)

urlpatterns = [

     path(
        'cameraPricing/',
        CameraPricingGet.as_view(),
        name='cam1'
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
     path(
        'storage-costing/',
        storageCosting.as_view(),
        name='storageCosting'
    ),
        path(
        'create-category/',
        creatingCategory.as_view(),
        name='createCategory'
    ),

]
