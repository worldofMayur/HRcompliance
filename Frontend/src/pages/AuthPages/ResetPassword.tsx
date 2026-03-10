import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      const res = await fetch(
        "http://127.0.0.1:8000/api/auth/validate-reset-token/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, token }),
        }
      );

      const data = await res.json();

      if (!data.valid) {
        navigate("/reset-password-expired");
      } else {
        setLoading(false);
      }
    };

    validate();
  }, [uid, token, navigate]);

  const handleSubmit = async () => {
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    setSubmitting(true);

    const res = await fetch(
      "http://127.0.0.1:8000/api/auth/reset-password/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      }
    );

    const data = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      alert(data.error);
    } else {
      alert("Password set successfully");
      navigate("/TailAdmin/signin");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        Validating reset link...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

        {/* LOGO / TITLE */}

        <div className="text-center mb-6">
          <div className="text-xl font-semibold text-gray-800">
            HR Compliance Portal
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Set your account password
          </p>
        </div>

        {/* FORM */}

        <div className="space-y-4">

          <div>
            <label className="text-sm text-gray-600">New Password</label>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Confirm Password</label>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {/* SHOW PASSWORD */}

          <div className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              className="mr-2"
              onChange={() => setShowPassword(!showPassword)}
            />
            Show password
          </div>

          {/* BUTTON */}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
          >
            {submitting ? "Setting password..." : "Set Password"}
          </button>
        </div>

        {/* FOOTER */}

        <div className="text-center text-xs text-gray-400 mt-6">
          HR Compliance System
        </div>

      </div>
    </div>
  );
}