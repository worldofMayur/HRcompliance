import copy
import calendar
from datetime import date, datetime
from django.utils.timezone import now


# =========================
# 🔧 HELPER: SAFE DATE PARSER
# =========================

def parse_date_safe(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except Exception:
            return None
    return None


# =========================
# ✅ APPLY FUTURE UPDATES TO DB
# =========================

def apply_pending_updates(mapping):
    """Apply pending FUTURE_UPDATE records that are due."""
    today = now().date()

    pending_records = mapping.history.filter(
        change_type="FUTURE_UPDATE"
    ).order_by("effective_date")

    for record in pending_records:
        new_data = record.new_data or {}
        effective_date = record.effective_date

        if effective_date and effective_date > today:
            continue

        for field, value in new_data.items():
            if field == "documents":
                mapping.documents.set(value)
            elif field in ["effective_date", "start_date", "end_date"]:
                parsed_value = parse_date_safe(value)
                if parsed_value:
                    setattr(mapping, field, parsed_value)
            elif field == "auditor_id":
                mapping.auditor_id = value
            elif hasattr(mapping, field):
                setattr(mapping, field, value)

        mapping.save()

        # Mark as applied
        record.change_type = "APPLIED"
        record.save()


# =========================
# ✅ PERIOD-BASED VIRTUAL MAPPING (IMPROVED)
# =========================

def apply_mapping_for_period(mapping, target_date=None):
    """
    Returns a virtual copy with correct historical state as of target_date.
    """
    if target_date is None:
        target_date = now().date()

    mapping_copy = copy.copy(mapping)

    # =========================
# START FROM OLDEST HISTORY
# =========================

    first_history = mapping.history.filter(
        effective_date__isnull=False
    ).order_by("effective_date").first()

    if first_history and first_history.old_data:

        old_data = first_history.old_data or {}

        final_data = {
            "documents": old_data.get(
                "documents",
                list(mapping.documents.values_list("id", flat=True))
            ),

            "rule": old_data.get(
                "rule",
                getattr(mapping, "rule", None)
            ),

            "frequency": old_data.get(
                "frequency",
                getattr(mapping, "frequency", None)
            ),

            "start_date": old_data.get(
                "start_date",
                getattr(mapping, "start_date", None)
            ),

            "end_date": old_data.get(
                "end_date",
                getattr(mapping, "end_date", None)
            ),

            "effective_date": old_data.get(
                "effective_date",
                getattr(mapping, "effective_date", None)
            ),

            "auditor_id": old_data.get(
                "auditor_id",
                mapping.auditor.id
                if getattr(mapping, "auditor", None)
                else None
            ),

            "status": old_data.get(
                "status",
                getattr(mapping, "status", "Active")
            ),
        }

    else:

        final_data = {
            "documents": list(
                mapping.documents.values_list("id", flat=True)
            ),

            "rule": getattr(mapping, "rule", None),

            "frequency": getattr(mapping, "frequency", None),

            "start_date": getattr(mapping, "start_date", None),

            "end_date": getattr(mapping, "end_date", None),

            "effective_date": getattr(mapping, "effective_date", None),

            "auditor_id": (
                mapping.auditor.id
                if getattr(mapping, "auditor", None)
                else None
            ),

            "status": getattr(mapping, "status", "Active"),
        }

    # Apply history records in order
    history_records = mapping.history.filter(
        effective_date__isnull=False
    ).order_by("effective_date")

    for record in history_records:

        eff_date = record.effective_date

        new_data = record.new_data or {}
        old_data = record.old_data or {}

        print("\n---------- HISTORY DEBUG ----------")
        print("TARGET DATE:", target_date)
        print("EFFECTIVE DATE:", eff_date)
        print("OLD DOCS:", old_data.get("documents"))
        print("NEW DOCS:", new_data.get("documents"))
        print("-----------------------------------\n")

        if target_date >= eff_date:
            # Use new state
            for key in final_data.keys():

                if key in new_data:
                    final_data[key] = new_data[key]

            # ✅ HANDLE AUDITOR HISTORY
            if "auditor" in new_data:
                final_data["auditor_id"] = new_data["auditor"]

            if "auditor_id" in new_data:
                final_data["auditor_id"] = new_data["auditor_id"]

        else:
            # Use old state (CRITICAL for previous periods)
            for key in final_data.keys():

                if key in old_data:
                    final_data[key] = old_data[key]

            # ✅ HANDLE OLD AUDITOR HISTORY
            if "auditor" in old_data:
                final_data["auditor_id"] = old_data["auditor"]

            if "auditor_id" in old_data:
                final_data["auditor_id"] = old_data["auditor_id"]

    # Safe date conversion
    safe_start_date = parse_date_safe(final_data["start_date"])
    safe_end_date = parse_date_safe(final_data["end_date"])
    safe_effective_date = parse_date_safe(final_data["effective_date"])

    # =========================
    # ATTACH VIRTUAL ATTRIBUTES
    # =========================
    mapping_copy._virtual_documents = final_data["documents"]
    mapping_copy._virtual_rule = final_data["rule"]
    mapping_copy._virtual_frequency = final_data["frequency"]
    mapping_copy._virtual_start_date = safe_start_date
    mapping_copy._virtual_end_date = safe_end_date
    mapping_copy._virtual_effective_date = safe_effective_date
    mapping_copy._virtual_auditor_id = final_data["auditor_id"]
    mapping_copy._virtual_status = final_data["status"]

    # For backward compatibility with views
    mapping_copy._documents_cache = final_data["documents"]

    # Update normal attributes on copy
    mapping_copy.rule = final_data["rule"]
    mapping_copy.frequency = final_data["frequency"]
    mapping_copy.start_date = safe_start_date
    mapping_copy.end_date = safe_end_date
    mapping_copy.effective_date = safe_effective_date

    return mapping_copy


# =========================
# ✅ AUDIT PERIOD → DATE
# =========================

def audit_period_to_date(audit_period):
    """
    Converts:
    Jan 2026 -> 2026-01-31
    Jan–Jun 2026 -> 2026-06-30
    """

    try:

        # =========================
        # RANGE FORMAT
        # =========================

        if "–" in audit_period or "-" in audit_period:

            parts = audit_period.replace("–", "-").split("-")

            end_part = parts[-1].strip()

            month_name, year = end_part.split()

            month_number = datetime.strptime(
                month_name,
                "%b"
            ).month

            last_day = calendar.monthrange(
                int(year),
                month_number
            )[1]

            return date(
                int(year),
                month_number,
                last_day
            )

        # =========================
        # MONTHLY FORMAT
        # =========================

        dt = datetime.strptime(
            audit_period.strip(),
            "%b %Y"
        )

        last_day = calendar.monthrange(
            dt.year,
            dt.month
        )[1]

        return date(
            dt.year,
            dt.month,
            last_day
        )

    except Exception:
        return now().date()