from django.urls import path
from .views import (
    StateListAPIView,
    ActByStateAPIView,
    SectionByActAPIView,
    AuditChecklistCreateAPIView,
    AuditChecklistListAPIView,
    AuditChecklistUpdateAPIView,
    AuditChecklistToggleStatusAPIView,
    AuditChecklistDeleteAPIView,
    ActCreateAPIView,
    AuditChecklistGuidelineUpdateAPIView,
)

app_name = "checklist"

urlpatterns = [

    # =========================
    # MASTER DATA
    # =========================
    path(
        "states/",
        StateListAPIView.as_view(),
        name="state-list"
    ),

    path(
        "acts/",
        ActByStateAPIView.as_view(),
        name="act-list-by-state"
    ),

    path(
        "acts/create/",
        ActCreateAPIView.as_view(),
        name="act-create"
    ),

    path(
        "sections/",
        SectionByActAPIView.as_view(),
        name="section-list-by-act"
    ),

    # =========================
    # CHECKLIST
    # =========================
    path(
        "create/",
        AuditChecklistCreateAPIView.as_view(),
        name="checklist-create"
    ),

    path(
        "list/",
        AuditChecklistListAPIView.as_view(),
        name="checklist-list"
    ),

    # =========================
    # GUIDELINE UPDATE
    # =========================
    path(
        "<int:pk>/update-guidelines/",
        AuditChecklistGuidelineUpdateAPIView.as_view(),
        name="checklist-update-guidelines"
    ),

    # =========================
    # ITEM OPERATIONS
    # =========================
    path(
        "<int:pk>/update/",
        AuditChecklistUpdateAPIView.as_view(),
        name="checklist-update"
    ),

    path(
        "<int:pk>/delete/",
        AuditChecklistDeleteAPIView.as_view(),
        name="checklist-delete"
    ),

    path(
        "<int:pk>/toggle-status/",
        AuditChecklistToggleStatusAPIView.as_view(),
        name="checklist-toggle-status"
    ),
]