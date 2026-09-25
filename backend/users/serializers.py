from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'first_name',
            'last_name',
            'bio',
            'organization',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )
    role = serializers.ChoiceField(
        choices=[
            (User.Role.PARTICIPANT, 'Participant'),
            (User.Role.ORGANIZER, 'Organizer'),
        ],
        default=User.Role.PARTICIPANT,
        help_text="Registration only permits 'participant' or 'organizer'. Judges are appointed by admins.",
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'confirm_password',
            'role',
            'first_name',
            'last_name',
        ]
        read_only_fields = ['id']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value.lower()

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.pop('confirm_password', None)

        if password != confirm_password:
            raise serializers.ValidationError({'confirm_password': "Passwords do not match."})

        # Validate password complexity with Django's configured validators
        validate_password(password)

        role = attrs.get('role', User.Role.PARTICIPANT)
        allowed_self_roles = [User.Role.PARTICIPANT, User.Role.ORGANIZER]
        if role not in allowed_self_roles:
            raise serializers.ValidationError({
                'role': "Self-registration is only allowed for 'participant' and 'organizer'. Judges must be appointed by an admin."
            })

        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', User.Role.PARTICIPANT),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get('username')
        password = attrs.get('password')

        user = None
        # Check if login input is an email
        if '@' in username_or_email:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            user = authenticate(username=username_or_email, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials. Please verify your username/email and password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        attrs['user'] = user
        return attrs


class RoleUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.Role.choices)
