from django.db import models
from django.contrib.auth.models import User

# Create your models here.
        
class Cammera_Pricing(models.Model):
    min_cammera = models.IntegerField()
    max_cammera = models.IntegerField(null=True, blank=True)
    Processor = models.CharField(max_length=50)
    total_costing = models.IntegerField()
    
    class Meta:
        ordering = ["min_cammera"]

    def __str__(self):
        if self.max_cammera:
            return f"{self.min_cammera}-{self.max_cammera} camera"
        return f"{self.min_cammera} camera"


class AI_ENABLED(models.Model):
    
    AI_feature = models.CharField(max_length=50)
    costing = models.IntegerField() 
    
    def __str__(self):
        return f"{self.AI_feature}"
    
class UserPricing(models.Model):
    user_name = models.ForeignKey(User, on_delete=models.CASCADE)
    cammera = models.IntegerField()
    ai_features = models.ManyToManyField(AI_ENABLED, blank=True)

    # ✅ ADD THESE FIELDS
    camera_cost = models.IntegerField(default=0)
    ai_cost = models.IntegerField(default=0)
    total_costing = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.user_name} -{self.total_costing}"
  