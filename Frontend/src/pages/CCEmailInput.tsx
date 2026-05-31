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
  const [editMode, setEditMode] = useState(false);

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
        "https://apii.complianceclearance.com/api/vendor/cc-emails/",
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

      const token = localStorage.getItem("access_token");

      await axios.post(
        "https://apii.complianceclearance.com/api/vendor/cc-emails/",
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
        newErrors[i] = "Invalid email address";
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

    const filtered = ccEmails.filter((e) => e.trim());

    if (filtered.length === 0) {
      alert("At least one email required");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("access_token");

      await axios.post(
        "https://apii.complianceclearance.com/api/vendor/cc-emails/",
        { emails: filtered },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSavedEmails(filtered);
      setEditMode(false);

      alert("Updated successfully");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-52 rounded bg-gray-200"></div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="h-11 rounded-xl bg-gray-100"></div>
              <div className="h-11 rounded-xl bg-gray-100"></div>
            </div>

            <div className="h-16 rounded-xl bg-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full px-8 py-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage CC Emails
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Configure compliance notification recipients
          </p>
        </div>

        <Button
          variant={editMode ? "primary" : "outline"}
          onClick={() => setEditMode(!editMode)}
          className="min-w-[110px]"
        >
          {editMode ? "Cancel" : "Edit"}
        </Button>
      </div>

      {/* MAIN CARD */}
      <ComponentCard title="CC Email Configuration">
        {/* TOP INFO */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Notification Emails
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              Maximum 2 emails allowed
            </p>
          </div>

          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              editMode
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {editMode ? "Editing" : "Saved"}
          </span>
        </div>

        {/* INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i}>
              <Label>Email {i + 1}</Label>

              <Input
                value={ccEmails[i]}
                disabled={!editMode}
                placeholder="Enter email address"
                onChange={(e) => handleChange(i, e.target.value)}
                className={`
                  transition-all duration-200
                  ${!editMode ? "bg-gray-50 cursor-not-allowed" : ""}
                  ${
                    errors[i]
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
                `}
              />

              {errors[i] && (
                <p className="text-xs text-red-500 mt-1">
                  {errors[i]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* SAVE BUTTON */}
        {editMode && (
          <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {/* SAVED EMAILS */}
        {savedEmails.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">
                Active Recipients
              </p>

              <span className="text-xs text-gray-500">
                {savedEmails.length}/2 Added
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {savedEmails.map((email, i) => (
                <div
                  key={i}
                  className="
                    flex items-center gap-2
                    px-3 py-1.5
                    bg-gray-100
                    hover:bg-gray-200
                    transition-colors
                    rounded-full
                    text-sm
                    text-gray-700
                  "
                >
                  <span>{email}</span>

                  {editMode && (
                    <button
                      onClick={() => handleDelete(i)}
                      className="
                        text-red-500
                        hover:text-red-700
                        text-xs
                        transition-colors
                      "
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
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-800">
            These emails will receive compliance notifications and audit updates.
          </p>
        </div>
      </ComponentCard>
    </div>
  );
}