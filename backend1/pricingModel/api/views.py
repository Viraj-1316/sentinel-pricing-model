from django.contrib.auth.models import User
from rest_framework import generics
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import ValidationError
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from django.views.decorators.clickjacking import xframe_options_exempt
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
from rest_framework import filters
from pricingModel.api.audit import create_audit_log   
from pricingModel.api.serializers import (
    AI_ENABLEDserializer,
    cameraPricingSerializer,
    # QuotationSerializer,
    storagePricingSerializer,
    categorySerializer,
    processorSerializer,
    AdminUserSerializer,
    AdminQuotationSerializer,
    AuditLogSerializer,
    userRequirementSerializer,
    UserFinalQuotationSerializer
)
import math
 
 
 
class AdminUsersListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
 
    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')
    
class AdminAllQuotationsView(generics.ListAPIView):
    serializer_class = AdminQuotationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [filters.OrderingFilter]
 
    # ✅ Allow only correct fields
    ordering_fields = ["created_at", "id"]  # add other valid fields if needed
    ordering = ["-created_at"]
 
    def get_queryset(self):
        return (
            UserPricing.objects
            .select_related("user_name")
            .prefetch_related("ai_features")
            .order_by("-created_at")
        )
 
class AdminQuatationDetail(generics.RetrieveDestroyAPIView):
    queryset = UserPricing.objects.all()
    serializer_class = AdminQuotationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
          
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
@xframe_options_exempt
def download_quotation_pdf(request, pk):
 
    if request.user.is_staff:
        quotation = UserPricing.objects.filter(pk=pk).first()
    else:
        quotation = UserPricing.objects.filter(pk=pk, user_name=request.user).first()
 
    if not quotation:
        return Response({"detail": "Quotation not found"}, status=404)
 
    pdf = generate_enterprise_quotation_pdf(quotation, request.user.username)
 
    response = HttpResponse(pdf, content_type="application/pdf")
 
    # inline = preview in browser / iframe
    response["Content-Disposition"] = f'inline; filename="quotation_{quotation.id}.pdf"'
    response["Content-Length"] = len(pdf)
 
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
    
    def perform_update(self, serializer):
        costing = serializer.validated_data.pop('price', None)['costing']
 
        cameraPricing = serializer.save()
 
        if costing is not None:
            Price.objects.update_or_create(
                component=cameraPricing,
                defaults={'costing': costing}
            )
      
    def perform_destroy(self, instance):
        Price.objects.filter(component=instance).delete()
        instance.delete()
        
        
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
 
class aiFeaturesCLDetails(generics.RetrieveUpdateDestroyAPIView):
    
    serializer_class = cameraPricingSerializer
 
    def get_queryset(self):
        return Component.objects.filter(category__name='AI')
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
 
        return [IsAuthenticated(), IsAdminUser()]
    
    def perform_update(self, serializer):
        costing = serializer.validated_data.pop('price', None)['costing']
 
        AICosting = serializer.save()
 
        if costing is not None:
            Price.objects.update_or_create(
                component=AICosting,
                defaults={'costing': costing}
            )
      
    def perform_destroy(self, instance):
        Price.objects.filter(component=instance).delete()
        instance.delete()
 
        
class pricingCalculate(generics.ListCreateAPIView):
        serializer_class = userRequirementSerializer
        permission_classes = [IsAuthenticated]
 
        def get_queryset(self):
            # Each user sees only their own pricing calculations
            if self.request.user.is_superuser:
                return UserPricing.objects.all()
            else:
                return UserPricing.objects.filter(user_name=self.request.user).order_by('-created_at')
 
        def perform_create(self, serializer):
 
            # ---------- SAFE INPUT READING ----------
            cameras = serializer.validated_data['cammera']
            storage_days = serializer.validated_data.get('storage_days', 1)
            ai_features = serializer.validated_data.get('ai_features', [])
            aiEnabledCam = serializer.validated_data.get('aiEnabledCam')
            # licenceDuration = serializer.validated_data.get['Duration']
            
            if not cameras:
                raise ValidationError("Camera count is required")
 
            # ---------- INITIALIZE VARIABLES (VERY IMPORTANT) ----------
            vram = 0
            cpuCores_required = 0
            ram_required = 0
            
            # ---------- STORAGE ----------
            storage = Component.objects.filter(category__name='Storage').first()
            if not storage:
                raise ValidationError("Storage component not configured")
            if not hasattr(storage, 'price'):
                raise ValidationError("Storage pricing not configured")
 
            # ---------- AI COST ----------
            
            if aiEnabledCam:
                aiEnabledCam = aiEnabledCam
            else :
                aiEnabledCam = cameras    
 
            if ai_features :
                aiEnabledCam1 = aiEnabledCam
            else:  
                aiEnabledCam1 = 0
                
            # ---------- CPU / RAM ----------
            vram = int(0.6*aiEnabledCam1)
            cpuCores_required = int(0.128 * cameras)
            ram_required = int(0.256 * cameras)
 
            # ---------- STORAGE COST ----------
            storage_used = cameras * storage.storage_per_cam * storage_days
            storage_used_user = storage_used * 19
            
            # ---------- SAVE ----------
            user_pricing = serializer.save(
                user_name=self.request.user,
                aiEnabledCam=aiEnabledCam1,
                storage_days=storage_days,
                storage_used_user=storage_used_user,
                vram_required=vram,
                cpuCores_required=cpuCores_required,
                ram_required=ram_required,
                # Duration = licenceDuration
            )
 
            user_pricing.ai_features.set(ai_features)
 
    
 
 
