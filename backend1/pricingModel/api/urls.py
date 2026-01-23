from django.urls import path
from pricingModel.api.views import (
    aiFeaturesCL,
    pricingCalculate,
    cameraSlabRUD,
    cameraSlabsCS,
    send_quotation_email,
    download_quotation_pdf,
    UserQuotationList,
    storageCosting,
    creatingCategory,
    processorUnit,
    processorUnitDetail,
    send_quotation_email,
    download_quotation_pdf,
    AdminUsersListView,
    AdminAllQuotationsView,
    AdminAuditLogsView,
    aiFeaturesCLDetails,
    storageCostingDetails,
    pricingRecomendationview
)

urlpatterns = [
    
     path(
        'cameraPricing/',
        cameraSlabsCS.as_view(),
        name='cam1'
    ),
    path(
        'cameraPricing/<int:pk>/',
        cameraSlabRUD.as_view(),
        name='cam-detail'
    ),
    path(
        'ai-feature/',
        aiFeaturesCL.as_view(),
        name='ai'
    ),
    path(
        'ai-feature/<int:pk>/',
        aiFeaturesCLDetails.as_view(),
        name='ai'
    ),
    path(
        'Pricingcalculation/',
        pricingCalculate.as_view(),
        name='cal'
    ),
    path(
        'Pricingcalculation/<int:pk>',
        pricingRecomendationview.as_view(),
        name = 'calDet'  
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
        'storage-costing/<int:pk>/',
        storageCostingDetails.as_view(),
        name='storageCostingDetail'
    ),
    path(
        'create-category/',
        creatingCategory.as_view(),
        name='createCategory'
    ),
    path(
        'processorUnit/',
        processorUnit.as_view(),
        name='processor'
    ),
    path(
        'processorUnit/<int:pk>/',
        processorUnitDetail.as_view(),
        name='processorRUD'
    ),
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users'),
    
    path('admin/quotations/', AdminAllQuotationsView.as_view(), name='admin-quotations'),
    
    path('admin/audit-logs/', AdminAuditLogsView.as_view(), name='admin-audit-logs'),

]
