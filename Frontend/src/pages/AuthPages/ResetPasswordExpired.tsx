import { useNavigate } from "react-router";

export default function ResetPasswordExpired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 flex items-center justify-center rounded-full bg-red-100">
            <span className="text-red-600 text-2xl font-bold">!</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Link Expired
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          This password reset link has either already been used or has expired.
          For security reasons, reset links are valid only once.
        </p>

        {/* Button */}
        <button
          onClick={() => navigate("/TailAdmin/signin")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
        >
          Go to Sign In
        </button>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-400">
          HR Compliance Portal
        </div>

      </div>

    </div>
  );
}