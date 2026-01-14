from rest_framework.decorators import api_view
from rest_framework.response import Response
from User.api.serializers import registration_serializer
from User import models
from rest_framework.authtoken.models import Token
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST',])
def user_logout(request):
    
    if request.method == 'POST':
        
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)
    
    
@api_view(['POST',])
def user_registration(request):
    
    if request.method == 'POST':
        serializer = registration_serializer(data=request.data)
        
        data = {}
        if serializer.is_valid():
            account = serializer.save()
            
            data['response'] = 'Registration Successfull'
            data['Username'] = account.username
            data['email'] = account.email

            
            # token = Token.objects.get(user = account).key
            # data['token'] = token
            refresh = RefreshToken.for_user(account)
            data['token'] = {
                                'refresh': str(refresh),
                                'access': str(refresh.access_token),
                            }
        
        else:
            data = serializer.errors
        
        
        return Response(data, status=status.HTTP_201_CREATED)       
            