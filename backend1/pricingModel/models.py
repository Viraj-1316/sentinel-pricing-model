from django.db import models
from django.contrib.auth.models import User
   
class Category(models.Model):
    
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return f"Id {self.id} {self.name} "
    

class Component(models.Model):
    
    AI_feature = models.CharField(max_length=100,null=True, blank=True)
    min_cammera = models.IntegerField(null=True, blank=True)
    max_cammera = models.IntegerField(null=True, blank=True)
    category = models.ForeignKey(
    Category,
    on_delete=models.CASCADE,
    null=True,
    blank=True
)
    storage_per_cam = models.IntegerField(null=True, blank=True)
    storage_perDay = models.IntegerField(null=True, blank=True)  
    
    class Meta:
        ordering = ["min_cammera"]
    
    def __str__(self):
        return f"{self.AI_feature} ({self.category.name})"
        
        
class Price(models.Model):
    
    costing = models.IntegerField()   
    component = models.OneToOneField(Component, on_delete=models.CASCADE, name='price')
    
    def __str__(self):
        return f"{self.costing} ({self.price.AI_feature})"
    
class UserPricing(models.Model):
        user_name = models.ForeignKey(User, on_delete=models.CASCADE)      
        cammera = models.IntegerField()
        ai_features = models.ManyToManyField(Component, blank=True, related_name='user_pricings')
        camera_cost = models.IntegerField(default=0)
        ai_cost = models.IntegerField()
        total_costing = models.IntegerField(default=0)

        created_at = models.DateTimeField(auto_now_add=True)
        def __str__(self):
            return f"{self.user_name} -{self.total_costing}"
           