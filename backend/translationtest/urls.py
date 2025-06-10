from django.urls import path
from .views import LaundryServiceListCreateView

urlpatterns = [
    path('services/', LaundryServiceListCreateView.as_view(), name='laundry-list-create'),
]
