import React from "react";
import { HomeIcon, CircleUserRound } from "lucide-react";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { Link } from "react-router-dom";

const icons = {
  navbar: [
    { href: "/ad", icon: HomeIcon, label: "Home" },
    { href: "#", icon: CircleUserRound, label: "Profile" },
  ],
};

const Hero = () => {
  const [isDarkMode, setDarkMode] = React.useState(false);

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
  };

  return (
    <div className="flex flex-col align-center justify-center items-center h-screen">
      <h1 className="font-bold text-7xl mb-3">
        Banner
        <span className="text-orange-500 outline-3">Bites</span>
      </h1>
      <div className="relative w-[30vw] p-6 text-center border-2 rounded-lg flex justify-center space-x-16 border-orange-500">
        {icons.navbar.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="flex flex-col items-center"
          >
            <item.icon className="w-6 h-6" />
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
