import copy
from datetime import date
from django.utils.timezone import now
# utils.py

# =========================
# 🔧 HELPER: SAFE DATE PARSER
# =========================
def parse_date_safe(value):
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except Exception:
            return None
    return value


# =========================
# ✅ APPLY FUTURE UPDATES TO DB (REAL APPLY)
# =========================
def apply_pending_updates(mapping):
    today = now().date()

    pending_records = mapping.history.filter(
        change_type="FUTURE_UPDATE"
    ).order_by("effective_date")

    for record in pending_records:
        new_data = record.new_data or {}

        effective_date = record.effective_date

        # ⛔ Skip future updates
        if effective_date and effective_date > today:
            continue

        for field, value in new_data.items():

            # ✅ DOCUMENTS
            if field == "documents":
                mapping.documents.set(value)

            # ✅ DATE FIELDS (CRITICAL FIX)
            elif field in ["effective_date", "start_date", "end_date"]:
                value = parse_date_safe(value)
                if value:
                    setattr(mapping, field, value)

            # ✅ OTHER FIELDS
            elif hasattr(mapping, field):
                setattr(mapping, field, value)

        # ✅ SAVE AFTER APPLY
        mapping.save()

        # ✅ MARK APPLIED
        record.change_type = "APPLIED"
        record.save()


# =========================
# ✅ PERIOD-BASED VIRTUAL MAPPING (NO DB WRITE)
# =========================

def apply_mapping_for_period(mapping, target_date=None):
    """
    Return a virtual copy of the mapping showing the correct documents 
    as they should be on the given target_date (based on effective_date history).
    """
    if target_date is None:
        target_date = now().date()

    # Get history sorted by effective_date (oldest first)
    history_records = mapping.history.filter(
        effective_date__isnull=False
    ).order_by("effective_date")

    mapping_copy = copy.copy(mapping)

    # Start with the documents currently saved in the DB (latest state)
    final_doc_ids = list(mapping.documents.values_list("id", flat=True))

    for record in history_records:
        eff_date = record.effective_date

        if target_date < eff_date:
            # Use the state BEFORE this future change
            final_doc_ids = record.old_data.get("documents", final_doc_ids)
            break  # Stop — we found the correct historical state

        else:
            # Use the state AFTER this change
            final_doc_ids = record.new_data.get("documents", final_doc_ids)

    # Attach to copy so the view can read it
    mapping_copy._documents_cache = final_doc_ids
    return mapping_copy