class pricingRecomendationview(generics.RetrieveUpdateAPIView):
    serializer_class = UserFinalQuotationSerializer
    permission_classes = [IsAuthenticated]
 
    def get_queryset(self):
            # Each user sees only their own pricing calculations
            if self.request.user.is_superuser:
                return UserPricing.objects.all()
            else:
                return UserPricing.objects.filter(user_name=self.request.user).order_by('-created_at')
 
 
    def perform_update(self, serializer):
        instance = self.get_object()
        vramUser = instance.vram_required
 
        validated = serializer.validated_data
        include_cpu = validated.get("include_cpu", instance.include_cpu)
        include_gpu = validated.get("include_gpu", instance.include_gpu)
        include_storage = validated.get("include_storage", instance.include_storage)
        
        cpu = None
        cpu_cost = 0
        if include_cpu:
            # ---------- CPU ----------
            cpu = Component.objects.filter(
                category__name="Processor",
                CPUcores__isnull=False,
                CPUcores__gte=instance.cpuCores_required
            ).order_by("CPUcores").first()
 
            if not cpu:
                raise ValidationError("No CPU meets required core count")
 
            cpu_price = Price.objects.filter(component=cpu).first()
            if not cpu_price:
                raise ValidationError(f"Price not configured for CPU: {cpu.core_hardware}")
 
            cpu_cost = cpu_price.costing
 
        # ---------- GPU ----------
        gpu = None
        gpu_cost = 0
 
        if include_gpu and vramUser > 0:
            if vramUser <= 48:
                gpu = Component.objects.filter(
                    category__name="Processor",
                    VRAM__isnull=False,
                    VRAM__gte=vramUser
                ).order_by("VRAM").first()
 
                if not gpu:
                    raise ValidationError("No GPU meets VRAM requirement")
 
                gpu_price = Price.objects.filter(component=gpu).first()
                
                if not gpu_price:
                    raise ValidationError("GPU price not configured")
 
                gpu_cost = gpu_price.costing
            else:
                gpu_units = math.ceil(vramUser / 48)
                gpu = Component.objects.filter(
                    category__name="Processor",
                    VRAM__isnull=False
                ).order_by("-VRAM").first()
 
                if not gpu:
                    raise ValidationError("No GPU configured")
 
                gpu_price = Price.objects.filter(component=gpu).first()
                if not gpu_price:
                    raise ValidationError("GPU price not configured")
 
                gpu_cost = gpu_price.costing * gpu_units
 
        # ---------- AI FEATURES ----------
        ai_cost = 0
        for ai in instance.ai_features.all():
            ai_price = Price.objects.filter(component=ai).first()
            if not ai_price:
                raise ValidationError(f"Price not configured for AI feature: {ai.AI_feature}")
            ai_cost += ai_price.costing
 
        storage_cost = 0
        if include_storage:
            # ---------- STORAGE ----------
            storage = Component.objects.filter(category__name="Storage").first()
            if not storage:
                raise ValidationError("Storage component not configured")
 
            storage_price = Price.objects.filter(component=storage).first()
            if not storage_price:
                raise ValidationError("Storage price not configured")
 
            storage_cost = (instance.storage_used_user / 19) * storage_price.costing
 
        # license = Component.objects.filter(
        #     category__name="licence",
        #     Duartion = instance.Duartion
        #     ).first()
        
        # licensePrice = Price.objects.filter(component=license).first()
        
        # licenseCost = licensePrice.costing
        
        # ---------- TOTAL ----------
        total_cost = cpu_cost + gpu_cost + ai_cost + storage_cost
 
        serializer.save(
            cpu=cpu,
            gpu=gpu,
            cpu_cost=cpu_cost,
            gpu_cost=gpu_cost,
            ai_cost=ai_cost,
            storage_cost=storage_cost,
            # licenceCostU = licenseCost,
            include_cpu = include_cpu,
            include_gpu = include_gpu,
            include_storage = include_storage,
            total_costing=total_cost,
            
        )
 
        create_audit_log(
            self.request,
            "UPDATE_PRICING",
            f"Final pricing calculated. Total={total_cost}"
        )
 
 
class UserQuotationList(generics.ListAPIView):
            serializer_class = UserFinalQuotationSerializer
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
    
class storageCostingDetails(generics.RetrieveDestroyAPIView):
    
    serializer_class = storagePricingSerializer
    
    def get_queryset(self):
        return Component.objects.filter(category__name= 'Storage')
    
    def perform_update(self, serializer):       
        costing = serializer.validated_data.pop('price', None)['costing']
 
        strogeDetails = serializer.save()
 
        if costing is not None:
            Price.objects.update_or_create(
                component=strogeDetails,
                defaults={'costing': costing}
            )
 
    def perform_destroy(self, instance):
        Price.objects.filter(component=instance).delete()
        instance.delete()
           
class creatingCategory(generics.ListCreateAPIView):
    
    queryset = Category.objects.all()
    serializer_class = categorySerializer
    
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        
        serializer.save()
class creatingCategoryRUD(generics.RetrieveUpdateDestroyAPIView):
    
    queryset = Category.objects.all()
    serializer_class = categorySerializer
    
    permission_classes = [IsAdminUser]
    
    def perform_update(self, serializer):
        
        serializer.save()       
    def perform_destroy(self, instance):
        instance.delete()   
 
 
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
      
 