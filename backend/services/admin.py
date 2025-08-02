""""Admin configuration for the services application, registering Service, 
IndividualCloth, and BulkCloth models."""
from django.contrib import admin
from .models import Service, IndividualCloth, BulkCloth
# Register your models here.

admin.site.register(Service)
admin.site.register(IndividualCloth)
admin.site.register(BulkCloth)
