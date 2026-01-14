from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Pricing(models.Model):
    cammera = models.IntegerField()
    procesorer = models.IntegerField()
    server = models.IntegerField()
    ai_features = models.CharField(max_length=100)
    total_costing = models.IntegerField()
    
    def __str__(self):
        return self. ai_features

class UserPricing(models.Model):
    user_name = models.ForeignKey(User, on_delete=models.CASCADE)
    cammera = models.IntegerField()
    procesorer = models.IntegerField()
    server = models.IntegerField()
    ai_features = models.CharField(max_length=100)
    total_costing = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
         
  