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

    
    # ---- Camera pricing without ai model----
    min_cammera = models.IntegerField(null=True, blank=True)
    max_cammera = models.IntegerField(null=True, blank=True)
    core_hardware = models.CharField(max_length=100, null=True, blank=True)
    CPUcores = models.PositiveIntegerField(null=True, blank=True)
    ram_required = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="GB"
    )

    
    # ---- AI feature ----
    AI_feature = models.CharField(max_length=100, null=True, blank=True)

    # ---- Camera pricing with ai model ----
    min_cammeraA = models.IntegerField(null=True, blank=True)
    max_cammeraA = models.IntegerField(null=True, blank=True)
    AI_Component = models.CharField(max_length=100, null=True, blank=True)
    VRAM = models.PositiveIntegerField(null=True, blank=True)

    
    # ---- Storage ----
    storage_per_cam = models.IntegerField(null=True, blank=True)
    storage_perDay = models.IntegerField(null=True, blank=True)
    
    # ---- Licence ----
    Duration = models.IntegerField(default=1)
    
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

            if self.category and self.category.name.lower() == "storage":
                return f"{self.storage_perDay or 0} GB/day Storage"

            if self.category and self.category.name.lower() == "processor":
                return f"{self.core_hardware or self.AI_Component}"
            
            if self.category and self.category.name.lower() == "licence":
                return f"{self.Duartion}"

        except Exception:
            return f"Component #{self.id}"
        

class Price(models.Model):
    
        costing = models.IntegerField()   
        component = models.OneToOneField(Component, on_delete=models.CASCADE, related_name='price')
        
        def __str__(self):
            return f"{self.costing} ({self.component})"

   
class UserPricing(models.Model):
    include_cpu = models.BooleanField(default=True)
    include_gpu = models.BooleanField(default=True)
    # include_ai = models.BooleanField(default=True)
    include_storage = models.BooleanField(default=True)
    user_name = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="pricings"
    )

    cammera = models.PositiveIntegerField()

    # AI features selected by user
    ai_features = models.ManyToManyField(
        Component,
        blank=True,
        related_name="user_pricings"
    )

    # AI enabled cameras
    aiEnabledCam = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=0
    )

    # ---------- REQUIREMENTS (SYSTEM GENERATED) ----------
    vram_required = models.PositiveIntegerField(default=0)
    cpuCores_required = models.PositiveIntegerField(default=0)
    ram_required = models.PositiveIntegerField(default=0)

    # ---------- STORAGE ----------
    storage_used_user = models.PositiveIntegerField(default=0)
    storage_days = models.PositiveIntegerField(default=1)

    # ---------- COSTS ----------
    ai_cost = models.PositiveIntegerField(default=0)
    storage_cost = models.PositiveIntegerField(default=0)
    cpu_cost = models.PositiveIntegerField(default=0)
    gpu_cost = models.PositiveIntegerField(default=0)

    total_costing = models.PositiveIntegerField(default=0)

    # ---------- AUTO SELECTED HARDWARE ----------
    cpu = models.ForeignKey(
        Component,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cpu_usages"
    )

    gpu = models.ForeignKey(
        Component,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gpu_usages"
    )

    # ---------- Licence -----------
    
    licence = models.ForeignKey(
        Component,
        on_delete=models.PROTECT,
        related_name='licenseCosting',
        null=True,        
        blank=True
    )
    
    licenceCostU = models.IntegerField(null=True, blank=True) 
    DurationU = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    include_cpu = models.BooleanField(default=True)
    include_gpu = models.BooleanField(default=True)
    include_storage = models.BooleanField(default=True)
    # include_ai = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user_name.username} - ₹{self.total_costing}"

           

class AuditLog(models.Model):
        ACTION_CHOICES = [
            ("LOGIN", "Login"),
            ("LOGOUT", "Logout"),
            ("CREATE_QUOTATION", "Create Quotation"),
            ("DOWNLOAD_PDF", "Download PDF"),
            ("SEND_EMAIL", "Send Email"),
            ("DELETE_QUOTATION", "Delete Quotation"),
            ("UPDATE_PRICING", "Update Pricing"),
        ]

        user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
        action = models.CharField(max_length=50, choices=ACTION_CHOICES)
        details = models.TextField(blank=True, null=True)

        ip_address = models.GenericIPAddressField(null=True, blank=True)
        user_agent = models.TextField(null=True, blank=True)

        created_at = models.DateTimeField(auto_now_add=True)

        class Meta:
            ordering = ["-created_at"]

        def __str__(self):
            return f"{self.user_name} -{self.total_costing}"


# class AuditLog(models.Model):
#         ACTION_CHOICES = [
#             ("LOGIN", "Login"),
#             ("LOGOUT", "Logout"),
#             ("CREATE_QUOTATION", "Create Quotation"),
#             ("DOWNLOAD_PDF", "Download PDF"),
#             ("SEND_EMAIL", "Send Email"),
#             ("DELETE_QUOTATION", "Delete Quotation"),
#             ("UPDATE_PRICING", "Update Pricing"),
#         ]

#         user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
#         action = models.CharField(max_length=50, choices=ACTION_CHOICES)
#         details = models.TextField(blank=True, null=True)

#         ip_address = models.GenericIPAddressField(null=True, blank=True)
#         user_agent = models.TextField(null=True, blank=True)

#         created_at = models.DateTimeField(auto_now_add=True)

#         class Meta:
#             ordering = ["-created_at"]

#         def __str__(self):
#             uname = self.user.username if self.user else "Unknown"
#             return f"{uname} - {self.action} @ {self.created_at}"
# class PhoneOTP(models.Model):
#     phone = models.CharField(max_length=15, unique=True)  # +91xxxxxxxxxx
#     otp_hash = models.CharField(max_length=128)
#     created_at = models.DateTimeField(auto_now_add=True)
#     expires_at = models.DateTimeField()

#     attempts = models.IntegerField(default=0)  # wrong OTP attempts

#     def save(self, *args, **kwargs):
#         if not self.expires_at:
#             self.expires_at = timezone.now() + timedelta(minutes=5)
#         super().save(*args, **kwargs)

#     def is_expired(self):
#         return timezone.now() > self.expires_at
