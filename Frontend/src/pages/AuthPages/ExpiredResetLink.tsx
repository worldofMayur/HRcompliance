import { useNavigate } from "react-router";

export default function ExpiredResetLink() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-3">
          Link Expired
        </h2>

        <p className="text-gray-600 mb-6">
          This password reset link has already been used or has expired.
        </p>

        <button
          onClick={() => navigate("/TailAdmin/signin")}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Go to Sign In
        </button>
      </div>
    </div>
  );
}
