# payments/utils.py
import hmac
import hashlib
import base64
from django.conf import settings

class EsewaPaymentUtils:
    """Utility class for handling eSewa payment signatures and verification."""
    
    @staticmethod
    def generate_signature(total_amount, transaction_uuid, product_code, secret_key=None):
        """
        Generate HMAC SHA256 signature for eSewa payment
        """
        if secret_key is None:
            secret_key = settings.ESEWA_SECRET_KEY
        
        # Create the message string in the exact order required
        message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
        
        # Generate HMAC SHA256
        signature = hmac.new(
            secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        # Convert to base64
        return base64.b64encode(signature).decode('utf-8')
    
    @staticmethod
    def verify_signature(data, signature, secret_key=None):
        """
        Verify the signature received from eSewa
        """
        if secret_key is None:
            secret_key = settings.ESEWA_SECRET_KEY
        
        # Extract signed field names and create message
        signed_fields = data.get('signed_field_names', '').split(',')
        message_parts = []
        
        for field in signed_fields:
            if field in data:
                message_parts.append(f"{field}={data[field]}")
        
        message = ','.join(message_parts)
        
        # Generate expected signature
        expected_signature = hmac.new(
            secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        expected_signature_b64 = base64.b64encode(expected_signature).decode('utf-8')
        
        return signature == expected_signature_b64