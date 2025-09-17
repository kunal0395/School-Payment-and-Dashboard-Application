import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      const token = res.data.access_token;
      if (!token) throw new Error("No token in response");
      toast.success("Login successful!");
      localStorage.setItem("access_token", token);
      localStorage.setItem("username", username);
      navigate("/");
    } catch (err) {
      toast.error("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md card p-6 shadow-md rounded bg-white dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Login
        </h2>

        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

        <form onSubmit={submit}>
          {/* Username */}
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded border mb-3 text-black placeholder:text-gray-400 dark:text-black dark:bg-white outline-none"
            placeholder="admin"
            required
          />

          {/* Password */}
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border mb-3 text-black placeholder:text-gray-400 dark:text-black dark:bg-white outline-none pr-10"
              placeholder="password123"
              required
            />
            {/* Eye Icon Button */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                // Eye Open
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.574 3.008 9.963 7.178.07.207.07.432 0 .639C20.574 16.49 16.638 19.5 12 19.5c-4.64 0-8.577-3.01-9.964-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                // Eye Closed
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12c1.563 4.389 5.798 7.5 10.566 7.5 1.777 0 3.442-.428 4.91-1.184M6.228 6.228A10.451 10.451 0 0112 4.5c4.768 0 9.003 3.111 10.566 7.5a10.525 10.525 0 01-4.293 5.178M6.228 6.228L3 3m3.228 3.228L3 3m0 0l3.228 3.228M6.228 6.228l11.544 11.544"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
