import random
import bcrypt

from django.core.mail import send_mail
from django.conf import settings
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


# ✅ Generate 6 digit OTP
def generate_otp():
    return str(random.randint(100000, 999999))


# ✅ Hash OTP using bcrypt (secure)
def hash_otp(otp: str) -> str:
    otp_bytes = otp.encode("utf-8")
    hashed = bcrypt.hashpw(otp_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


# ✅ Verify OTP hash
def verify_otp(otp: str, otp_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            otp.encode("utf-8"),
            otp_hash.encode("utf-8")
        )
    except Exception:
        return False


# ✅ Normalize + validate email
def normalize_email(email: str) -> str:
    if not email:
        raise ValueError("Email is required")

    email = str(email).strip().lower()
    email = email.replace(" ", "")  # ✅ remove spaces inside

    try:
        validate_email(email)
    except ValidationError:
        raise ValueError("Invalid email address")

    return email



# ✅ Send OTP email (Django SMTP)
def send_otp_email(email: str, otp: str):
    subject = "Your OTP for Registration"
    message = f"Your OTP is: {otp}\n\nThis OTP will expire in 5 minutes."
    from_email = settings.DEFAULT_FROM_EMAIL

    send_mail(subject, message, from_email, [email])

    return {"status": "sent", "to": email}
