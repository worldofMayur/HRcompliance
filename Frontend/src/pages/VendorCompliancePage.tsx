import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Upload, Input, Button, message, Divider, Select } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;
const { Option } = Select;

interface PE {
  id: number;
  short_name: string;
}

interface StateType {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

interface DocumentType {
  id: number;
  name: string;
  audit_period?: string;
}

interface DocumentRow {
  key: string;
  document_id: number | null;
  document_name: string;
  audit_period?: string;
  fileList: UploadFile[];
  remark: string;
}

export default function VendorCompliancePage() {
  const token = localStorage.getItem("access_token");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ================= MASTER DATA ================= */

  const [peList, setPeList] = useState<PE[]>([]);
  const [states, setStates] = useState<StateType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [documents, setDocuments] = useState<DocumentType[]>([]);

  /* ================= SELECTED ================= */

  const [selectedPE, setSelectedPE] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const [frequencyBase, setFrequencyBase] = useState("");

  /* ================= TABLE DATA ================= */

  const [tableData, setTableData] = useState<DocumentRow[]>([]);
  const [generalRemark, setGeneralRemark] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= LOAD INITIAL ================= */

  useEffect(() => {
    loadMappedPE();
  }, []);

  const loadMappedPE = async () => {
    const res = await axios.get(
      "http://127.0.0.1:8000/api/vendor/mapped-pe/",
      authHeader
    );
    setPeList(res.data);
  };

  const loadStates = async (peId: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapped-states/?pe_id=${peId}`,
      authHeader
    );
    setStates(res.data);
  };

  const loadBranches = async (peId: string, stateId: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapped-branches/?pe_id=${peId}&state_id=${stateId}`,
      authHeader
    );
    setBranches(res.data);
  };

