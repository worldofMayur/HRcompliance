import { useEffect, useState } from "react";
import ComponentCard from "../components/common/ComponentCard";
import { useNavigate } from "react-router-dom";


interface Notification {
  id: number;
  title: string;
  data?: any;
  message?: string;
  created_at: string;
  is_read: boolean;
}

export default function VendorNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
      const navigate = useNavigate();


  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");

      const res = await fetch(
        "http://127.0.0.1:8000/api/auditor/vendor/notifications/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("API ERROR:", res.status);
        return;
      }

      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");

      await fetch(
        `http://127.0.0.1:8000/api/auditor/vendor/notifications/${id}/read/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Error updating notification", err);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Not Complied") return "text-red-600";
    if (status === "Complied") return "text-green-600";
    return "text-yellow-600";
  };

  return (
    <ComponentCard title="Notifications">
      <div className="space-y-3">

        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-400">Loading...</p>
        )}

        {/* EMPTY */}
        {!loading && notifications.length === 0 && (
          <p className="text-gray-500 text-center py-5">
            No notifications available
          </p>
        )}

        {notifications.map((n) => {
          const d = n.data || {};

          return (

                <div
                key={n.id}
                onClick={() => {
                    if (d.entries) {
                    navigate("/TailAdmin/vendor-compliance", {
                        state: { notificationData: d }
                    });
                    }
                }}
                className={`cursor-pointer border rounded-md p-3 transition hover:shadow ${
                    n.is_read ? "bg-white" : "bg-blue-50 border-blue-200"
                }`}
                >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold text-gray-800">
                  {n.title}
                </h3>

                {!n.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    className="text-xs text-blue-600"
                  >
                    Mark as read
                  </button>
                )}
              </div>

              {/* SUMMARY */}
              {d.vendor && (
                <div className="text-xs text-gray-600 mb-2">
                  <b>{d.vendor}</b> – {d.pe} – {d.state} – {d.branch} – {d.audit_period}
                </div>
              )}

              {/* TABLE */}
              {d.entries && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-1 text-left">Audit</th>
                        <th className="p-1 text-left">Doc</th>
                        <th className="p-1 text-left">Status</th>
                        <th className="p-1 text-left">Obs</th>
                        <th className="p-1 text-left">Rec</th>
                      </tr>
                    </thead>

                    <tbody>
                      {d.entries
                        .filter(
                          (e: any) =>
                            ![
                              "Complied",
                              "Exceptional Approval - Delayed Complied",
                              "Not Applicable For Audit Period"
                            ].includes(e.status)
                        )
                        .map((e: any, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="p-1 font-medium">
                              {e.audit_particular}
                            </td>

                            <td className="p-1">
                              {e.document_name}
                            </td>

                            <td className={`p-1 font-semibold ${getStatusColor(e.status)}`}>
                              {e.status}
                            </td>

                            <td className="p-1 truncate max-w-[120px]">
                              {e.observation}
                            </td>

                            <td className="p-1 truncate max-w-[120px]">
                              {e.recommendation}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TIME */}
              <div className="text-[10px] text-gray-400 mt-1 text-right">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </ComponentCard>
  );
}