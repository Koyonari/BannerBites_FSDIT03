import { useState, useEffect } from "react";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { HomeIcon, LayoutList } from "lucide-react";
import Hamburger from "hamburger-react";
import { useNavigate } from "react-router-dom";
import React from "react";

function Navbar() {
  const navigate = useNavigate();

  // Toggle Menu
  const [isOpen, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("menu-active");
    } else {
      document.body.classList.remove("menu-active");
    }
  }, [isOpen]);

  // Toggle Mode with localStorage
  const [isDarkMode, setDarkMode] = React.useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
  };

  const handleHome = () => {
    navigate("/userhome");
  };

  const handleLayoutClick = () => {
    navigate("/layouts");
  };

  return (
    <section className="h-24 !z-[10000]">
      <div className="bg-white dark:bg-black transition-colors duration-500 h-24 text-2xl fixed flex justify-between items-center w-full max-md:w-full px-6 font-extrabold border-b-black border-b-2 dark:border-b-white">
        <div className="pt-4">
          <h1 className="font-bold text-3xl mb-3 text-black dark:text-white items-center text-center justify-center left-0">
            Banner
            <span className="text-orange-500 outline-1">Bites</span>
          </h1>
        </div>
        <div className="nav-links hidden lg:flex items-center gap-12 mr-6">
          <HomeIcon
            className="w-6 h-6 text-black dark:text-white transition-colors duration-500 cursor-pointer"
            onClick={handleHome}
          />
          <LayoutList
            className="w-6 h-6 text-black dark:text-white transition-colors duration-500 cursor-pointer"
            onClick={handleLayoutClick}
          />
          <DarkModeSwitch
            checked={isDarkMode}
            onChange={toggleDarkMode}
            size={24}
            moonColor="white"
            sunColor="black"
          />
        </div>
      </div>

      {/* Hamburger Menu */}
      <div className="fixed pt-6 right-4 z-[99999] lg:hidden">
        <Hamburger
          toggled={isOpen}
          toggle={toggleMenu}
          color={isOpen ? "white" : isDarkMode ? "white" : "black"}
        />
      </div>

      {/* Opened Hamburger Menu */}
      <div
        className={`mobile-menu sticky top-0 left-0 w-screen bg-black border-b border-white z-[9999] flex flex-col font-general-sans opacity-85 transform transition-transform duration-500 ease-in-out ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-center gap-4 py-8 border-white/20 border-b">
          <HomeIcon
            className="w-6 h-6 text-white dark:text-white transition-colors duration-500 cursor-pointer"
            onClick={handleHome}
          />
        </div>
        <div className="flex items-center justify-center gap-4 py-8 border-white/20 border-b">
          <LayoutList
            className="w-6 h-6 text-white dark:text-white transition-colors duration-300 cursor-pointer"
            onClick={handleLayoutClick}
          />
        </div>
        <div className="flex items-center justify-center gap-4 py-8 border-white/20 border-b">
          <DarkModeSwitch
            checked={isDarkMode}
            onChange={toggleDarkMode}
            size={24}
            moonColor="white"
            sunColor="white"
          />
        </div>
      </div>
    </section>
  );
}

export default Navbar;
