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
from django.db.models.deletion import ProtectedError
from django.db.models.deletion import ProtectedError
from master_apps.checklist.models import AuditChecklist


from django.db.models import Q


from rest_framework.permissions import IsAuthenticated

class DocumentMasterListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # For superadmin / PE
            if request.user.role in ["SUPERADMIN", "PE"]:
                docs = DocumentMaster.objects.filter(is_active=True).order_by("name")
            else:
                # For Vendor / Auditor - show only common or their PE documents
                pe = getattr(request.user, 'principalemployer_profile', None) or \
                     getattr(request.user, 'vendor_profile', None)
                
                docs = DocumentMaster.objects.filter(
                    is_active=True
                ).filter(
                    Q(principal_employer__isnull=True) | 
                    Q(principal_employer=pe)
                ).order_by("name")

            serializer = DocumentMasterSerializer(docs, many=True)
            return Response(serializer.data)

        except Exception as e:
            print("Document List Error:", str(e))
            return Response({"error": str(e)}, status=500)


# =========================
# CREATE DOCUMENT
# =========================
class DocumentMasterCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Document Create Payload:", request.data)

        serializer = DocumentMasterSerializer(data=request.data)
        if serializer.is_valid():
            doc = serializer.save()
            print("Document created:", doc.name)
            return Response({"message": "Document created successfully"}, status=201)
        
        print("Validation Errors:", serializer.errors)
        return Response({
            "error": serializer.errors
        }, status=400)


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
        ids = request.data.get("ids", [])

        if not ids:
            return Response(
                {"error": "No document IDs provided"},
                status=400
            )

        deleted_count = 0

        for doc_id in ids:
            try:
                doc = DocumentMaster.objects.get(id=doc_id)

                # 🔥 DELETE dependent records FIRST
                AuditChecklist.objects.filter(document=doc).delete()

                # Now delete document
                doc.delete()
                deleted_count += 1

            except Exception as e:
                print("Error:", e)

        return Response({
            "message": f"{deleted_count} documents deleted successfully"
        })


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