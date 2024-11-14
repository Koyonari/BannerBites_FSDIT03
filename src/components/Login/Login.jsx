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
        }
      );
  
      alert(`Logged in successfully as ${role} - ${username}`);
      navigate("/"); // Redirect to home page after showing alert
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black">
      <div className="relative w-full max-w-md rounded-lg border border-gray-300 bg-white p-20 shadow-lg dark:bg-black">
        {/* Close button */}
        <button
          onClick={() => navigate("/")}
          className="absolute right-4 top-4 p-1 text-gray-500 hover:text-black dark:hover:text-white"
        >
          ✖
        </button>

        {/* Selection Tab with transition */}
        <div className="mb-6 flex w-full justify-center">
          <div className="flex overflow-hidden rounded-md border border-gray-300">
            <button
              onClick={() => setRole("Operator")}
              className={`px-4 py-2 font-semibold transition-colors duration-300 ${
                role === "Operator"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Operator
            </button>
            <button
              onClick={() => setRole("Admin")}
              className={`px-4 py-2 font-semibold transition-colors duration-300 ${
                role === "Admin"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700"
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
              className="w-full rounded-md border border-gray-300 px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full rounded-md border border-gray-300 px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-orange-500 py-2 font-semibold text-white hover:bg-orange-600"
          >
            Login
          </button>
        </form>

        {error && <p className="mt-4 text-red-500">{error}</p>}
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
