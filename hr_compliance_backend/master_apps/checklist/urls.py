from django.urls import path
from .views import (
    StateListAPIView,
    ActByStateAPIView,
    ComplianceNatureListAPIView,
    SectionByActAPIView,
    RuleBySectionAPIView,
    AuditChecklistCreateAPIView,
    AuditChecklistListAPIView,
    AuditChecklistUpdateAPIView,
    AuditChecklistToggleStatusAPIView,
)

urlpatterns = [
    path("states/", StateListAPIView.as_view()),
    path("acts/", ActByStateAPIView.as_view()),
    path("compliance-natures/", ComplianceNatureListAPIView.as_view()),
    path("sections/", SectionByActAPIView.as_view()),
    path("rules/", RuleBySectionAPIView.as_view()),
    path("create/", AuditChecklistCreateAPIView.as_view()),
    path("list/", AuditChecklistListAPIView.as_view()),

    # 🔥 NEW (DO NOT REMOVE)
    path("<int:pk>/update/", AuditChecklistUpdateAPIView.as_view()),
    path("<int:pk>/toggle-status/", AuditChecklistToggleStatusAPIView.as_view()),
]
