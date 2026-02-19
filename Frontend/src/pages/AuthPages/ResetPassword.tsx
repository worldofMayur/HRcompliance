import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);

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

    const res = await fetch(
      "http://127.0.0.1:8000/api/auth/reset-password/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
    } else {
      alert("Password set successfully");
      navigate("/TailAdmin/signin");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Validating reset link...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Set New Password</h2>

        <input
          type="password"
          placeholder="New password"
          className="w-full mb-3 p-2 border rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm password"
          className="w-full mb-4 p-2 border rounded"
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Set Password
        </button>
      </div>
    </div>
  );
}
