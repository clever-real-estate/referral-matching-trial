from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response


@api_view(["GET"])
def me(request):
    user = request.user
    agent = getattr(user, "agent_profile", None)
    return Response(
        {
            "username": user.get_username(),
            "is_ops": user.is_staff,
            "agent": None
            if agent is None
            else {
                "id": agent.id,
                "name": agent.name,
                "licensed_states": agent.licensed_states,
                "capacity": agent.capacity,
                "active_referral_count": agent.active_referral_count,
            },
        }
    )


@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def identities(request):
    """Development convenience: list seeded identities and their tokens.

    Only available with DEBUG on so the local frontend can offer a sign-in picker.
    """
    if not settings.DEBUG:
        return Response(status=status.HTTP_404_NOT_FOUND)
    results = []
    for user in User.objects.filter(auth_token__isnull=False).order_by("username"):
        agent = getattr(user, "agent_profile", None)
        results.append(
            {
                "username": user.username,
                "token": user.auth_token.key,
                "role": "ops" if user.is_staff else "agent",
                "display_name": agent.name if agent else user.get_full_name() or user.username,
            }
        )
    return Response(results)
