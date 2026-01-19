# from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED, 
from pricingModel.models import Category, Component, Price,UserPricing
from rest_framework import serializers
from django.db.models import Q


# class Cammera_PricingSerializer(serializers.ModelSerializer):
    
#         class Meta:
#             model = Cammera_Pricing
#             fields = "__all__"

                        
class userPricingSerializer(serializers.ModelSerializer):
    total_costing = serializers.IntegerField(read_only=True)
    camera_cost = serializers.IntegerField(read_only=True)
    ai_cost = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserPricing
        fields = [
            'id',
            'cammera',
            'ai_features',
            'camera_cost',
            'ai_cost',
            'total_costing',
            'created_at'
        ]
        read_only_fields = ['camera_cost', 'ai_cost', 'total_costing', 'created_at']

# chage is id is removed               
class AI_ENABLEDserializer(serializers.ModelSerializer):
        costing = serializers.IntegerField(source='price.costing', read_only=True)
        class Meta:
            model = Component
            fields = ['AI_feature', 'costing']          

class QuotationSerializer(serializers.ModelSerializer):
    ai_features = AI_ENABLEDserializer(many=True, read_only=True)
    # camera_cost = serializers.SerializerMethodField()
    class Meta:
        model = UserPricing
        fields = [
            'cammera',
            'camera_cost',
            'ai_cost',
            'ai_features',
            'total_costing',
            'created_at'
        ]


#     def get_camera_cost(self, obj):
#         pricing_range = Cammera_Pricing.objects.filter(
#             min_cammera__lte=obj.cammera
#         ).filter(
#             Q(max_cammera__gte=obj.cammera) | Q(max_cammera__isnull=True)
#         ).first()

#         if pricing_range is None:
#           pricing_range = Cammera_Pricing.objects.order_by('-min_cammera').first()
          
#         return pricing_range.total_costing


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
    
    total_costing = serializers.IntegerField(source='price.costing', read_only=True)
    class Meta:
        
       model = Component
       fields = [
           'min_cammera',
           'max_cammera',
           'total_costing'
       ]        