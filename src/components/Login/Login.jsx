import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "../StyledAlert";
import axios from "axios";
// Login is a component that renders the login form
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("Operator"); // Track selected role
  const navigate = useNavigate(); // Navigate to home when "X" is clicked
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  // showAlert is a function that displays an alert message
  const showAlert = (message, title = "Alert", type = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };
  // Function to handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      showAlert("Please enter both username and password");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/login",
        { username, password, role }, // Request body with role included
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Include credentials (e.g., cookies) with the request
        },
      );

      alert(`Logged in successfully as ${role} - ${username}`);
      navigate("/"); // Redirect to home page after showing alert
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password");
    }
  };

  return (
    <div className="neutral-bg flex min-h-screen items-center justify-center dark:dark-bg">
      <div className="relative w-full max-w-md rounded-lg border p-20 shadow-lg secondary-border light-bg dark:dark-bg">
        {/* Close button */}
        <button
          onClick={() => navigate("/")}
          className="neutral-text absolute right-4 top-4 p-1 hover:primary-text dark:hover:secondary-text"
        >
          ✖
        </button>

        {/* Selection Tab with transition */}
        <div className="mb-6 flex w-full justify-center">
          <div className="flex overflow-hidden rounded-md border secondary-border">
            <button
              onClick={() => setRole("Operator")}
              className={`px-4 py-2 font-semibold transition-colors duration-300 ${
                role === "Operator"
                  ? "primary-bg secondary-text"
                  : "neutralalt-bg primary-text"
              }`}
            >
              Operator
            </button>
            <button
              onClick={() => setRole("Admin")}
              className={`px-4 py-2 font-semibold transition-colors duration-300 ${
                role === "Admin"
                  ? "primary-bg secondary-text"
                  : "neutralalt-bg primary-text"
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-md border px-4 py-2 secondary-border placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-4 py-2 placeholder-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="primary-bg hover:secondary-bg w-full rounded-md py-2 font-semibold secondary-text"
          >
            Login
          </button>
        </form>

        {error && <p className="mt-4 alert-text">{error}</p>}
      </div>
      <StyledAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
};

export default Login;
