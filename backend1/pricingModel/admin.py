from django.contrib import admin
# from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED,
from pricingModel.models import Category,Component,Price
# Register your models here.

# admin.site.register(Cammera_Pricing)
# admin.site.register(UserPricing)
# admin.site.register(AI_ENABLED)
admin.site.register(Category)
admin.site.register(Component)
admin.site.register(Price)