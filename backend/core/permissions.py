from rest_framework.permissions import BasePermission


def _role(user):
    return getattr(getattr(user, "profile", None), "role", None)


class IsCommsOfficial(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and _role(request.user) in ("comms_official", "admin"))