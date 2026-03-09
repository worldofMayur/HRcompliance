# documents/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q

from .models import DocumentMaster
from .serializers import DocumentMasterSerializer
from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.principle_employee.serializers import PrincipalEmployerSerializer
from rest_framework.permissions import IsAuthenticated


from django.db.models import Q


from rest_framework.permissions import IsAuthenticated

class DocumentMasterListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # fetch PE linked to user
        pe = PrincipalEmployer.objects.filter(user=request.user).first()

        docs = DocumentMaster.objects.filter(
            Q(principal_employer__isnull=True) |
            Q(principal_employer=pe),
            is_active=True
        ).order_by("name")

        serializer = DocumentMasterSerializer(docs, many=True)
        return Response(serializer.data)


# =========================
# CREATE DOCUMENT
# =========================
class DocumentMasterCreateAPIView(APIView):
    def post(self, request):
        serializer = DocumentMasterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Document created successfully"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================
# UPDATE DOCUMENT
# =========================
class DocumentMasterUpdateAPIView(APIView):
    def put(self, request, pk):
        doc = get_object_or_404(DocumentMaster, pk=pk)
        serializer = DocumentMasterSerializer(doc, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Document updated successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================
# DELETE DOCUMENT
# =========================
class DocumentMasterDeleteAPIView(APIView):
    def delete(self, request, pk):
        doc = get_object_or_404(DocumentMaster, pk=pk)
        doc.delete()
        return Response({"message": "Document deleted successfully"})


# =========================
# BULK DELETE (⌘ + DELETE)
# =========================
class DocumentMasterBulkDeleteAPIView(APIView):
    def post(self, request):
        """
        payload:
        {
          "ids": [1,2,3]
        }
        """
        ids = request.data.get("ids", [])

        if not ids:
            return Response(
                {"error": "No document IDs provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = DocumentMaster.objects.filter(id__in=ids).delete()
        return Response(
            {"message": f"{deleted} documents deleted successfully"}
        )


# =========================
# BULK UPDATE (⌘ + E)
# =========================
class DocumentMasterBulkUpdateAPIView(APIView):
    def post(self, request):
        """
        payload:
        {
          "ids": [1,2,3],
          "frequency": "monthly",
          "is_active": true
        }
        """
        ids = request.data.get("ids", [])
        frequency = request.data.get("frequency")
        is_active = request.data.get("is_active")

        if not ids:
            return Response(
                {"error": "No document IDs provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_data = {}
        if frequency:
            update_data["frequency"] = frequency
        if is_active is not None:
            update_data["is_active"] = is_active

        if not update_data:
            return Response(
                {"error": "No update fields provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            updated = DocumentMaster.objects.filter(id__in=ids).update(
                **update_data
            )

        return Response(
            {"message": f"{updated} documents updated successfully"}
        )


# =========================
# PE DROPDOWN
# =========================
class PEDropdownAPIView(APIView):

    def get(self, request):
        pes = PrincipalEmployer.objects.all().order_by("name")
        serializer = PrincipalEmployerSerializer(pes, many=True)
        return Response(serializer.data)