import React from "react";
import { HomeIcon, CircleUserRound, LayoutList } from "lucide-react";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const icons = {
  navbar: [
    { href: "/userhome", icon: HomeIcon, label: "Home" },
    { href: "#", icon: CircleUserRound, label: "Profile" },
    { href: "/layouts", icon: LayoutList, label: "LayoutList" },
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

  return (
    <div className="align-center flex h-screen flex-col items-center justify-center bg-white transition-colors duration-200 dark:bg-black">
      <h1 className="mb-3 text-7xl font-bold text-black dark:text-white">
        Banner
        <span className="text-orange-500 outline-3">Bites</span>
      </h1>
      <div className="relative flex w-96 justify-center space-x-16 rounded-lg border-2 border-orange-500 bg-white p-6 text-center dark:bg-black">
        <Link
          key="home"
          to={icons.navbar[0].href}
          className="flex flex-col items-center"
        >
          <HomeIconComponent className="h-6 w-6 text-black dark:text-white" />
        </Link>

        <Link
          key="home"
          to={icons.navbar[2].href}
          className="flex flex-col items-center"
        >
          <LayoutList className="h-6 w-6 text-black dark:text-white" />
        </Link>

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
