import React, { useState } from "react"; // Add useState here
import { HomeIcon} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const homeIcon = {
    navbar: [
      { href: "/", icon: HomeIcon, label: "Home" },
    ],
  };

const HomeIconComponent = homeIcon.navbar[0].icon;


const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    
  
    const handleLogin = (e) => {
      e.preventDefault();
  
      if (!username || !password) {
        alert('Please enter both username and password');
        return;
      }
  
      alert(`Logged in as ${username}`);
    };
  
    return (
      <div className="login-container">
        <h1>Welcome to <span className="highlight"><b>BannerBites</b></span></h1>
        <Link
          key="home"
          to={homeIcon.navbar[0].href}
          className="flex flex-col items-center">
          <HomeIconComponent className="h-6 w-6 text-black dark:text-white" />
        </Link>
        <form onSubmit={handleLogin}>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Log In</button>
        </form>
      </div>
    );
  };
  
  export default Login;
