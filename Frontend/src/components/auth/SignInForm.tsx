import { useState } from "react";
import { Link, useNavigate } from "react-router";
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

    // basic validation
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/login/",
        {
          username: email,
          password: password,
        }
      );

      // store auth tokens
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      // store user info
      // store user info
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("email", res.data.email);
      localStorage.setItem("role", res.data.role);

      // store PE id
      if (res.data.principal_employer_id !== null && res.data.principal_employer_id !== undefined) {
        localStorage.setItem(
          "principal_employer_id",
          String(res.data.principal_employer_id)
        );
      }

      // redirect to main dashboard only
      const role = res.data.role;

        if (role === "SUPERADMIN") {
          navigate("/TailAdmin/", { replace: true });
        } else if (role === "PE") {
          navigate("/TailAdmin/vendor-mapping", { replace: true });
        } else if (role === "VENDOR") {
          navigate("/TailAdmin/vendor-compliance", { replace: true });
        } else {
          navigate("/TailAdmin/", { replace: true });
        }

    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
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
              {/* EMAIL */}
              <div>
                <Label>Email *</Label>
                <Input
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
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                  </span>
                </div>
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center justify-between">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
                <span className="text-sm">Keep me logged in</span>
              </div>

              {/* ERROR */}
              {error && <p className="text-red-500 text-sm">{error}</p>}

              {/* SUBMIT */}
              <Button
                className="w-full"
                size="sm"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
