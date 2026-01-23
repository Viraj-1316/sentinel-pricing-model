# accounts/sms.py
import requests
from django.conf import settings

def send_otp_sms_fast2sms(phone: str, otp: str):
    url = "https://www.fast2sms.com/dev/bulkV2"
    payload = {
        "route": "otp",
        "variables_values": otp,
        "numbers": phone.replace("+91", ""),
    }
    headers = {
        "authorization": settings.FAST2SMS_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    r = requests.post(url, data=payload, headers=headers, timeout=15)
    return r.json()
