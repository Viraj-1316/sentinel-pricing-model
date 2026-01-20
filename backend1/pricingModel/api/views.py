from django.contrib.auth.models import User
from rest_framework import generics
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import ValidationError
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from rest_framework.decorators import api_view, permission_classes
# from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED,
from pricingModel.models import Category, Component, Price,UserPricing,AuditLog
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from django.core.mail import EmailMessage
from rest_framework.response import Response
from pricingModel.api.tasks import send_quotation_email_task
from pricingModel.api.utils import generate_enterprise_quotation_pdf
from io import BytesIO
import requests
from pricingModel.api.audit import create_audit_log   
from pricingModel.api.serializers import (
    AI_ENABLEDserializer,
    cameraPricingSerializer,
    userPricingSerializer,
    QuotationSerializer,
    storagePricingSerializer,
    categorySerializer,
    processorSerializer,
    AdminUserSerializer,
    AdminQuotationSerializer,
    AuditLogSerializer
)

class AdminUsersListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')
class AdminAllQuotationsView(generics.ListAPIView):
    serializer_class = AdminQuotationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return UserPricing.objects.select_related("user_name").prefetch_related("ai_features").order_by("-created_at")
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

    # ✅ Admin can download any quotation
    if request.user.is_staff:
        quotation = UserPricing.objects.filter(pk=pk).first()
    else:
        quotation = UserPricing.objects.filter(pk=pk, user_name=request.user).first()

    if not quotation:
        return Response({"detail": "Quotation not found"}, status=404)

    pdf = generate_enterprise_quotation_pdf(quotation, request.user.username)


    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="quotation_{quotation.id}.pdf"'
    return response


class cameraSlabsCS(generics.ListCreateAPIView):
    serializer_class = cameraPricingSerializer

    def get_queryset(self):
        return Component.objects.filter(category__name='Camera')
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]

        return [IsAuthenticated(), IsAdminUser()]
    
    def perform_create(self, serializer):
        costing = serializer.validated_data.pop('price')['costing']

        component = serializer.save(
            category=Category.objects.get(name='Camera')
        )

        Price.objects.create(
            component=component,
            costing=costing
        )
    
       
class cameraSlabRUD(generics.RetrieveUpdateDestroyAPIView):
    
    serializer_class = cameraPricingSerializer

    def get_queryset(self):
        return Component.objects.filter(category__name='Camera')
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]

        return [IsAuthenticated(), IsAdminUser()]
    

class aiFeaturesCL(generics.ListCreateAPIView):
    serializer_class = AI_ENABLEDserializer
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]
    
    def get_queryset(self):
        return Component.objects.filter(category__name='AI')
    
    def perform_create(self, serializer):
        costing = serializer.validated_data.pop('price')['costing']


        component = serializer.save(
            category=Category.objects.get(name='AI')
        )

        Price.objects.create(
            component=component,
            costing=costing
        )


class pricingCalculate(generics.ListCreateAPIView):
        serializer_class = userPricingSerializer
        permission_classes = [IsAuthenticated]

        def get_queryset(self):
            # Each user sees only their own pricing calculations
            return UserPricing.objects.filter(user_name=self.request.user).order_by('-created_at')

        def perform_create(self, serializer):

            cameras = serializer.validated_data['cammera']
            storage_days = serializer.validated_data['storage_days']
            ai_features = serializer.validated_data.get('ai_features', [])
            storage = Component.objects.filter(category__name='Storage').first()
            # as processor is not compulsary we use get method else we will direclty use the value of dict
            processor = serializer.validated_data.get('processor')
          
            pricing_range = Component.objects.filter(
                category__name='Camera',
                min_cammera__lte=cameras
            ).filter(
                Q(max_cammera__gte=cameras) | Q(max_cammera__isnull=True)
            ).first()

            if not pricing_range:
                raise ValidationError("Camera pricing not configured")

            if not hasattr(pricing_range, 'price'):
                raise ValidationError("Camera price missing")

            camera_cost = pricing_range.price.costing

            ai_cost = sum(ai.price.costing for ai in ai_features)
            
            processor_cost = 0
            if processor:
                if not hasattr(processor, 'price'):
                    raise ValidationError("Processor pricing not configured")
                processor_cost = processor.price.costing

            if not storage:
                raise ValidationError("Storage component not configured")

            if not hasattr(storage, 'price'):
                raise ValidationError("Storage pricing not configured")

            storage_used = cameras * storage.storage_per_cam * storage_days
            storage_cost = storage_used * storage.price.costing


            total_cost = (
                camera_cost +
                ai_cost +
                processor_cost +
                storage_cost
            )

            user_pricing = serializer.save(
                user_name=self.request.user,
                camera_cost=camera_cost,
                ai_cost=ai_cost,
                processor_cost=processor_cost,
                storage_cost=storage_cost,
                total_costing=total_cost,
                storage_days=storage_days
            )

            user_pricing.ai_features.set(ai_features)
            user_pricing.processor = processor
            user_pricing.save()
        # ✅ then save m2m relations
            create_audit_log(
                self.request,
                "CREATE_QUOTATION",
                f"Generated quotation. Cameras={cameras}, Total={total_cost}"
)


class UserQuotationList(generics.ListAPIView):
            serializer_class = QuotationSerializer
            permission_classes = [IsAuthenticated]

            def get_queryset(self):
                return UserPricing.objects.filter(
                    user_name=self.request.user
                ).order_by('-created_at')


class storageCosting(generics.ListCreateAPIView):
    
    serializer_class = storagePricingSerializer
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]
    
    def get_queryset(self):
        return Component.objects.filter(category__name='Storage')
    
    def perform_create(self, serializer):
        costing = serializer.validated_data.pop('price')['costing']

        component = serializer.save(
            category=Category.objects.get(name='Storage')
        )

        Price.objects.create(
            component=component,
            costing=costing
        )
    
        
class creatingCategory(generics.ListCreateAPIView):
    
    queryset = Category.objects.all()
    serializer_class = categorySerializer
    
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        
        serializer.save()


class processorUnit(generics.ListCreateAPIView):
    
    serializer_class = processorSerializer
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]
    
    def get_queryset(self):
        return Component.objects.filter(category__name='Processor')
    
    def perform_create(self, serializer):
        
        costing = serializer.validated_data.pop('price')['costing']
        
        processor = serializer.save(
            category = Category.objects.get(name='Processor')
        )

        Price.objects.create(
            component = processor,
            costing = costing
        )

class  processorUnitDetail(generics.RetrieveUpdateDestroyAPIView):
    
    serializer_class = processorSerializer
    
    queryset = Component.objects.filter(category__name='Processor')

    permission_classes = [IsAdminUser]
    
    def perform_update(self, serializer):
        costing = serializer.validated_data.pop('price', None)['costing']

        processor = serializer.save()

        if costing is not None:
            Price.objects.update_or_create(
                component=processor,
                defaults={'costing': costing}
            )
    def perform_destroy(self, instance):
        Price.objects.filter(component=instance).delete()
        instance.delete()
        
        
class AdminAuditLogsView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return UserPricing.objects.filter(
            user_name=self.request.user
            
        ).order_by('-created_at')
        
        
class AdminAuditLogsView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return AuditLog.objects.select_related("user").all().order_by("-created_at")
