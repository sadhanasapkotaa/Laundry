from rest_framework.response import Response
from rest_framework import status, generics
from .models import LaundryService
from .serializers import LaundryServiceSerializer

class LaundryServiceListCreateView(generics.ListCreateAPIView):
    queryset = LaundryService.objects.all()
    serializer_class = LaundryServiceSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"detail": f"Something went wrong while creating the service: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
