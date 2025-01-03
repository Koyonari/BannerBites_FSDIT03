import { useState, useEffect } from "react";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { HomeIcon, LayoutList, CircleUserRound, ImagePlus } from "lucide-react";
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
    <>
      <nav className="fixed left-0 right-0 top-0 z-[999] border-b-2 border-b-black transition-colors duration-500 light-bg dark:border-b-white dark:dark-bg">
        <div className="flex h-20 items-center justify-between px-6 xl:h-32">
          <div>
            <h1 className="text-3xl font-bold primary-text dark:secondary-text xl:text-5xl">
              Banner
              <span className="accent-text outline-1 lg:outline-2 xl:outline-8">
                Bites
              </span>
            </h1>
          </div>

          <div className="nav-links mr-6 hidden items-center gap-12 lg:flex xl:gap-16">
            <HomeIcon
              className="h-6 w-6 cursor-pointer transition-colors duration-500 primary-text dark:secondary-text xl:h-8 xl:w-8 2xl:h-10 2xl:w-10"
              onClick={() => navigate("/userhome")}
            />
            <LayoutList
              className="h-6 w-6 cursor-pointer transition-colors duration-500 primary-text dark:secondary-text xl:h-8 xl:w-8 2xl:h-10 2xl:w-10"
              onClick={() => navigate("/layouts")}
            />
            <ImagePlus
              className="h-6 w-6 cursor-pointer transition-colors duration-500 primary-text dark:secondary-text xl:h-8 xl:w-8 2xl:h-10 2xl:w-10"
              onClick={() => navigate("/adunit")}
            />
            <CircleUserRound
              className="h-6 w-6 cursor-pointer transition-colors duration-500 primary-text dark:secondary-text xl:h-8 xl:w-8 2xl:h-10 2xl:w-10"
              onClick={() => navigate("/login")}
            />
            <DarkModeSwitch
              checked={isDarkMode}
              onChange={setDarkMode}
              size={useBreakpoint({ default: 24, xl: 32, "2xl": 40 })}
              moonColor="white"
              sunColor="black"
            />
          </div>
        </div>

        {/* Hamburger Menu */}
        <div className="fixed right-4 top-0 z-[99999] pt-6 lg:hidden">
          <Hamburger
            toggled={isOpen}
            toggle={toggleMenu}
            color={isOpen ? "white" : isDarkMode ? "white" : "black"}
          />
        </div>

        {/* Mobile Menu */}
        <div
          className={`fixed left-0 top-0 z-[9999] w-screen transform border-b opacity-85 transition-transform duration-500 ease-in-out white-border dark-bg ${
            isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="flex flex-col">
            {[
              { Icon: HomeIcon, path: "/userhome" },
              { Icon: LayoutList, path: "/layouts" },
              { Icon: ImagePlus, path: "/adunit" },
              { Icon: CircleUserRound, path: "/login" },
            ].map(({ Icon, path }) => (
              <div
                key={path}
                className="white-border/20 flex items-center justify-center gap-4 border-b py-8"
              >
                <Icon
                  className="h-6 w-6 cursor-pointer transition-colors duration-300 secondary-text"
                  onClick={() => navigate(path)}
                />
              </div>
            ))}
            <div className="white-border/20 flex items-center justify-center gap-4 border-b py-8">
              <DarkModeSwitch
                checked={isDarkMode}
                onChange={setDarkMode}
                size={24}
                moonColor="white"
                sunColor="white"
              />
            </div>
          </div>
        </div>
      </nav>
      <div className="h-24 light-bg dark:dark-bg xl:h-36"></div>
    </>
  );
}

export default Navbar;
