import React from "react";
import { HomeIcon, CircleUserRound } from "lucide-react";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const icons = {
  navbar: [
    { href: "/ad", icon: HomeIcon, label: "Home" },
    { href: "#", icon: CircleUserRound, label: "Profile" },
  ],
};

const Hero = () => {
  const [isDarkMode, setDarkMode] = React.useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
  };

  return (
    <div className="flex flex-col align-center justify-center items-center h-screen bg-white dark:bg-black transition-colors duration-200">
      <h1 className="font-bold text-7xl mb-3 text-black dark:text-white">
        Banner
        <span className="outline-3 text-orange-500">Bites</span>
      </h1>
      <div className="relative w-96 p-6 text-center border-2 rounded-lg flex justify-center space-x-16 border-orange-500 bg-white dark:bg-black">
        {icons.navbar.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="flex flex-col items-center"
          >
            <item.icon className="w-6 h-6 text-black dark:text-white" />
          </Link>
        ))}
        <DarkModeSwitch
          checked={isDarkMode}
          onChange={toggleDarkMode}
          size={24}
        />
      </div>
    </div>
  );
};

export default Hero;
