from rest_framework import generics
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import ValidationError
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from rest_framework.decorators import api_view, permission_classes
from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from django.core.mail import EmailMessage
from rest_framework.response import Response
from pricingModel.api.tasks import send_quotation_email_task
from pricingModel.api.utils import generate_enterprise_quotation_pdf
from io import BytesIO
from pricingModel.api.serializers import (
    userPricingSerializer,
    Cammera_PricingSerializer,
    AI_ENABLEDserializer,
    QuotationSerializer
)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_quotation_email(request, pk):

    quotation = UserPricing.objects.filter(pk=pk, user_name=request.user).first()
    if not quotation:
        return Response({"detail": "Quotation not found"}, status=404)

    to_email = request.user.email
    if not to_email:
        return Response({"detail": "Email is required"}, status=400)

    # ✅ Celery Task Trigger (async)
    send_quotation_email_task.delay(quotation.id, request.user.username, to_email)

    return Response({"detail": "Email sending started ✅"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_quotation_pdf(request, pk):
    quotation = UserPricing.objects.filter(pk=pk, user_name=request.user).first()
    if not quotation:
        return Response({"detail": "Quotation not found"}, status=404)

    pdf = generate_enterprise_quotation_pdf(quotation, request.user.username)

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="quotation_{quotation.id}.pdf"'
    response.write(pdf)
    return response


class defaultPricingListCreate(generics.ListCreateAPIView):
    queryset = Cammera_Pricing.objects.all()
    serializer_class = Cammera_PricingSerializer

    def get_permissions(self):
        # ✅ All logged in users can view pricing list
        if self.request.method == "GET":
            return [IsAuthenticated()]

        # ✅ Only admin can create
        return [IsAuthenticated(), IsAdminUser()]


class defaultPricingDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Cammera_Pricing.objects.all()
    serializer_class = Cammera_PricingSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]


class aiFeatures(generics.ListCreateAPIView):
    queryset = AI_ENABLED.objects.all()
    serializer_class = AI_ENABLEDserializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]


class pricingCalculate(generics.ListCreateAPIView):
    serializer_class = userPricingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # ✅ Each user sees only their own pricing calculations
        return UserPricing.objects.filter(user_name=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        cameras = serializer.validated_data['cammera']
        ai_features = serializer.validated_data.get('ai_features', [])

        # ✅ Find correct camera slab
        pricing_range = Cammera_Pricing.objects.filter(
            min_cammera__lte=cameras
        ).filter(
            Q(max_cammera__gte=cameras) | Q(max_cammera__isnull=True)
        ).first()

        if not pricing_range:
            raise ValidationError({"cammera": "No camera pricing slab found for this camera count"})

        if pricing_range is None:
          pricing = Cammera_Pricing.objects.order_by('-min_cammera').first()
          
        camera_cost = int(pricing_range.total_costing)
        ai_cost = sum(int(ai.costing) for ai in ai_features)

        total_cost = camera_cost + ai_cost

        serializer.save(
            user_name = self.request.user,
            total_cost = total_cost
        )

class UserQuotationList(generics.ListAPIView):
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserPricing.objects.filter(
            user_name=self.request.user
        ).order_by('-created_at')
