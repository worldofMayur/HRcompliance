import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      // Clear old session before login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      localStorage.removeItem("principal_employer_id");

      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/login/",
        {
          username: email.trim(),
          password: password,
        }
      );

      const data = response.data;

      // Validate token response
      if (!data?.access || !data?.refresh) {
        setError("Invalid login response from server");
        return;
      }

      // Store tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Store user data
      localStorage.setItem("username", data.username || "");
      localStorage.setItem("email", data.email || "");
      localStorage.setItem("role", data.role || "");

      // Store PE ID if available
      if (
        data.principal_employer_id !== null &&
        data.principal_employer_id !== undefined
      ) {
        localStorage.setItem(
          "principal_employer_id",
          String(data.principal_employer_id)
        );
      }

      // Optional remember me
      if (isChecked) {
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remember_me");
      }

      console.log("✅ Login successful");

      // Redirect based on role
      switch (data.role) {
        case "SUPERADMIN":
          navigate("/", { replace: true });
          break;

        case "PE":
          navigate("/vendor-mapping", {
            replace: true,
          });
          break;

        case "VENDOR":
          navigate("/vendor-compliance", {
            replace: true,
          });
          break;

        case "AUDITOR":
          navigate("/auditor-dashboard", {
            replace: true,
          });
          break;

        default:
          navigate("/", {
            replace: true,
          });
      }
    } catch (err: any) {
      console.error("❌ Login Error:", err);

      if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
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

          {/* HEADER */}
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">

              {/* EMAIL */}
              <div>
                <Label>Email *</Label>

                <Input
                  type="email"
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* PASSWORD */}
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
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeIcon />
                    ) : (
                      <EyeCloseIcon />
                    )}
                  </span>
                </div>
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={isChecked}
                  onChange={setIsChecked}
                />

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Keep me logged in
                </span>
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">
                    {error}
                  </p>
                </div>
              )}

              {/* SUBMIT */}
              <Button
                className="w-full"
                size="sm"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

            </div>
          </form>

        </div>
      </div>
    </div>
  );
}