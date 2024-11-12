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
  const useBreakpoint = (sizes) => {
    const [size, setSize] = useState(sizes.default);

    useEffect(() => {
      const handleResize = () => {
        if (window.matchMedia("(min-width: 1536px)").matches) {
          // 2xl
          setSize(sizes["2xl"]);
        } else if (window.matchMedia("(min-width: 1280px)").matches) {
          // xl
          setSize(sizes.xl);
        } else {
          setSize(sizes.default);
        }
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [sizes]);

    return size;
  };

  return (
    <section className="h-24 xl:h-32">
      <div className="fixed !z-[999] flex h-24 w-full items-center justify-between border-b-2 border-b-black bg-white px-6 text-2xl font-extrabold transition-colors duration-500 dark:border-b-white dark:bg-black max-md:w-full xl:h-32">
        <div className="pt-4">
          <h1 className="left-0 mb-3 items-center justify-center text-center text-3xl font-bold text-black dark:text-white xl:text-5xl">
            Banner
            <span className="text-orange-500 outline-1 lg:outline-2 xl:outline-8">
              Bites
            </span>
          </h1>
        </div>
        <div className="nav-links mr-6 hidden items-center gap-12 lg:flex xl:gap-16">
          <HomeIcon
            className="h-6 w-6 cursor-pointer text-black transition-colors duration-500 dark:text-white xl:h-8 xl:w-8 2xl:h-10 2xl:w-10"
            onClick={handleHome}
          />
          <LayoutList
            className="h-6 w-6 cursor-pointer text-black transition-colors duration-500 dark:text-white xl:h-8 xl:w-8 2xl:h-10 2xl:w-10"
            onClick={handleLayoutClick}
          />
          <DarkModeSwitch
            checked={isDarkMode}
            onChange={toggleDarkMode}
            size={useBreakpoint({ default: 24, xl: 32, "2xl": 40 })}
            moonColor="white"
            sunColor="black"
          />
        </div>
      </div>

      {/* Hamburger Menu */}
      <div className="fixed right-4 z-[99999] pt-6 lg:hidden">
        <Hamburger
          toggled={isOpen}
          toggle={toggleMenu}
          color={isOpen ? "white" : isDarkMode ? "white" : "black"}
        />
      </div>

      {/* Opened Hamburger Menu */}
      <div
        className={`mobile-menu font-general-sans sticky left-0 top-0 z-[9999] flex w-screen transform flex-col border-b border-white bg-black opacity-85 transition-transform duration-500 ease-in-out ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-center gap-4 border-b border-white/20 py-8">
          <HomeIcon
            className="h-6 w-6 cursor-pointer text-white transition-colors duration-500 dark:text-white"
            onClick={handleHome}
          />
        </div>
        <div className="flex items-center justify-center gap-4 border-b border-white/20 py-8">
          <LayoutList
            className="h-6 w-6 cursor-pointer text-white transition-colors duration-300 dark:text-white"
            onClick={handleLayoutClick}
          />
        </div>
        <div className="flex items-center justify-center gap-4 border-b border-white/20 py-8">
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
