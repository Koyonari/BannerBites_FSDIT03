import React from "react";
import { HomeIcon, LayoutList, ImagePlus } from "lucide-react";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { CircleUserRound, UserRoundPen } from "lucide-react";

const icons = {
  navbar: [
    { href: "/userhome", icon: HomeIcon, label: "Home" },
    { href: "/layouts", icon: LayoutList, label: "LayoutList" },
    { href: "/adunit", icon: ImagePlus, label: "AdUnit" },
    { href: "/login", icon: CircleUserRound, label: "Profile" },
    { href: "/customrole", icon: UserRoundPen, label: "CustomRole" },
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 transition-colors duration-200 light-bg dark:dark-bg">
      <div className="flex w-full max-w-lg flex-col items-center dark:dark-bg">
        <h1 className="mb-1 pb-1 text-center text-7xl font-bold primary-text dark:secondary-text md:text-7xl lg:text-5xl xl:text-6xl">
          Banner
          <span className="outline-8 accent-text">Bites</span>
        </h1>
        <div className="light-white relative flex h-16 w-full max-w-72 justify-center rounded-lg border-2 p-4 primary-border dark:dark-bg md:p-6">
          <div className="flex w-full max-w-xs items-center justify-between">
            {icons.navbar.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex flex-col items-center"
              >
                <item.icon className="h-6 w-6 primary-text dark:secondary-text" />
              </Link>
            ))}
            <DarkModeSwitch
              checked={isDarkMode}
              onChange={toggleDarkMode}
              size={24}
              className="transition-opacity hover:opacity-80"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
