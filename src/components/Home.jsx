import React from "react";
import { HomeIcon, CircleUserRound } from "lucide-react";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const icons = {
  navbar: [
    { href: "/userhome", icon: HomeIcon, label: "Home" },
    { href: "#", icon: CircleUserRound, label: "Profile" },
  ],
};

const Hero = () => {
  // Initialize state from localStorage or default to false
  const [isDarkMode, setDarkMode] = React.useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    // Update localStorage when dark mode changes
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));

    // Update document classes
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
  };

  const HomeIconComponent = icons.navbar[0].icon;
  const ProfileIconComponent = icons.navbar[1].icon;

  return (
    <div className="flex flex-col align-center justify-center items-center h-screen bg-white dark:bg-black transition-colors duration-200">
      <h1 className="font-bold text-7xl mb-3 text-black dark:text-white">
        Banner
        <span className="outline-3 text-orange-500">Bites</span>
      </h1>
      <div className="relative w-96 p-6 text-center border-2 rounded-lg flex justify-center space-x-16 border-orange-500 bg-white dark:bg-black">
        <Link
          key="home"
          to={icons.navbar[0].href}
          className="flex flex-col items-center"
        >
          <HomeIconComponent className="w-6 h-6 text-black dark:text-white" />
        </Link>
        <DarkModeSwitch
          checked={isDarkMode}
          onChange={toggleDarkMode}
          size={24}
        />
        <Link
          key="profile"
          to={icons.navbar[1].href}
          className="flex flex-col items-center"
        >
          <ProfileIconComponent className="w-6 h-6 text-black dark:text-white" />
        </Link>
      </div>
    </div>
  );
};

export default Hero;
