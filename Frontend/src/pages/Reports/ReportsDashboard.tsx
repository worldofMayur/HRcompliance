
import React, { ReactNode, useState } from "react";
import {
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Download,
  Search,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

type ReportType = "" | "branch" | "compliance" | "exception";

interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  icon: ReactNode;
}

interface ReportRow {
  [key: string]: string;
}

const reportCards: ReportCard[] = [
  {
    id: "branch",
    title: "Branch Wise Vendor Mapping",
    description: "Branch wise mapped vendors",
    icon: <FileText size={24} />,
  },
  {
    id: "compliance",
    title: "Vendor Compliance Clearance Status",
    description: "Compliance status report",
    icon: <ClipboardCheck size={24} />,
  },
  {
    id: "exception",
    title: "Exceptional Approval Report",
    description: "Exceptional approval details",
    icon: <ShieldCheck size={24} />,
  },
];

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("");
  const [tableData] = useState<ReportRow[]>([]);

  const renderHeaders = () => {
    switch (selectedReport) {
      case "branch":
        return ["State","Branch","Vendor","Service","Agreement From","Agreement To","Contact","Mobile","Email"];
      case "compliance":
        return ["State","Branch","Vendor","Audit Month","Status","Clearance Date"];
      case "exception":
        return ["State","Branch","Vendor","Document","Observation","Recommendation","Approval Status"];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-3xl font-bold">Reports & Dashboard</h1>
        <p className="text-gray-500">Dashboard will be added later.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {reportCards.map(card => (
          <button
            key={card.id}
            onClick={() => setSelectedReport(card.id)}
            className={`rounded-xl border p-5 text-left ${selectedReport===card.id?"border-blue-600":"border-gray-200"}`}>
            <div className="mb-3">{card.icon}</div>
            <h3 className="font-semibold">{card.title}</h3>
            <p className="text-sm text-gray-500">{card.description}</p>
          </button>
        ))}
      </div>

      {selectedReport && (
        <>
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Filters</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {["Principal Employer","State","Branch","Vendor","Audit Periodicity","Audit Month"].map(label=>(
                <div key={label}>
                  <label className="mb-2 block text-sm">{label}</label>
                  <select className="w-full rounded-lg border p-2">
                    <option>Select {label}</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-white flex items-center gap-2"><Search size={16}/>Generate Report</button>
              <button className="rounded-lg border px-4 py-2 flex items-center gap-2"><Download size={16}/>Excel</button>
              <button className="rounded-lg border px-4 py-2 flex items-center gap-2"><Download size={16}/>PDF</button>
            </div>
          </div>

          <div className="rounded-xl border bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {renderHeaders().map(h=>(
                    <TableCell key={h} isHeader className="px-4 py-3">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length===0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-8" colSpan={renderHeaders().length}>
                      No report generated.
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((row,i)=>(
                    <TableRow key={i}>
                      {renderHeaders().map(h=>(
                        <TableCell key={h} className="px-4 py-3">{row[h] ?? "-"}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
