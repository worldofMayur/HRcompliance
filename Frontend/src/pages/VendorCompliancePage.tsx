import { useEffect, useState } from "react";
import axios from "axios";

interface PE {
  id: number;
  name: string;
  email: string;
  mobile: string;
  company?: string;
}

export default function VendorCompliancePage() {
  const [peList, setPeList] = useState<PE[]>([]);

  useEffect(() => {
    loadMappedPE();
  }, []);

  const loadMappedPE = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await axios.get(
        "http://127.0.0.1:8000/api/vendor/mapped-pe/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Mapped PE Response:", res.data);
      setPeList(res.data);

    } catch (err: any) {
      console.error("Error loading mapped PE", err.response?.data || err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Submit Compliance Records</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">PE Name</th>
              <th className="text-left p-2">Company</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Mobile</th>
              <th className="text-left p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {peList.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No mapped PE found
                </td>
              </tr>
            )}

            {peList.map((pe) => (
              <tr key={pe.id} className="border-b">
                <td className="p-2">{pe.name}</td>
                <td className="p-2">{pe.company || "-"}</td>
                <td className="p-2">{pe.email}</td>
                <td className="p-2">{pe.mobile}</td>
                <td className="p-2">
                  <button className="bg-brand-600 text-white px-3 py-1 rounded-md text-xs">
                    Submit Records
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}