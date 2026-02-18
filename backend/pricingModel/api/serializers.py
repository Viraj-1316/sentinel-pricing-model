# from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED, 
from pricingModel.models import Category, Component, Price,UserPricing, AuditLog
from rest_framework import serializers
from django.db.models import Q
from django.contrib.auth.models import User
from pricingModel.models import  UserPricing, AuditLog
from rest_framework import serializers
from django.db.models import Q
from django.contrib.auth.models import User

class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'date_joined', 'last_login', 'role']

    def get_role(self, obj):
        return "Admin" if obj.is_staff else "User"


class AdminQuotationSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    ai_features = serializers.SerializerMethodField()

    class Meta:
        model = UserPricing
        fields = [
            "id",
            "username",
            "cammera",
            "ai_features",
            "ai_cost",
            "cpu_cost",
            "gpu_cost",
             "storage_cost",
            "total_costing",
            "ai_features",
            "created_at",
        ]

    def get_username(self, obj):
        return obj.user_name.username if obj.user_name else None

    def get_ai_features(self, obj):
        return list(obj.ai_features.values("AI_feature", "price"))

                        
class userRequirementSerializer(serializers.ModelSerializer):
    
    storage_used_user = serializers.IntegerField(read_only=True)
    storage_days =   serializers.IntegerField(write_only=True)
    vram_required = serializers.IntegerField(read_only=True)
    cpuCores_required = serializers.IntegerField(read_only=True)
    ram_required = serializers.IntegerField(read_only=True)
    
    ai_features = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Component.objects.filter(category__name='AI'),
        required=False
    )

    class Meta:
        model = UserPricing
        fields = [
            'id',
            'cammera',
            'aiEnabledCam',
            'storage_days',
            'ai_features',
            'storage_used_user',
            'vram_required',
            'cpuCores_required',
            'ram_required',
            "include_cpu",
            "include_gpu",
            "include_storage",
            "DurationU",
            'created_at',
        ]

class AI_ENABLEDserializer(serializers.ModelSerializer):
        costing = serializers.IntegerField(source='price.costing')
        class Meta:
            model = Component
            fields = ['id','AI_feature', 'costing']  
            
class ComponentDisplaySerializer(serializers.ModelSerializer):
    costing = serializers.IntegerField(source="price.costing", read_only=True)

    class Meta:
        model = Component
        fields = [
            "id",
            "core_hardware", 
            "CPUcores",
            "VRAM",
            "costing",
            "AI_Component",
            "ram_required",
        ]

class licensePricingSerializer(serializers.ModelSerializer):
    
    costing = serializers.IntegerField(source='price.costing')
    class Meta:
        
       model = Component
       fields = [
           'id',
           'Duration',
           'costing'
       ]         
class UserFinalQuotationSerializer(serializers.ModelSerializer):

    cpu = ComponentDisplaySerializer(read_only=True)
    gpu = ComponentDisplaySerializer(read_only=True)
    ai_features = AI_ENABLEDserializer(many=True, read_only=True)

    # ✅ WRITEABLE (THIS FIXES EVERYTHING)
    DurationU = serializers.IntegerField(required=False)

    # ✅ READABLE (UI display)
    licenceDetails = serializers.SerializerMethodField()

    class Meta:
        model = UserPricing
        fields = [
            "id",
            "cammera",
            "cpuCores_required",
            "ram_required",
            "vram_required",

            "cpu",
            "gpu",

            "cpu_cost",
            "gpu_cost",
            "ai_cost",
            "storage_cost",
            "storage_used_user",
            "storage_days",
            "total_costing",

            "ai_features",

            "DurationU",
            "licenceDetails",
            "licenceCostU",

            "include_cpu",
            "include_gpu",
            "include_storage",
            "created_at",
        ]

    def get_licenceDetails(self, obj):
        if not obj.DurationU:
            return None

        licence_obj = Component.objects.filter(id=obj.DurationU).first()

        if licence_obj:
            return licensePricingSerializer(licence_obj).data

        return None




class categorySerializer(serializers.ModelSerializer):
    
    class Meta:
        
        model = Category
        fields = "__all__"


class pricingSerializer(serializers.ModelSerializer):
    
    class Meta:
        
        model = Price
        fields = "__all__"        

class componentDetailSerializer(serializers.ModelSerializer):
    
    category = categorySerializer()
    price = pricingSerializer(source = 'price.costing', many=True)
    
    class Meta:
        
        model = Component
        fields = "__all__"

       
  
class storagePricingSerializer(serializers.ModelSerializer):
    costing = serializers.IntegerField(source='price.costing')
    # category = categorySerializer()
    class Meta:
        
        model = Component
        fields = [
                'id',
                'storage_per_cam',
                'storage_perDay',
                'costing'
                ]
        
class processorSerializer(serializers.ModelSerializer):
    
    costing = serializers.IntegerField(source='price.costing')
    
    class Meta:
        
        model = Component
    
        fields = [
            "id",
            # "min_cammeraA",
            # "max_cammeraA",
            # "min_cammera",
            # "max_cammera",
            "core_hardware", 
            "CPUcores",
            "VRAM",
            "costing",
            "AI_Component",
            "ram_required",
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "action",
            "username",
            "details",
            "ip_address",
            "user_agent",
            "created_at",
        ]

class configuration(serializers.ModelSerializer):
    
    class Meta:
        model = Component
        fields = [
            "id",
            "cores_required1",
            "cores_required2",
            "ram_required1",
            "VRAM_required"
        ]