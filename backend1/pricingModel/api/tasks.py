from celery import shared_task
from django.core.mail import EmailMessage
from pricingModel.models import UserPricing
from pricingModel.api.utils import generate_enterprise_quotation_pdf  # reuse your pdf function

@shared_task(bind=True)
def send_quotation_email_task(self, quotation_id, username, to_email):
    quotation = UserPricing.objects.filter(id=quotation_id).first()
    if not quotation:
        return {"status": "failed", "error": "Quotation not found"}

    pdf = generate_enterprise_quotation_pdf(quotation, username)

    subject = f"Quotation #{quotation.id} - Sentinel Pricing"
    body = f"""
Hi {username},

Please find attached enterprise quotation #{quotation.id}.

Total Cost: ₹{quotation.total_costing}

Regards,
Sentinel Pricing Team
"""

    email = EmailMessage(subject=subject, body=body, to=[to_email])
    email.attach(f"quotation_{quotation.id}.pdf", pdf, "application/pdf")

    email.send()

    return {"status": "success", "quotation_id": quotation.id, "sent_to": to_email}
