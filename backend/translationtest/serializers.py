from rest_framework import serializers
from .models import LaundryService

class LaundryServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaundryService
        fields = '__all__'
    description_hi = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description_ne = serializers.CharField(required=False, allow_blank=True, allow_null=True)