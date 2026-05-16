class WorkflowStatus:

    DRAFT = "DRAFT"

    SAVED = "SAVED"

    SUBMITTED = "SUBMITTED"

    UNDER_REVIEW = "UNDER_REVIEW"

    REUPLOAD_REQUESTED = "REUPLOAD_REQUESTED"

    REUPLOADED = "REUPLOADED"

    COMPLIED = "COMPLIED"

    NON_COMPLIED = "NON_COMPLIED"

    EXCEPTIONAL_APPROVAL = "EXCEPTIONAL_APPROVAL"

    FROZEN = "FROZEN"


WORKFLOW_STATUS_CHOICES = [

    (WorkflowStatus.DRAFT, "Draft"),

    (WorkflowStatus.SAVED, "Saved"),

    (WorkflowStatus.SUBMITTED, "Submitted"),

    (WorkflowStatus.UNDER_REVIEW, "Under Review"),

    (WorkflowStatus.REUPLOAD_REQUESTED, "Reupload Requested"),

    (WorkflowStatus.REUPLOADED, "Reuploaded"),

    (WorkflowStatus.COMPLIED, "Complied"),

    (WorkflowStatus.NON_COMPLIED, "Non Complied"),

    (WorkflowStatus.EXCEPTIONAL_APPROVAL, "Exceptional Approval"),

    (WorkflowStatus.FROZEN, "Frozen"),
]