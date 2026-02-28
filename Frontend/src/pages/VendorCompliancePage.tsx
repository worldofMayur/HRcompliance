import { useEffect, useState } from "react";
import axios from "axios";
import { Upload, Button as AntButton, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

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
  const [selectedDocument, setSelectedDocument] = useState("");

  /* ================= FILES ================= */

  const [mainFileList, setMainFileList] = useState<any[]>([]);
  const [extraFileList, setExtraFileList] = useState<any[]>([]);
  const [remarks, setRemarks] = useState("");
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
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (
      !selectedPE ||
      !selectedState ||
      !selectedBranch ||
      !selectedDocument ||
      mainFileList.length === 0
    ) {
      message.error("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("pe_id", selectedPE);
      formData.append("state_id", selectedState);
      formData.append("branch_id", selectedBranch);
      formData.append("document_id", selectedDocument);
      formData.append("remarks", remarks);

      // main file
      formData.append("file", mainFileList[0].originFileObj);

      // extra files
      extraFileList.forEach((file: any, index: number) => {
        formData.append(`extra_file_${index}`, file.originFileObj);
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
      resetForm();
    } catch (error) {
      message.error("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPE("");
    setSelectedState("");
    setSelectedBranch("");
    setSelectedDocument("");
    setMainFileList([]);
    setExtraFileList([]);
    setRemarks("");
    setStates([]);
    setBranches([]);
    setDocuments([]);
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Submit Compliance Record
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select mapped branch and upload required compliance documents.
        </p>
      </div>

      {/* ================= PRINCIPAL EMPLOYER ================= */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">
          Principal Employer
        </h2>

        <select
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          value={selectedPE}
          onChange={(e) => {
            setSelectedPE(e.target.value);
            setSelectedState("");
            setSelectedBranch("");
            setSelectedDocument("");
            loadStates(e.target.value);
          }}
        >
          <option value="">Select Principal Employer</option>
          {peList.map((pe) => (
            <option key={pe.id} value={pe.id}>
              {pe.short_name}
            </option>
          ))}
        </select>
      </div>

      {/* ================= BRANCH DETAILS ================= */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">
          Branch Details
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <select
            disabled={!selectedPE}
            className="rounded-lg border border-gray-300 p-2.5 text-sm disabled:bg-gray-100"
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedBranch("");
              setSelectedDocument("");
              loadBranches(selectedPE, e.target.value);
            }}
          >
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            disabled={!selectedState}
            className="rounded-lg border border-gray-300 p-2.5 text-sm disabled:bg-gray-100"
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedDocument("");
              loadDocuments(selectedPE, e.target.value);
            }}
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* ================= DOCUMENT ================= */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">
          Compliance Document
        </h2>

        <select
          disabled={!selectedBranch}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm disabled:bg-gray-100"
          value={selectedDocument}
          onChange={(e) => setSelectedDocument(e.target.value)}
        >
          <option value="">Select Document</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {selectedDocument && (
          <div className="mt-4 text-sm bg-blue-50 p-3 rounded-lg text-blue-700">
            Audit Period:{" "}
            {documents.find((d) => d.id === Number(selectedDocument))
              ?.audit_period || "As per mapping"}
          </div>
        )}
      </div>

      {/* ================= UPLOAD SECTION ================= */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-6">
          Upload Documents
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* MAIN FILE */}
          <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-300">
            <h3 className="text-sm font-medium mb-4">
              Main Compliance Document *
            </h3>

            <Upload
              beforeUpload={() => false}
              fileList={mainFileList}
              onChange={({ fileList }) => setMainFileList(fileList)}
              maxCount={1}
            >
              <AntButton icon={<UploadOutlined />} className="w-full">
                Select Main Document
              </AntButton>
            </Upload>
          </div>

          {/* SUPPORTING FILES */}
          <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-300">
            <h3 className="text-sm font-medium mb-4">
              Supporting Documents
            </h3>

            <Upload
              beforeUpload={() => false}
              fileList={extraFileList}
              onChange={({ fileList }) => setExtraFileList(fileList)}
              multiple
            >
              <AntButton icon={<UploadOutlined />} className="w-full">
                Add Supporting Files
              </AntButton>
            </Upload>
          </div>

        </div>

        {/* REMARKS */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            Remarks
          </label>
          <textarea
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm"
            placeholder="Add any additional notes..."
          />
        </div>
      </div>

      {/* ================= SUBMIT ================= */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
        >
          {loading ? "Submitting..." : "Submit Compliance"}
        </button>
      </div>

    </div>
  );
}