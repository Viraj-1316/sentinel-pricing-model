# accounts/utils.py
import random
import re
import requests
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password

def generate_otp():
    return str(random.randint(100000, 999999))

def normalize_phone(phone_number: str) -> str:
    phone_number = phone_number.strip()
    if re.fullmatch(r"\d{10}", phone_number):
        return "+91" + phone_number
    if re.fullmatch(r"\+91\d{10}", phone_number):
        return phone_number
    raise ValueError("Invalid phone number format")

def hash_otp(otp: str):
    return make_password(otp)

def verify_otp(otp: str, otp_hash: str):
    return check_password(otp, otp_hash)
