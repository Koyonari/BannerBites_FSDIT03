import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StyledAlert from "../StyledAlert";
import axios from "axios";

const Login = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false); // Track login success

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Reset fields when closing the login popup
  const handleClose = () => {
    onClose(); // Close the login popup
    setUsername(""); // Reset username field
    setPassword(""); // Reset password field
    setError(""); // Clear error messages
    setAlertConfig({ 
      isOpen: false, 
      title: "", 
      message: "", 
      type: "info" 
    }); // Close any alert messages
  };

  // Show success/failure alert
  const showAlert = (message, title = "Alert", type = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  // Handle closing the success message
  const handleCloseAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });

    // If login was successful, close the login popup and refresh the page
    if (isLoginSuccessful) {
      setTimeout(() => {
        onClose(); // Close the login popup
        window.location.reload(); // Refresh the page after a short delay
      }, 300);
    }
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
        }
      );

      setIsLoginSuccessful(true); // Mark login as successful
      showAlert("Login successful!", "Welcome", "success"); // Show success message

      // Wait 1.5 seconds, then close the login popup and reload the page
      setTimeout(() => {
        handleClose(); // Close the login popup
        window.location.reload(); // Refresh the page after closing
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative z-50 w-full max-w-lg px-4"
          >
            <div className="relative w-full overflow-hidden rounded-2xl border border-border-light bg-base-white p-8 shadow-xl dark:border-border-dark dark:bg-bg-dark">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose} // Close popup and reset input fields
                className="absolute right-4 top-4 rounded-full p-2 text-text-sublight hover:text-text-light dark:text-text-subdark dark:hover:text-text-dark"
              >
                ✖
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 text-center"
              >
                <h2 className="text-2xl font-bold text-text-light dark:text-base-white">
                  Welcome Back
                </h2>
                <p className="mt-2 text-sm text-text-sublight dark:text-text-subdark">
                  Please sign in to continue
                </p>
              </motion.div>

              <motion.form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group relative"
                  >
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="peer h-14 w-full rounded-lg border border-border-light bg-transparent px-4 text-text-light outline-none transition-all duration-300 placeholder:text-transparent focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark"
                      placeholder="Username"
                    />
                    <label
                      htmlFor="username"
                      className="absolute left-4 top-1/2 z-10 origin-[0] -translate-y-1/2 transform text-text-sublight transition-all duration-300 peer-focus:-translate-y-8 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:scale-75 dark:text-text-subdark"
                    >
                      Username
                    </label>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group relative"
                  >
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="peer h-14 w-full rounded-lg border border-border-light bg-transparent px-4 text-text-light outline-none transition-all duration-300 placeholder:text-transparent focus:border-bg-accent focus:ring-2 focus:ring-ring-primary/20 dark:border-border-dark dark:text-text-dark"
                      placeholder="Password"
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-4 top-1/2 z-10 origin-[0] -translate-y-1/2 transform text-text-sublight transition-all duration-300 peer-focus:-translate-y-8 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:scale-75 dark:text-text-subdark"
                    >
                      Password
                    </label>
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
            </div>
          </motion.div>

          {/* Success Message Popup */}
          <StyledAlert
            isOpen={alertConfig.isOpen}
            onClose={handleCloseAlert} // Close login popup and refresh page only after success message is closed
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default Login;
