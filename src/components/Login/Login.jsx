import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import StyledAlert from "../StyledAlert";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (message, title = "Alert", type = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      showAlert("Please enter both username and password");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/login",
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      showAlert("Login successful!", "Welcome", "success");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password");
    }
  };

  return (
    <div className="dark:bg-dark flex min-h-screen items-center justify-center bg-gradient-to-br">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-light bg-base-white p-8 shadow-xl dark:border-border-dark dark:bg-bg-dark"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/")}
          className="absolute right-4 top-4 rounded-full p-2 text-text-sublight hover:text-text-light dark:text-text-subdark dark:hover:text-text-dark"
        >
          ✖
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-bold text-text-light dark:text-base-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-text-sublight dark:text-text-subdark">
            Please sign in to continue
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleLogin}
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-4">
            <motion.div whileHover={{ scale: 1.02 }} className="group relative">
              <label
                htmlFor="username"
                className={`absolute -top-2 left-4 z-10 px-1 text-sm text-text-sublight transition-all duration-300 ${
                  username ? "opacity-100" : "opacity-0"
                }`}
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="peer w-full rounded-lg border border-border-light bg-transparent px-4 py-3 text-text-light outline-none transition-all duration-300 placeholder:text-placeholder-light focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark dark:placeholder:text-placeholder-dark"
                placeholder="Username"
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="group relative">
              <label
                htmlFor="password"
                className={`absolute -top-2 left-4 z-10 px-1 text-sm text-text-sublight transition-all duration-300 ${
                  password ? "opacity-100" : "opacity-0"
                }`}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full rounded-lg border border-border-light bg-transparent px-4 py-3 text-text-light outline-none transition-all duration-300 placeholder:text-placeholder-light focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark dark:placeholder:text-placeholder-dark"
                placeholder="Password"
              />
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full rounded-lg bg-bg-accent px-4 py-3 font-semibold text-base-white shadow-lg shadow-bg-accent/20 transition-all hover:bg-bg-subaccent focus:ring-2 focus:ring-ring-primary focus:ring-offset-2 dark:shadow-bg-accent/20"
          >
            Sign In
          </motion.button>
        </motion.form>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center text-sm text-text-alert"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
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
