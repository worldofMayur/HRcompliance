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
)

app_name = "checklist"

urlpatterns = [
    # =========================
    # MASTER DATA
    # =========================
    path("states/", StateListAPIView.as_view(), name="state-list"),
    path("acts/", ActByStateAPIView.as_view(), name="act-by-state"),
    path("acts/create/", ActCreateAPIView.as_view(), name="act-create"),
    path("sections/", SectionByActAPIView.as_view(), name="section-by-act"),

    # =========================
    # CHECKLIST
    # =========================
    path("create/", AuditChecklistCreateAPIView.as_view(), name="checklist-create"),
    path("list/", AuditChecklistListAPIView.as_view(), name="checklist-list"),
    

    # =========================
    # ACTIONS
    # =========================
    path("<int:pk>/update/", AuditChecklistUpdateAPIView.as_view(), name="checklist-update"),
    path("<int:pk>/delete/", AuditChecklistDeleteAPIView.as_view(), name="checklist-delete"),
    path("<int:pk>/toggle-status/", AuditChecklistToggleStatusAPIView.as_view(), name="checklist-toggle"),
]