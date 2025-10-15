import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import axios from "axios";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import axiosInstance from "../../api/axiosInstance";
import { useUserContext } from "../../context/UserContext";

export default function SignUpForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { loadUser } = useUserContext();

  const getSubscriptionParams = () => {
    const type = searchParams.get("type");
    const plan = searchParams.get("plan");
    const interval = searchParams.get("interval");

    if (!type || !plan) {
      return {
        type: "subscription",
        plan: "free",
        interval: "month",
      };
    }

    if (type === "one_time") {
      return {
        type,
        plan,
      };
    }

    return {
      type,
      plan,
      interval: interval || "month",
    };
  };

  const getPlanDisplayName = (plan, type) => {
    if (type === "one_time" && plan === "pdf_report") {
      return "One Time PDF Report";
    }
    return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "";
  };

  const shouldShowSubscriptionInfo = () => {
    const plan = searchParams.get("plan");
    return (
      plan &&
      plan !== "free" &&
      ["precision", "essentials", "pdf_report"].includes(plan)
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { username, email, password, password2 } = formData;

    if (!username || !email || !password || !password2) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    if (password !== password2) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const strongPasswordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long and include letters, numbers, and special characters. Avoid common or numeric-only passwords."
      );
      setLoading(false);
      return;
    }

    try {
      const subscriptionParams = getSubscriptionParams();
      const registrationData = {
        ...formData,
        ...subscriptionParams,
      };

      const response = await axiosInstance.post(
        "/users/register/",
        registrationData
      );

      if (response.status === 200 || response.status === 201) {
        const { access, refresh, checkout_url } = response.data;

        if (access) localStorage.setItem("authToken", access);
        if (refresh)
          localStorage.setItem("refreshToken", JSON.stringify(refresh));

        await loadUser();

        if (checkout_url) {
          window.location.href = checkout_url;
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        const errors = Object.entries(data)
          .map(([key, value]) => {
            const msg = (value as string[]).join(", ");
            return key === "password" ? msg : `${key}: ${msg}`;
          })
          .join(" | ");
        setError(errors || "Registration failed. Please try again.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar py-12">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10"></div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your details to create your account!
            </p>

            {shouldShowSubscriptionInfo() && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Selected Plan:{" "}
                  {getPlanDisplayName(
                    searchParams.get("plan"),
                    searchParams.get("type")
                  )}
                  {searchParams.get("type") === "subscription" &&
                    searchParams.get("interval") &&
                    ` (${searchParams.get("interval")})`}
                </p>
              </div>
            )}
          </div>

          {success && getSubscriptionParams().plan === "free" && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400">
                Account created successfully! You can now sign in.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="sm:col-span-1">
                    <Label>
                      Username<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Your password must:
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Be at least 8 characters long</li>
                    <li>Include letters, numbers, and special characters</li>
                    <li>Avoid common or numeric-only passwords</li>
                  </ul>
                </p>
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>
                    Confirm Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Confirm your password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="password2"
                      value={formData.password2}
                      onChange={handleInputChange}
                    />
                    <span
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  to="/"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
