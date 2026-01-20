from django.urls import path
from pricingModel.api.views import (
    aiFeatures,
    defaultPricingListCreate,
    pricingCalculate,
    defaultPricingDetail,
    UserQuotationList,
    send_quotation_email,
    download_quotation_pdf,
    AdminUsersListView,
    AdminAllQuotationsView,
    AdminAuditLogsView,
)

urlpatterns = [
    path('cameraPricing/', defaultPricingListCreate.as_view(), name='cam'),
    path('cameraPricing/<int:pk>/', defaultPricingDetail.as_view(), name='cam-detail'),
    path('ai-feature/', aiFeatures.as_view(), name='ai'),
    path('Pricingcalculation/', pricingCalculate.as_view(), name='cal'),
    path('user-quotations/', UserQuotationList.as_view(), name='user-quotations'),
    path('quotation/<int:pk>/pdf/', download_quotation_pdf, name='quotation-pdf'),
    path('quotation/<int:pk>/send-email/', send_quotation_email, name='quotation-email'),
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users'),
    path('admin/quotations/', AdminAllQuotationsView.as_view(), name='admin-quotations'),
    path('admin/audit-logs/', AdminAuditLogsView.as_view(), name='admin-audit-logs'),
]
