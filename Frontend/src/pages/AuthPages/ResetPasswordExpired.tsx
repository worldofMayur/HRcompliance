export default function ResetPasswordExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow max-w-md text-center">
        <h2 className="text-xl font-bold mb-3">Link Expired</h2>
        <p className="text-gray-600 mb-4">
          This password reset link has already been used or expired.
        </p>
        <a
          href="/TailAdmin/signin"
          className="text-blue-600 underline"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
