from django.contrib import admin
from pricingModel.models import Cammera_Pricing, UserPricing, AI_ENABLED
# Register your models here.

admin.site.register(Cammera_Pricing)
admin.site.register(UserPricing)
admin.site.register(AI_ENABLED)