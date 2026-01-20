# from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED, 
from pricingModel.models import Category, Component, Price,UserPricing
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
            "camera_cost",
            "ai_cost",
            "total_costing",
            "ai_features",
            "created_at",
        ]

    def get_username(self, obj):
        return obj.user_name.username if obj.user_name else None

    def get_ai_features(self, obj):
        return list(obj.ai_features.values("AI_feature", "costing"))


# class Cammera_PricingSerializer(serializers.ModelSerializer):
    
#         class Meta:
#             model = Cammera_Pricing
#             fields = "__all__"

                        
class userPricingSerializer(serializers.ModelSerializer):

    total_costing = serializers.IntegerField(read_only=True)
    camera_cost = serializers.IntegerField(read_only=True)
    ai_cost = serializers.IntegerField(read_only=True)
    processor_cost = serializers.IntegerField(read_only=True)
    storage_cost = serializers.IntegerField(read_only=True)

    storage_days = serializers.IntegerField(write_only=True)

    ai_features = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Component.objects.filter(category__name='AI'),
        required=False
    )

    processor = serializers.PrimaryKeyRelatedField(
        queryset=Component.objects.filter(category__name='Processor'),
        required = False
    )

    class Meta:
        model = UserPricing
        fields = [
            'id',
            'cammera',
            'storage_days',
            'ai_features',
            'processor',
            'camera_cost',
            'ai_cost',
            'processor_cost',
            'storage_cost',
            'total_costing',
            'created_at',
        ]
        

# chage is id is removed               
class AI_ENABLEDserializer(serializers.ModelSerializer):
        costing = serializers.IntegerField(source='price.costing', read_only=True)
        class Meta:
            model = Component
            fields = ['id','AI_feature', 'costing']          


class QuotationSerializer(serializers.ModelSerializer):
    ai_features = AI_ENABLEDserializer(many=True, read_only=True)
   
    class Meta:
        model = UserPricing
        fields = [
            'cammera',
            'camera_cost',
            'ai_cost',
            'ai_features',
            'processor',
            'storage_days',
            'processor_cost',
            'total_costing',
            'created_at'
        ]


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

class cameraPricingSerializer(serializers.ModelSerializer):
    
    costing = serializers.IntegerField(source='price.costing')
    class Meta:
        
       model = Component
       fields = [
           'id',
           'min_cammera',
           'max_cammera',
           'costing'
       ]        

class storagePricingSerializer(serializers.ModelSerializer):
    costing = serializers.IntegerField(source='price.costing')
    # category = categorySerializer()
    class Meta:
        
        model = Component
        fields = [
                'storage_per_cam',
                'storage_perDay',
                'costing'
                ]
        
class processorSerializer(serializers.ModelSerializer):
    
    costing = serializers.IntegerField(source='price.costing', read_only = True)
    
    class Meta:
        
        model = Component
    
        fields = [
            'id',
            'name',
            'CPU',
            'GPU',
            'CPUcores',
            'GPUcores',
            'ram_required',
            'costing'
        ]
 
        
            
    
