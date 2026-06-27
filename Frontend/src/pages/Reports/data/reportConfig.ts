export type ReportType =
  | "branch"
  | "compliance"
  | "exception";

export interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  icon: string;
}

export interface ReportColumn {
  title: string;
  key: string;
}

export const REPORT_CARDS: ReportCard[] = [
  {
    id: "branch",
    title: "Branch Wise Vendor Mapping",
    description:
      "View branch-wise vendor mapping details.",
    icon: "🏢",
  },
  {
    id: "compliance",
    title: "Vendor Compliance Status",
    description:
      "View vendor compliance clearance reports.",
    icon: "📋",
  },
  {
    id: "exception",
    title: "Exceptional Approval Report",
    description:
      "View exceptional approval reports.",
    icon: "⚠️",
  },
];

export const REPORT_COLUMNS = {
  branch: [
    { title: "State", key: "state" },
    { title: "Branch", key: "branch" },
    { title: "Vendor", key: "vendor" },
    { title: "Nature of Service", key: "service" },
    { title: "Agreement From", key: "agreement_from" },
    { title: "Agreement To", key: "agreement_to" },
    { title: "Contact Person", key: "contact_person" },
    { title: "Mobile", key: "mobile" },
    { title: "Email", key: "email" },
  ],

  compliance: [
    { title: "State", key: "state" },
    { title: "Branch", key: "branch" },
    { title: "Vendor", key: "vendor" },
    { title: "Audit Month", key: "audit_month" },
    { title: "Status", key: "status" },
    { title: "Clearance Date", key: "clearance_date" },
  ],

  exception: [
    { title: "State", key: "state" },
    { title: "Branch", key: "branch" },
    { title: "Vendor", key: "vendor" },
    { title: "Document", key: "document" },
    { title: "Observation", key: "observation" },
    { title: "Recommendation", key: "recommendation" },
    { title: "Approval Status", key: "approval_status" },
  ],
};