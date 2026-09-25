from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that extracts the token from HttpOnly cookies.
    Falls back to the standard Authorization header if no cookie is present.
    """

    def authenticate(self, request):
        cookie_name = getattr(settings, 'JWT_ACCESS_COOKIE_NAME', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)

        if raw_token is None:
            # Fall back to Authorization: Bearer <token>
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except InvalidToken as exc:
            raise AuthenticationFailed(exc.args[0])
