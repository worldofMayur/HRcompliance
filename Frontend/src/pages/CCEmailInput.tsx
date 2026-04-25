import { useState, useEffect } from "react";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Button from "../components/ui/button/Button";
import axios from "axios";

const emailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function ManageCCEmails() {
  const [ccEmails, setCcEmails] = useState(["", ""]);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [errors, setErrors] = useState(["", ""]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false); // ✅ NEW

  // =========================
  // LOAD EMAILS
  // =========================
  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const res = await axios.get(
        "http://127.0.0.1:8000/api/vendor/cc-emails/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const emails = res.data.map((e: any) => e.email);

      setSavedEmails(emails);
      setCcEmails([emails[0] || "", emails[1] || ""]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (index: number, value: string) => {
    const updated = [...ccEmails];
    updated[index] = value;

    const err = [...errors];
    err[index] = "";

    setCcEmails(updated);
    setErrors(err);
  };

  // =========================
  // DELETE EMAIL
  // =========================
  const handleDelete = async (index: number) => {
    try {
      const updated = [...savedEmails];
      updated.splice(index, 1);

      setSavedEmails(updated);
      setCcEmails([updated[0] || "", updated[1] || ""]);

      // 🔥 Update backend
      const token = localStorage.getItem("access_token");

      await axios.post(
        "http://127.0.0.1:8000/api/vendor/cc-emails/",
        { emails: updated },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  // =========================
  // VALIDATION
  // =========================
  const validate = () => {
    let valid = true;
    const newErrors = ["", ""];

    ccEmails.forEach((email, i) => {
      if (email && !emailRegex.test(email)) {
        newErrors[i] = "Invalid email";
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  };

  // =========================
  // SAVE / UPDATE
  // =========================
  const handleSave = async () => {
    if (!validate()) return;

    const filtered = ccEmails.filter(e => e.trim());

    if (filtered.length === 0) {
      alert("At least one email required");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("access_token");

      await axios.post(
        "http://127.0.0.1:8000/api/vendor/cc-emails/",
        { emails: filtered },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSavedEmails(filtered);
      setEditMode(false);

      alert("Updated successfully");

    } catch (err) {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // UI
  // =========================
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 w-full px-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Manage CC Emails
          </h1>
          <p className="text-sm text-gray-500">
            Maximum 2 emails allowed
          </p>
        </div>

        {/* ✏️ EDIT TOGGLE */}
        <Button
          variant="outline"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "Cancel" : "Edit"}
        </Button>
      </div>

      <ComponentCard title="CC Email Configuration">

        {/* INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {[0, 1].map((i) => (
            <div key={i}>
              <Label>Email {i + 1}</Label>
              <Input
                value={ccEmails[i]}
                disabled={!editMode}
                onChange={(e) => handleChange(i, e.target.value)}
              />
              {errors[i] && (
                <p className="text-xs text-red-500">{errors[i]}</p>
              )}
            </div>
          ))}

        </div>

        {/* SAVE BUTTON */}
        {editMode && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {/* ========================= */}
        {/* SAVED EMAILS */}
        {/* ========================= */}
        {savedEmails.length > 0 && (
          <div className="mt-6 border-t pt-4">

            <p className="text-sm font-medium text-gray-700 mb-2">
              Saved CC Emails
            </p>

            <div className="flex flex-wrap gap-2">

              {savedEmails.map((email, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  <span>{email}</span>

                  {/* ❌ DELETE BUTTON */}
                  {editMode && (
                    <button
                      onClick={() => handleDelete(i)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

            </div>
          </div>
        )}

        {/* INFO */}
        <div className="mt-5 text-sm text-blue-700 bg-blue-50 p-3 rounded">
          These emails will receive compliance notifications.
        </div>

      </ComponentCard>
    </div>
  );
}