from django.db import models
from django.contrib.auth.models import User
   
class Category(models.Model):
    
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return f"Id {self.id} {self.name} "
    

class Component(models.Model):

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE
    )

    name = models.CharField(max_length=100, null=True, blank=True)
    # ---- Camera pricing ----
    min_cammera = models.IntegerField(null=True, blank=True)
    max_cammera = models.IntegerField(null=True, blank=True)

    # ---- AI feature ----
    AI_feature = models.CharField(max_length=100, null=True, blank=True)

    # ---- Processor ----
    CPU = models.CharField(max_length=50, null=True, blank=True)
    GPU = models.CharField(max_length=50, null=True, blank=True)
    CPUcores = models.PositiveIntegerField(null=True)
    GPUcores = models.PositiveIntegerField(null=True)
    ram_required = models.PositiveIntegerField(null=True, blank=True, help_text="GB")

    # ---- Storage ----
    storage_per_cam = models.IntegerField(null=True, blank=True)
    storage_perDay = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ["min_cammera"]

    def __str__(self):
        try:
            if self.category and self.category.name.lower() == "ai":
                return self.AI_feature or "AI Component"

            if self.category and self.category.name.lower() == "camera":
                min_cam = self.min_cammera or 0
                max_cam = self.max_cammera or "∞"
                return f"{min_cam} - {max_cam} cameras"

            if self.category and self.category.name.lower() == "processor":
                return self.name or "Processor Component"

            if self.category and self.category.name.lower() == "storage":
                return f"{self.storage_per_cam or 0} GB/day Storage"

            return self.name or f"Component #{self.id}"

        except Exception:
            return f"Component #{self.id}"


        
        
class Price(models.Model):
    
    costing = models.IntegerField()   
    component = models.OneToOneField(Component, on_delete=models.CASCADE, related_name='price')
    
    def __str__(self):
        return f"{self.costing} ({self.component})"

   
class UserPricing(models.Model):
    
        user_name = models.ForeignKey(User, on_delete=models.CASCADE)      
        cammera = models.IntegerField()
        ai_features = models.ManyToManyField(Component, blank=True, related_name='user_pricings')
        processor = models.ForeignKey(Component, on_delete=models.SET_NULL, related_name='user_processing_unit', null=True)
        storage = models.ForeignKey(Component, on_delete=models.SET_NULL, related_name='user_storage', null=True)
        
        
        camera_cost = models.IntegerField(default=0)
        ai_cost = models.IntegerField(default=0)
        processor_cost = models.IntegerField(default=0)
        storage_cost = models.IntegerField(default=0)
        total_costing = models.IntegerField(default=0)

        created_at = models.DateTimeField(auto_now_add=True)
        def __str__(self):
            return f"{self.user_name} -{self.total_costing}"
           