  const loadDocuments = async (peId: string, branchId: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapped-documents/?pe_id=${peId}&branch_id=${branchId}`,
      authHeader
    );

    setDocuments(res.data);

    if (res.data.length > 0) {
      const base = res.data[0].audit_period || "";
      setFrequencyBase(base);
    }

    const rows: DocumentRow[] = res.data.map((doc: DocumentType) => ({
      key: `doc-${doc.id}`,
      document_id: doc.id,
      document_name: doc.name,
      audit_period: doc.audit_period,
      fileList: [],
      remark: "",
    }));

    setTableData(rows);
  };

  /* ================= PERIOD OPTIONS ================= */

  const getPeriodOptions = () => {
    const monthly = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    if (monthly.includes(frequencyBase)) return monthly;

    if (frequencyBase.startsWith("Q"))
      return [
        "Q1 (Jan-Mar)",
        "Q2 (Apr-Jun)",
        "Q3 (Jul-Sep)",
        "Q4 (Oct-Dec)"
      ];

    if (frequencyBase.startsWith("H"))
      return [
        "H1 (Apr-Sep)",
        "H2 (Oct-Mar)"
      ];

    if (frequencyBase.includes("Year"))
      return [
        "Financial Year (Apr-Mar)",
        "Calendar Year (Jan-Dec)"
      ];

    return [];
  };

  /* ================= UPDATE ROW ================= */

  const updateRow = (key: string, updated: Partial<DocumentRow>) => {
    setTableData(prev =>
      prev.map(row =>
        row.key === key ? { ...row, ...updated } : row
      )
    );
  };

  /* ================= ADD ADDITIONAL DOC ================= */

  const addAdditionalDocument = () => {
    setTableData(prev => [
      ...prev,
      {
        key: `additional-${Date.now()}`,
        document_id: null,
        document_name: "Additional Document",
        audit_period: selectedPeriod,
        fileList: [],
        remark: "",
      }
    ]);
  };

  /* ================= TABLE COLUMNS ================= */

  const columns: ColumnsType<DocumentRow> = [
    {
      title: "Document Name",
      dataIndex: "document_name",
      width: "25%",
    },
    {
      title: "Compliance Period",
      dataIndex: "audit_period",
      width: "20%",
      render: () => selectedPeriod || "-",
    },
    {
      title: "Upload File",
      width: "25%",
      render: (_, record) => (
        <Upload
          beforeUpload={() => false}
          fileList={record.fileList}
          maxCount={1}
          onChange={({ fileList }) =>
            updateRow(record.key, { fileList })
          }
        >
          <Button>Select File</Button>
        </Upload>
      ),
    },
    {
      title: "Remark",
      width: "30%",
      render: (_, record) => (
        <Input
          value={record.remark}
          onChange={(e) =>
            updateRow(record.key, { remark: e.target.value })
          }
        />
      ),
    },
  ];

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!selectedPE || !selectedState || !selectedBranch || !selectedPeriod) {
      message.error("Complete all selections.");
      return;
    }

    const hasFile = tableData.some(r => r.fileList.length > 0);
    if (!hasFile) {
      message.error("Upload at least one document.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("pe_id", selectedPE);
      formData.append("branch_id", selectedBranch);
      formData.append("state_id", selectedState);
      formData.append("selected_period", selectedPeriod);
      formData.append("general_remark", generalRemark);

      tableData.forEach((row, index) => {
        if (row.fileList.length > 0) {
          formData.append(
            `document_${index}_file`,
            row.fileList[0].originFileObj as File
          );
          formData.append(
            `document_${index}_remark`,
            row.remark
          );
          if (row.document_id) {
            formData.append(
              `document_${index}_id`,
              row.document_id.toString()
            );
          }
        }
      });

      await axios.post(
        "http://127.0.0.1:8000/api/vendor/submit-compliance/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      message.success("Compliance submitted successfully.");
    } catch {
      message.error("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">
        Submit Compliance Record
      </h1>

      {/* Selection */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="grid md:grid-cols-3 gap-4">
          <select
            value={selectedPE}
            onChange={(e) => {
              setSelectedPE(e.target.value);
              setSelectedState("");
              setSelectedBranch("");
              setSelectedPeriod("");
              setTableData([]);
              loadStates(e.target.value);
            }}
            className="border rounded-lg p-2.5"
          >
            <option value="">Select PE</option>
            {peList.map(pe => (
              <option key={pe.id} value={pe.id}>
                {pe.short_name}
              </option>
            ))}
          </select>

          <select
            disabled={!selectedPE}
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedBranch("");
              setSelectedPeriod("");
              setTableData([]);
              loadBranches(selectedPE, e.target.value);
            }}
            className="border rounded-lg p-2.5"
          >
            <option value="">Select State</option>
            {states.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            disabled={!selectedState}
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              loadDocuments(selectedPE, e.target.value);
            }}
            className="border rounded-lg p-2.5"
          >
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Selection */}
      {selectedBranch && frequencyBase && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <Divider titlePlacement="left">
            Select Compliance Period ({frequencyBase})
          </Divider>

          <Select
            className="w-full"
            placeholder="Select Period"
            value={selectedPeriod || undefined}
            onChange={(value) => setSelectedPeriod(value)}
          >
            {getPeriodOptions().map(p => (
              <Option key={p} value={p}>
                {p}
              </Option>
            ))}
          </Select>
        </div>
      )}

      {/* Documents */}
      {selectedPeriod && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <Divider titlePlacement="left">
            Compliance Documents
          </Divider>

          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            bordered
          />

          <div className="mt-4">
            <Button type="link" onClick={addAdditionalDocument}>
              + Add Additional Document
            </Button>
          </div>

          <div className="mt-6">
            <label className="block mb-2 font-medium">
              General Remarks
            </label>
            <TextArea
              rows={4}
              value={generalRemark}
              onChange={(e) => setGeneralRemark(e.target.value)}
            />
          </div>
        </div>
      )}

      {selectedPeriod && (
        <div className="flex justify-end">
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            Submit Compliance
          </Button>
        </div>
      )}

    </div>
  );
}