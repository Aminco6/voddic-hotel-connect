"""
Voddic SaaS Authentication API
Hotel Owner Signup with Email Verification + Google OAuth
Staff/Admin Login with Hotel Detection
"""

from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db import transaction
import uuid
import jwt
from datetime import timedelta

User = get_user_model()

# ============================================
# HOTEL OWNER SIGNUP
# ============================================
class HotelOwnerSignupView(views.APIView):
    """Hotel Owner Registration with Email Verification"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        full_name = request.data.get('full_name', '')
        hotel_name = request.data.get('hotel_name', '')
        phone = request.data.get('phone', '')
        
        # Validation
        if not email or not password:
            return Response({
                'error': 'Email and password are required',
                'code': 'MISSING_FIELDS'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters',
                'code': 'WEAK_PASSWORD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            if user.email_verified:
                return Response({
                    'error': 'An account with this email already exists. Please sign in.',
                    'code': 'EMAIL_EXISTS'
                }, status=status.HTTP_409_CONFLICT)
            else:
                # Resend verification
                user.email_verification_token = str(uuid.uuid4())
                user.email_verification_sent_at = timezone.now()
                user.save()
                send_verification_email(user)
                return Response({
                    'message': 'Account exists but not verified. New verification email sent.',
                    'code': 'VERIFICATION_RESENT'
                }, status=status.HTTP_200_OK)
        
        # Create user
        verification_token = str(uuid.uuid4())
        
        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=full_name.split(' ')[0] if full_name else '',
                last_name=' '.join(full_name.split(' ')[1:]) if full_name else '',
                role='HOTEL_OWNER',
                phone=phone,
                email_verification_token=verification_token,
                email_verification_sent_at=timezone.now(),
                is_active=False  # Inactive until email verified
            )
            
            # Store pending hotel name in metadata
            user.metadata = {
                'pending_hotel_name': hotel_name,
                'signup_step': 'email_verification'
            }
            user.save()
        
        # Send verification email
        send_verification_email(user)
        
        return Response({
            'message': 'Account created! Please check your email to verify your account.',
            'code': 'VERIFICATION_SENT',
            'user_id': str(user.id),
            'email': user.email
        }, status=status.HTTP_201_CREATED)


class GoogleAuthView(views.APIView):
    """Google OAuth Signup/Signin for Hotel Owners"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        google_token = request.data.get('google_token')
        full_name = request.data.get('full_name', '')
        hotel_name = request.data.get('hotel_name', '')
        
        if not google_token:
            return Response({
                'error': 'Google token is required',
                'code': 'MISSING_TOKEN'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify Google token
            google_data = verify_google_token(google_token)
            
            if not google_data:
                return Response({
                    'error': 'Invalid Google token',
                    'code': 'INVALID_TOKEN'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            email = google_data['email'].lower().strip()
            google_id = google_data['sub']
            name = google_data.get('name', full_name)
            picture = google_data.get('picture', '')
            
            # Check if user exists
            user = User.objects.filter(email=email).first()
            
            if user:
                # Existing user - sign in
                if not user.google_id:
                    user.google_id = google_id
                    user.avatar_url = picture or user.avatar_url
                    user.save()
                
                if user.role != 'HOTEL_OWNER':
                    return Response({
                        'error': 'This email is registered as a staff account. Please use staff login.',
                        'code': 'WRONG_ROLE'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'Signed in successfully',
                    'code': 'SIGNIN_SUCCESS',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': user_data(user),
                    'is_new_user': False
                })
            
            # New user - create account (Google verified = email verified)
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    first_name=name.split(' ')[0] if name else '',
                    last_name=' '.join(name.split(' ')[1:]) if name else '',
                    role='HOTEL_OWNER',
                    google_id=google_id,
                    avatar_url=picture,
                    email_verified=True,
                    is_active=True,
                    metadata={
                        'pending_hotel_name': hotel_name,
                        'signup_step': 'create_hotel'
                    }
                )
                
                # Set unusable password for Google-only users
                user.set_unusable_password()
                user.save()
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Account created with Google!',
                'code': 'SIGNUP_SUCCESS',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data(user),
                'is_new_user': True,
                'next_step': 'create_hotel'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Authentication failed: {str(e)}',
                'code': 'AUTH_FAILED'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyEmailView(views.APIView):
    """Verify email with token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response({
                'error': 'Verification token is required',
                'code': 'MISSING_TOKEN'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(
                email_verification_token=token,
                email_verified=False
            )
            
            # Check token expiry (24 hours)
            if user.email_verification_sent_at:
                if timezone.now() - user.email_verification_sent_at > timedelta(hours=24):
                    return Response({
                        'error': 'Verification link has expired. Please sign up again.',
                        'code': 'TOKEN_EXPIRED'
                    }, status=status.HTTP_410_GONE)
            
            user.email_verified = True
            user.is_active = True
            user.email_verification_token = ''
            user.metadata['signup_step'] = 'create_hotel'
            user.save()
            
            # Generate tokens for immediate login
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Email verified successfully!',
                'code': 'VERIFIED',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data(user),
                'next_step': 'create_hotel'
            })
            
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid or already used verification token',
                'code': 'INVALID_TOKEN'
            }, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(views.APIView):
    """Resend verification email"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        
        try:
            user = User.objects.get(email=email, email_verified=False)
            
            # Rate limit: max 3 resends per hour
            if user.email_verification_sent_at:
                recent_sends = user.metadata.get('verification_resend_count', 0)
                if recent_sends >= 3:
                    return Response({
                        'error': 'Too many verification emails sent. Please try again later.',
                        'code': 'RATE_LIMITED'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            user.email_verification_token = str(uuid.uuid4())
            user.email_verification_sent_at = timezone.now()
            user.metadata['verification_resend_count'] = user.metadata.get('verification_resend_count', 0) + 1
            user.save()
            
            send_verification_email(user)
            
            return Response({
                'message': 'Verification email sent!',
                'code': 'VERIFICATION_SENT'
            })
            
        except User.DoesNotExist:
            return Response({
                'error': 'No unverified account found with this email',
                'code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)


# ============================================
# STAFF / ADMIN LOGIN
# ============================================
class StaffLoginView(views.APIView):
    """Staff & Admin Login with Hotel Detection"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required',
                'code': 'MISSING_FIELDS'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Check if user is staff or admin
            if user.role not in ['STAFF', 'HOTEL_OWNER', 'PLATFORM_ADMIN']:
                return Response({
                    'error': 'This account is not authorized for staff access',
                    'code': 'UNAUTHORIZED_ROLE'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if not user.check_password(password):
                return Response({
                    'error': 'Invalid credentials',
                    'code': 'INVALID_CREDENTIALS'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.is_active:
                return Response({
                    'error': 'Account is deactivated. Contact your administrator.',
                    'code': 'ACCOUNT_INACTIVE'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get staff profile and hotel info
            staff_data = None
            hotel_data = None
            
            if user.role == 'STAFF':
                staff_profile = user.staff_profile
                staff_data = {
                    'department': staff_profile.department.name,
                    'department_code': staff_profile.department.code,
                    'employee_id': staff_profile.employee_id,
                    'position': staff_profile.position,
                }
                hotel_data = {
                    'id': str(staff_profile.hotel.id),
                    'name': staff_profile.hotel.name,
                    'branch': staff_profile.branch.name,
                }
            elif user.role == 'HOTEL_OWNER':
                hotel = user.owned_hotels.first()
                if hotel:
                    hotel_data = {
                        'id': str(hotel.id),
                        'name': hotel.name,
                    }
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'code': 'LOGIN_SUCCESS',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data(user),
                'staff': staff_data,
                'hotel': hotel_data,
                'redirect_url': get_redirect_url(user)
            })
            
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid credentials',
                'code': 'INVALID_CREDENTIALS'
            }, status=status.HTTP_401_UNAUTHORIZED)


class ForgotPasswordView(views.APIView):
    """Request password reset"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        
        try:
            user = User.objects.get(email=email)
            user.password_reset_token = str(uuid.uuid4())
            user.password_reset_expires = timezone.now() + timedelta(hours=1)
            user.save()
            
            # Send reset email
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={user.password_reset_token}"
            send_mail(
                'Reset Your Password - Voddic Hotel Connect',
                f'Click here to reset your password: {reset_url}\n\nThis link expires in 1 hour.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'If this email exists, a reset link has been sent.',
                'code': 'RESET_SENT'
            })
            
        except User.DoesNotExist:
            # Don't reveal if email exists
            return Response({
                'message': 'If this email exists, a reset link has been sent.',
                'code': 'RESET_SENT'
            })


class ResetPasswordView(views.APIView):
    """Reset password with token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('password')
        
        if not token or not new_password:
            return Response({
                'error': 'Token and new password are required',
                'code': 'MISSING_FIELDS'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(
                password_reset_token=token,
                password_reset_expires__gt=timezone.now()
            )
            
            user.set_password(new_password)
            user.password_reset_token = ''
            user.password_reset_expires = None
            user.save()
            
            return Response({
                'message': 'Password reset successful! You can now sign in.',
                'code': 'RESET_SUCCESS'
            })
            
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid or expired reset token',
                'code': 'INVALID_TOKEN'
            }, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# HELPER FUNCTIONS
# ============================================
def send_verification_email(user):
    """Send email verification"""
    verify_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={user.email_verification_token}"
    
    send_mail(
        'Verify Your Email - Voddic Hotel Connect',
        f'''Welcome to Voddic Hotel Connect!
        
Click the link below to verify your email and complete your hotel registration:

{verify_url}

This link expires in 24 hours.

If you did not create this account, please ignore this email.

— The Voddic Team''',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
        html_message=f'''
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
            <h1 style="color:#c9a86a;">Voddic Hotel Connect</h1>
            <h2>Verify Your Email</h2>
            <p>Click the button below to verify your email and start managing your hotel:</p>
            <a href="{verify_url}" style="display:inline-block;background:#c9a86a;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Verify Email →</a>
            <p style="color:#666;font-size:12px;margin-top:20px;">Link expires in 24 hours. If you did not create this account, ignore this email.</p>
        </div>'''
    )


def verify_google_token(token):
    """Verify Google OAuth token"""
    import requests
    response = requests.get(
        f'https://oauth2.googleapis.com/tokeninfo?id_token={token}'
    )
    if response.status_code == 200:
        return response.json()
    return None


def user_data(user):
    """Serialize user data"""
    return {
        'id': str(user.id),
        'email': user.email,
        'full_name': user.get_full_name(),
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'phone': user.phone,
        'avatar_url': getattr(user, 'avatar_url', ''),
        'email_verified': user.email_verified,
        'metadata': getattr(user, 'metadata', {}),
    }


def get_redirect_url(user):
    """Determine where to redirect after login"""
    if user.role == 'PLATFORM_ADMIN':
        return '/admin/dashboard/'
    elif user.role == 'HOTEL_OWNER':
        return '/hotel-owner/dashboard/'
    elif user.role == 'STAFF':
        return '/staff/dashboard/'
    return '/'
