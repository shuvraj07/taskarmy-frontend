# Add this to your Django/FastAPI backend

# For Django (views.py)
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests

@csrf_exempt
def google_token_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        google_token = data.get('token')
        role = data.get('role')

        if not google_token:
            return JsonResponse({'error': 'No token provided'}, status=400)

        # Verify the Google token
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {google_token}'}
        )

        if google_response.status_code != 200:
            return JsonResponse({'error': 'Invalid Google token'}, status=401)

        user_info = google_response.json()

        # Here you would create or get the user from your database
        # For now, just return a mock access token

        return JsonResponse({
            'access_token': 'your-local-jwt-token-here',
            'email': user_info.get('email'),
            'fullName': user_info.get('name'),
            'role': role
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# For FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
import requests

class GoogleTokenRequest(BaseModel):
    token: str
    role: str

@app.post("/auth/google/token")
async def google_token(request: GoogleTokenRequest):
    try:
        # Verify the Google token
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {request.token}'}
        )

        if google_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        user_info = google_response.json()

        # Create your local access token here
        # For development, you can return a simple token

        return {
            'access_token': 'dev-token-123',
            'email': user_info.get('email'),
            'fullName': user_info.get('name'),
            'role': request.role
        }

    except requests.RequestException:
        raise HTTPException(status_code=401, detail="Invalid Google token")