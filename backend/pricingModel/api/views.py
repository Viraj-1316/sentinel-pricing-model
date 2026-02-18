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
from rest_framework import status
from rest_framework import filters
from pricingModel.api.audit import create_audit_log   
from pricingModel.api.serializers import (
    AI_ENABLEDserializer,
    licensePricingSerializer,
    # QuotationSerializer,
    storagePricingSerializer,
    categorySerializer,
    processorSerializer,
    AdminUserSerializer,
    AdminQuotationSerializer,
    AuditLogSerializer,
    userRequirementSerializer,
    UserFinalQuotationSerializer,
    processorSerializer,
    configuration,
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
          
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_role(request, user_id):
 
    # ✅ Only admin or superuser
    if not request.user.is_staff and not request.user.is_superuser:
        return Response(
            {"detail": "Permission denied"},
            status=status.HTTP_403_FORBIDDEN
        )
 
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
 
    # ❌ Never touch superuser
    if target_user.is_superuser:
        return Response(
            {"detail": "Cannot modify superuser"},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    # ❌ Admin cannot modify another admin
    if request.user.is_staff and not request.user.is_superuser:
        if target_user.is_staff:
            return Response(
                {"detail": "Admin cannot modify another admin"},
                status=status.HTTP_400_BAD_REQUEST
            )
 
    # ❌ Cannot modify self
    if request.user.id == target_user.id:
        return Response(
            {"detail": "You cannot change your own role"},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    # 🔁 TOGGLE ROLE
    target_user.is_staff = not target_user.is_staff
    target_user.save(update_fields=['is_staff'])
 
    role = "Admin" if target_user.is_staff else "User"
 
    return Response({
        "detail": f"User {target_user.username} role changed to {role} ✅",
        "is_staff": target_user.is_staff
    }, status=status.HTTP_200_OK)
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_status(request, user_id):
 
    # Only admin or superuser
    if not request.user.is_staff and not request.user.is_superuser:
        return Response(
            {"detail": "Permission denied"},
            status=status.HTTP_403_FORBIDDEN
        )
 
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
 
    # Never disable superuser
    if user.is_superuser:
        return Response(
            {"detail": "Cannot disable superuser"},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    # Cannot disable yourself
    if request.user.id == user.id:
        return Response(
            {"detail": "You cannot disable your own account"},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    # Toggle active
    user.is_active = not user.is_active
    user.save(update_fields=['is_active'])
 
    state = "activated" if user.is_active else "deactivated"
 
    return Response({
        "detail": f"User {user.username} {state} ✅",
        "is_active": user.is_active
    })
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_quotation_email(request, pk):
 
    qs = UserPricing.objects.filter(pk=pk)
 
    # 🔐 Non-admins can only access their own quotations
    if not request.user.is_staff and not request.user.is_superuser:
        qs = qs.filter(user_name=request.user)
 
    quotation = qs.first()
 
    if not quotation:
        return Response({"detail": "Quotation not found"}, status=404)
 
    print("REQUEST DATA:", request.data)
    print("USER EMAIL:", request.user.email)
 
    to_email = (
        request.data.get("Email")
        or request.data.get("email")
        or request.user.email
    )
 
    if not to_email:
        return Response({"detail": "Email is required"}, status=400)
 
    send_quotation_email_task.delay(
        quotation.id,
        request.user.username,
        to_email
    )
 
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
    serializer_class = processorSerializer
 
    def get_queryset(self):
        return Component.objects.filter(category__name='Processor')
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
 
        return [IsAuthenticated(), IsAdminUser()]
    
    def perform_create(self, serializer):
        costing = serializer.validated_data.pop('price')['costing']
 
        component = serializer.save(
            category=Category.objects.get(name='Processor')
        )
 
        Price.objects.create(
            component=component,
            costing=costing
        )
     
class cameraSlabRUD(generics.RetrieveUpdateDestroyAPIView):
    
    serializer_class = processorSerializer
 
    def get_queryset(self):
        return Component.objects.filter(category__name='Processor')
    
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
    
    serializer_class = AI_ENABLEDserializer
 
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
 
            # ---------- SAFE INPUT ----------
            cameras = serializer.validated_data.get("cammera")
            storage_days = serializer.validated_data.get("storage_days", 1)
            ai_features = serializer.validated_data.get("ai_features", [])
            aiEnabledCam = serializer.validated_data.get("aiEnabledCam")
            duration_id = serializer.validated_data.get("DurationU")

            configDetail = Component.objects.filter(category__name = 'CPU_GPU_Config').first()
            print(configDetail)
            ram_required1 = configDetail.ram_required1
            vram_required1 = configDetail.VRAM_required
            cores_required1 = configDetail.cores_required1
            cores_required2 = configDetail.cores_required2
            
            if not cameras:
                raise ValidationError("Camera count is required")
 
            if not duration_id:
                raise ValidationError("Licence duration is required")
 
            # ---------- VALIDATE LICENCE ----------
            license_component = Component.objects.filter(
                id=duration_id,
                category__name="licence"
            ).first()
 
            if not license_component:
                raise ValidationError("Invalid licence selection")
 
            try:
                licence_cost = license_component.price.costing
            except Price.DoesNotExist:
                raise ValidationError("Licence price not configured")
 
            # ---------- STORAGE ----------
            storage = Component.objects.filter(category__name="Storage").first()
 
            if not storage:
                raise ValidationError("Storage component not configured")
 
            try:
                storage_unit_cost = storage.price.costing
            except Price.DoesNotExist:
                raise ValidationError("Storage pricing not configured")
 
            # ---------- AI ENABLED CAMERAS ----------
            if aiEnabledCam:
                ai_enabled_cams = aiEnabledCam
            else:
                ai_enabled_cams = cameras
 
            ai_enabled_cams = int(ai_enabled_cams)
 
            # If no AI features → disable AI load
            if ai_features:
                ai_load_cams = ai_enabled_cams
            else:
                ai_load_cams = 0
 
            # ---------- REQUIREMENTS ----------
            vram_required = int(vram_required1 * ai_load_cams)
 
            if cameras < 61:
                cpuCores_required = int(cores_required1 * cameras)
                ram_required = int(ram_required1 * cameras)
            else:
                cpuCores_required = int(cores_required2 * cameras)
                ram_required = int(ram_required1 * cameras)
 
            # ---------- STORAGE CALCULATION ----------
            storage_used = cameras * storage_days
            storage_used_user = storage_used * 19
 
            # ---------- SAVE CLEAN DATA ----------
            user_pricing = serializer.save(
                user_name=self.request.user,
 
                aiEnabledCam=ai_load_cams,
                storage_days=storage_days,
                storage_used_user=storage_used_user,
 
                vram_required=vram_required,
                cpuCores_required=cpuCores_required,
                ram_required=ram_required,
 
                DurationU=license_component.id,
                licenceCostU=licence_cost,          
            )
 
            user_pricing.ai_features.set(ai_features)
 
    
 
 
class pricingRecomendationview(generics.RetrieveUpdateDestroyAPIView):
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
        validated = serializer.validated_data
 
        vramUser = instance.vram_required
 
        include_cpu = validated.get("include_cpu", instance.include_cpu)
        include_gpu = validated.get("include_gpu", instance.include_gpu)
        include_storage = validated.get("include_storage", instance.include_storage)
        
        cpu = None
        cpu_cost = 0
 
        # ---------- CPU ----------
        if include_cpu:
            cpu = Component.objects.filter(
                category__name="Processor",
                ram_required__isnull=False,
                CPUcores__isnull = False,
                CPUcores__gte = instance.cpuCores_required,
                ram_required__gte=instance.ram_required 
            ).order_by("ram_required").first()
 
            if not cpu:
                raise ValidationError("No CPU meets required core count")
 
            try:
                cpu_cost = cpu.price.costing
            except Price.DoesNotExist:
                raise ValidationError(f"Price not configured for CPU: {cpu.core_hardware}")
 
        # ---------- GPU ----------
        gpu = None
        gpu_cost = 0
 
        if include_gpu and vramUser > 0:
 
            gpu = Component.objects.filter(
                category__name="Processor",
                VRAM__isnull=False,
                VRAM__gte=vramUser
            ).order_by("VRAM").first()
 
            if not gpu:
                raise ValidationError("No GPU meets VRAM requirement")
 
            try:
                gpu_cost = gpu.price.costing
            except Price.DoesNotExist:
                raise ValidationError("GPU price not configured")
 
        # ---------- AI FEATURES ----------
        ai_cost = 0
        for ai in instance.ai_features.all():
            ai_price = Price.objects.filter(component=ai).first()
 
            if not ai_price:
                raise ValidationError(f"Price not configured for AI feature: {ai.AI_feature}")
 
            ai_cost += ai_price.costing
 
        # ---------- STORAGE ----------
        storage_cost = 0
 
        if include_storage:
            storage = Component.objects.filter(
                category__name="Storage"
            ).first()
 
            if not storage:
                raise ValidationError("Storage component not configured")
 
            storage_price = Price.objects.filter(component=storage).first()
 
            if not storage_price:
                raise ValidationError("Storage price not configured")
 
            storage_cost = (instance.storage_used_user / 19) * storage_price.costing
 
        # ---------- LICENCE (TRULY FIXED) ----------
        duration_id = serializer.validated_data.get("DurationU")
 
        if duration_id is None:
            duration_id = instance.DurationU
 
        license = Component.objects.filter(
            id=duration_id,
            category__name="licence",
        ).first()
 
        if not license:
            raise ValidationError("Selected licence component not configured")
 
        try:
            licenseCost = license.price.costing
        except Price.DoesNotExist:
            raise ValidationError("Licence price not configured")
 
        # ---------- TOTAL ----------
        total_cost = cpu_cost + gpu_cost + ai_cost + storage_cost + licenseCost
 
        serializer.save(
        cpu=cpu,
        gpu=gpu,
 
        cpu_cost=cpu_cost,
        gpu_cost=gpu_cost,
        ai_cost=ai_cost,
        storage_cost=storage_cost,
 
        DurationU=duration_id,        # ⭐⭐⭐ MISSING PIECE
        licenceCostU=licenseCost,
 
        include_cpu=include_cpu,
        include_gpu=include_gpu,
        include_storage=include_storage,
 
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
    
    serializer_class = licensePricingSerializer
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]
    
    def get_queryset(self):
        return Component.objects.filter(category__name='licence')
    
    def perform_create(self, serializer):
        
        costing = serializer.validated_data.pop('price')['costing']
        
        license = serializer.save(
            category = Category.objects.get(name='licence')
        )
 
        Price.objects.create(
            component = license,
            costing = costing
        )
class  processorUnitDetail(generics.RetrieveUpdateDestroyAPIView):
    
    serializer_class = licensePricingSerializer
    
    queryset = Component.objects.filter(category__name='licence')
 
    permission_classes = [IsAdminUser]
    
    def perform_update(self, serializer):
        costing = serializer.validated_data.pop('price', None)['costing']
        
        license = serializer.save()
 
        if costing is not None:
                Price.objects.update_or_create(
                    component=license,
                    defaults={'costing': costing}
                )
        
  
            
    def perform_destroy(self, instance):
        Price.objects.filter(component=instance).delete()
        instance.delete()
        

class AdminAuditLogsView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return AuditLog.objects.select_related("user").all().order_by("-created_at")

class setConfig(generics.ListCreateAPIView):

    serializer_class = configuration
    permission_classes = [IsAdminUser]

    queryset = Component.objects.filter(category__name='CPU_GPU_Config')

    def perform_create(self, serializer):
        serializer.save(
            category=Category.objects.get(name="CPU_GPU_Config")
        )

class setConfigRUD(generics.RetrieveUpdateDestroyAPIView):
    
    serializer_class = configuration
    permission_classes = [IsAdminUser]
    
    queryset = Component.objects.filter(category__name = 'CPU_GPU_Config' )
    
    # def perform_update(self, serializer):

    #     # instance = self.get_object()
    #     # validated = serializer.validated_data
        
    #     # cores_required1 = validated.get("cores_required1", instance.cores_required1)
    #     # cores_required2 = validated.get("cores_required2", instance.cores_required2)
    #     # ram_required1 = validated.get("ram_required1", instance.ram_required1)
    #     # VRAM_required = validated.get("VRAM_required", instance.VRAM_required)
        
    #     # instance.save()
    #     serializer.save()