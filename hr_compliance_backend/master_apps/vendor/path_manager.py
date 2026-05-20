import os
from datetime import datetime
from django.utils.text import slugify


def safe_slug(value, fallback="unknown"):
    if not value:
        return fallback
    return slugify(str(value).strip())


def normalize_audit_period(period):
    """Convert to format: may-2026"""
    if not period:
        return datetime.now().strftime("%B-%Y").lower()

    period_str = str(period).strip()

    # Try to normalize common formats
    try:
        for fmt in ("%B %Y", "%B-%Y", "%m/%Y", "%Y-%m"):
            try:
                dt = datetime.strptime(period_str, fmt)
                return dt.strftime("%B-%Y").lower()
            except:
                continue
    except:
        pass

    # Fallback
    cleaned = period_str.lower().replace(" ", "-").replace("/", "-")
    return cleaned[:30]


def generate_unique_filename(filename):

    """
    Keep original filename.
    Delete existing file if same name exists.
    """

    import os
    from django.conf import settings

    base, ext = os.path.splitext(filename)

    safe_base = (
        str(base)
        .strip()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("\\", "_")
    )

    final_name = f"{safe_base}{ext.lower()}"

    return final_name


def build_submission_base_path(vendor, pe, branch, audit_period):
    """Main function - Creates desired folder structure"""
    vendor_slug = safe_slug(getattr(vendor, "short_name", None))
    pe_slug = safe_slug(getattr(pe, "short_name", None))
    branch_slug = safe_slug(
        getattr(branch, "short_name", getattr(branch, "name", None))
    )
    period_slug = normalize_audit_period(audit_period)

    return os.path.join(
        "vendor",
        vendor_slug,
        pe_slug,
        branch_slug,
        period_slug,
    )


def build_submission_subfolder(submission, folder_name):
    base = build_submission_base_path(
        vendor=submission.vendor,
        pe=submission.principal_employer,
        branch=submission.branch,
        audit_period=submission.audit_period,
    )
    return os.path.join(base, folder_name)