import copy
import calendar

from datetime import date, datetime

from django.utils.timezone import now


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
# ✅ APPLY FUTURE UPDATES TO DB
# =========================

def apply_pending_updates(mapping):

    today = now().date()

    pending_records = mapping.history.filter(
        change_type="FUTURE_UPDATE"
    ).order_by("effective_date")

    for record in pending_records:

        new_data = record.new_data or {}

        effective_date = record.effective_date

        # Skip future updates
        if effective_date and effective_date > today:
            continue

        for field, value in new_data.items():

            # =========================
            # DOCUMENTS
            # =========================

            if field == "documents":

                mapping.documents.set(value)

            # =========================
            # DATE FIELDS
            # =========================

            elif field in [
                "effective_date",
                "start_date",
                "end_date"
            ]:

                value = parse_date_safe(value)

                if value:
                    setattr(mapping, field, value)

            # =========================
            # AUDITOR FIELD
            # =========================

            elif field == "auditor_id":

                mapping.auditor_id = value

            # =========================
            # OTHER FIELDS
            # =========================

            elif hasattr(mapping, field):

                setattr(mapping, field, value)

        # Save updated mapping
        mapping.save()

        # Mark history applied
        record.change_type = "APPLIED"

        record.save()


# =========================
# ✅ PERIOD-BASED VIRTUAL MAPPING
# =========================

def apply_mapping_for_period(
    mapping,
    target_date=None
):
    """
    Returns virtual mapping state
    based on selected target_date.

    Does NOT modify DB.
    """

    if target_date is None:
        target_date = now().date()

    mapping_copy = copy.copy(mapping)

    # =========================
    # DEFAULT CURRENT VALUES
    # =========================

    final_doc_ids = list(
        mapping.documents.values_list(
            "id",
            flat=True
        )
    )

    final_rule = mapping.rule

    final_frequency = mapping.frequency

    final_start_date = mapping.start_date

    final_end_date = mapping.end_date

    final_effective_date = (
        mapping.effective_date
    )

    final_auditor_id = (
        mapping.auditor.id
        if mapping.auditor else None
    )

    final_status = mapping.status

    # =========================
    # HISTORY RECORDS
    # =========================

    history_records = mapping.history.filter(
        effective_date__isnull=False
    ).order_by("effective_date")

    # =========================
    # APPLY HISTORY
    # =========================

    for record in history_records:

        eff_date = record.effective_date

        old_data = record.old_data or {}

        new_data = record.new_data or {}

        # =====================================
        # BEFORE EFFECTIVE DATE
        # =====================================

        if target_date < eff_date:

            final_doc_ids = old_data.get(
                "documents",
                final_doc_ids
            )

            final_rule = old_data.get(
                "rule",
                final_rule
            )

            final_frequency = old_data.get(
                "frequency",
                final_frequency
            )

            final_start_date = parse_date_safe(
                old_data.get(
                    "start_date",
                    final_start_date
                )
            )

            final_end_date = parse_date_safe(
                old_data.get(
                    "end_date",
                    final_end_date
                )
            )

            final_effective_date = parse_date_safe(
                old_data.get(
                    "effective_date",
                    final_effective_date
                )
            )

            final_auditor_id = old_data.get(
                "auditor_id",
                final_auditor_id
            )

            final_status = old_data.get(
                "status",
                final_status
            )

            break

        # =====================================
        # AFTER EFFECTIVE DATE
        # =====================================

        else:

            final_doc_ids = new_data.get(
                "documents",
                final_doc_ids
            )

            final_rule = new_data.get(
                "rule",
                final_rule
            )

            final_frequency = new_data.get(
                "frequency",
                final_frequency
            )

            final_start_date = parse_date_safe(
                new_data.get(
                    "start_date",
                    final_start_date
                )
            )

            final_end_date = parse_date_safe(
                new_data.get(
                    "end_date",
                    final_end_date
                )
            )

            final_effective_date = parse_date_safe(
                new_data.get(
                    "effective_date",
                    final_effective_date
                )
            )

            final_auditor_id = new_data.get(
                "auditor_id",
                final_auditor_id
            )

            final_status = new_data.get(
                "status",
                final_status
            )

    # =========================
    # VIRTUAL STATUS
    # =========================

    today = target_date

    if (
        final_end_date and
        final_end_date < today
    ):
        final_status = "Inactive"

    else:
        final_status = "Active"

    # =========================
    # ATTACH VIRTUAL VALUES
    # =========================

    mapping_copy._documents_cache = final_doc_ids

    mapping_copy._virtual_rule = final_rule

    mapping_copy._virtual_frequency = (
        final_frequency
    )

    mapping_copy._virtual_start_date = (
        final_start_date
    )

    mapping_copy._virtual_end_date = (
        final_end_date
    )

    mapping_copy._virtual_effective_date = (
        final_effective_date
    )

    mapping_copy._virtual_auditor_id = (
        final_auditor_id
    )

    mapping_copy._virtual_status = (
        final_status
    )

    return mapping_copy


# =========================
# ✅ AUDIT PERIOD → DATE
# =========================

def audit_period_to_date(audit_period):
    """
    Converts:

    Jan-2026 -> 2026-01-31
    Jan–Jun 2026 -> 2026-06-30
    Jul–Dec 2026 -> 2026-12-31
    """

    try:

        # =========================
        # HALF YEARLY
        # =========================

        if "–" in audit_period:

            parts = audit_period.split("–")

            end_part = parts[1].strip()

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
        # MONTHLY
        # =========================

        dt = datetime.strptime(
            audit_period,
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