import React, { useState } from "react";
import {useNavigate } from "react-router-dom";


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('Operator'); // Track selected role
  const navigate = useNavigate(); // Navigate to home when "X" is clicked
  const handleLogin = async (e) => {
    e.preventDefault();
  
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, role }), // Include role in the request
        credentials: "include"
      });
  
      if (!response.ok) {
        throw new Error('Invalid username or password');
      }
  
      const data = await response.json();
  
      alert(`Logged in successfully as ${role} - ${username}`);
      navigate('/'); // Redirect to home page after showing alert
    } catch (err) {
      setError(err.message);
    }
  };
  
 

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-20 border border-gray-300 rounded-lg relative bg-white shadow-lg">
        
        {/* Close button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 p-1 border border-gray-300 text-gray-500 hover:text-black"
        >
          ✖
        </button>

        {/* Unified Role Selection Tab */}
        <div className="flex justify-center mb-6">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setRole('Operator')}
              className={`px-4 py-2 font-semibold ${role === 'Operator' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Operator
            </button>
            <button
              onClick={() => setRole('Admin')}
              className={`px-4 py-2 font-semibold ${role === 'Admin' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600"
            //onClick={() => navigate('/')}
          >
            Login
          </button>
        </form>

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Login;