from rest_framework.permissions import BasePermission


class BaseRolePermission(BasePermission):
    """
    Base class for role-based permissions
    """

    allowed_roles = []

    def has_permission(self, request, view):
        user = request.user

        return (
            user
            and user.is_authenticated
            and getattr(user, "role", None) in self.allowed_roles
        )

    def has_object_permission(self, request, view, obj):
        """
        Optional: object-level permission (future use)
        """
        return self.has_permission(request, view)


class IsSuperAdmin(BaseRolePermission):
    allowed_roles = ["SUPERADMIN"]


class IsPE(BaseRolePermission):
    allowed_roles = ["PE"]


class IsVendor(BaseRolePermission):
    allowed_roles = ["VENDOR"]


class IsAuditor(BaseRolePermission):
    allowed_roles = ["AUDITOR"]