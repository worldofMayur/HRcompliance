import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/auth/login/", {
        email: email.trim(),
        password: password.trim(),
      });

      const data = response.data;

      if (!data?.access || !data?.refresh) {
        setError("Invalid response from server");
        return;
      }

      // Store tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Store user info
      localStorage.setItem("username", data.username || "");
      localStorage.setItem("email", data.email || "");
      localStorage.setItem("role", data.role || "");

      if (data.principal_employer_id !== null && data.principal_employer_id !== undefined) {
        localStorage.setItem("principal_employer_id", String(data.principal_employer_id));
      }

      if (isChecked) {
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remember_me");
      }

      // Redirect based on role
      switch (data.role) {
        case "SUPERADMIN":
          navigate("/dashboard", { replace: true });
          break;
        case "PE":
          navigate("/vendor-mapping", { replace: true });
          break;
        case "VENDOR":
          navigate("/vendor-compliance", { replace: true });
          break;
        case "AUDITOR":
          navigate("/auditor-dashboard", { replace: true });
          break;
        default:
          navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Keep me logged in
                </span>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button className="w-full" size="sm" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}