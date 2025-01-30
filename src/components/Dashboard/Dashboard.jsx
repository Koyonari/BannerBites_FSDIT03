import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import Navbar from "../Navbar";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const Dashboard = () => {
  const [adAggregates, setAdAggregates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    // Initial theme check
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );
    setIsDarkMode(
      darkModeMediaQuery.matches ||
        document.documentElement.classList.contains("dark"),
    );

    // Theme change listener
    const handleThemeChange = (e) => {
      setIsDarkMode(
        e.matches || document.documentElement.classList.contains("dark"),
      );
    };

    // Listen for system theme changes
    darkModeMediaQuery.addEventListener("change", handleThemeChange);

    // Create MutationObserver to watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      darkModeMediaQuery.removeEventListener("change", handleThemeChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAuthenticated(!!decoded);
      } catch (err) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const [adAggregatesRes] = await Promise.all([
          fetch("http://localhost:5000/api/dashboard/adAggregates"),
        ]);

        if (!adAggregatesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [adAggregatesData] = await Promise.all([adAggregatesRes.json()]);

        setAdAggregates(
          adAggregatesData.sort(
            (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated),
          ),
        );
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Format ISO date string to locale string
  const formatDate = (isoString) => new Date(isoString).toLocaleString();

  const createChartData = (label, data, bgColor, borderColor) => ({
    labels: adAggregates.map((ad, index) => `Ad ${index + 1}`),
    datasets: [
      {
        label: label,
        data: data,
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "currentColor",
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(160, 174, 192, 0.1)",
        },
        ticks: {
          color: "currentColor",
        },
      },
      y: {
        grid: {
          color: "rgba(160, 174, 192, 0.1)",
        },
        ticks: {
          color: "currentColor",
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-bg-light transition-colors duration-200 dark:bg-bg-dark">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="mb-8 text-center text-4xl font-bold text-text-light dark:text-text-dark">
          Analytics Dashboard
        </h1>

        {!isAuthenticated && (
          <div className="mb-6 rounded-lg border border-border-alert bg-bg-alert bg-opacity-10 p-4">
            <p className="text-center text-text-alert">
              You must be logged in to view the dashboard.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-text-sublight dark:text-text-subdark">
              Loading data...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border-alert bg-bg-alert bg-opacity-10 p-4">
            <p className="text-center text-text-alert">{error}</p>
          </div>
        ) : (
          <>
            <section className="mb-8 rounded-xl border border-border-light bg-base-white shadow-lg transition-colors duration-200 dark:border-border-dark dark:bg-bg-dark">
              <div className="p-6">
                <h2 className="mb-4 text-2xl font-semibold text-text-light dark:text-text-dark">
                  Advertisement Performance
                </h2>
                <p className="mb-6 text-sm text-text-sublight dark:text-text-subdark">
                  This table is sorted by the latest updated advertisements. The
                  labels 'Ad 1', 'Ad 2', etc., are used to help correlate the
                  data between the table and the charts.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border-light bg-bg-light dark:border-border-dark dark:bg-bg-dark">
                        <th className="px-4 py-3 text-left text-text-light dark:text-text-dark">
                          Ad #
                        </th>
                        <th className="px-4 py-3 text-left text-text-light dark:text-text-dark">
                          Ad ID
                        </th>
                        <th className="px-4 py-3 text-left text-text-light dark:text-text-dark">
                          Avg Dwell Time (ms)
                        </th>
                        <th className="px-4 py-3 text-left text-text-light dark:text-text-dark">
                          Total Gaze Samples
                        </th>
                        <th className="px-4 py-3 text-left text-text-light dark:text-text-dark">
                          Total Sessions
                        </th>
                        <th className="px-4 py-3 text-left text-text-light dark:text-text-dark">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {adAggregates.map((ad, index) => (
                        <tr
                          key={ad.adId}
                          className="border-b border-border-light transition-colors duration-150 hover:bg-bg-light dark:border-border-dark dark:hover:bg-bg-dark"
                        >
                          <td className="px-4 py-3 text-text-sublight dark:text-text-subdark">
                            Ad {index + 1}
                          </td>
                          <td className="px-4 py-3 text-text-sublight dark:text-text-subdark">
                            {ad.adId}
                          </td>
                          <td className="px-4 py-3 text-text-sublight dark:text-text-subdark">
                            {ad.totalDwellTime}
                          </td>
                          <td className="px-4 py-3 text-text-sublight dark:text-text-subdark">
                            {ad.totalGazeSamples}
                          </td>
                          <td className="px-4 py-3 text-text-sublight dark:text-text-subdark">
                            {ad.totalSessions}
                          </td>
                          <td className="px-4 py-3 text-text-sublight dark:text-text-subdark">
                            {formatDate(ad.lastUpdated)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <section className="rounded-xl border border-border-light bg-base-white shadow-lg transition-colors duration-200 dark:border-border-dark dark:bg-bg-dark">
                <div className="p-6">
                  <h2 className="mb-4 text-xl font-semibold text-text-light dark:text-text-dark">
                    Average Dwell Time
                  </h2>
                  <div className="h-80 text-text-light dark:text-text-dark">
                    <Bar
                      data={createChartData(
                        "Avg Dwell Time (ms)",
                        adAggregates.map((ad) => ad.totalDwellTime),
                        "rgba(30, 154, 255, 0.6)",
                        "rgba(30, 154, 255, 1)",
                      )}
                      options={chartOptions}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border-light bg-base-white shadow-lg transition-colors duration-200 dark:border-border-dark dark:bg-bg-dark">
                <div className="p-6">
                  <h2 className="mb-4 text-xl font-semibold text-text-light dark:text-text-dark">
                    Total Gaze Samples
                  </h2>
                  <div className="h-80 text-text-light dark:text-text-dark">
                    <Bar
                      data={createChartData(
                        "Total Gaze Samples",
                        adAggregates.map((ad) => ad.totalGazeSamples),
                        "rgba(99, 179, 237, 0.6)",
                        "rgba(99, 179, 237, 1)",
                      )}
                      options={chartOptions}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border-light bg-base-white shadow-lg transition-colors duration-200 dark:border-border-dark dark:bg-bg-dark lg:col-span-2">
                <div className="p-6">
                  <h2 className="mb-4 text-xl font-semibold text-text-light dark:text-text-dark">
                    Total Sessions
                  </h2>
                  <div className="h-80 text-text-light dark:text-text-dark">
                    <Bar
                      data={createChartData(
                        "Total Sessions",
                        adAggregates.map((ad) => ad.totalSessions),
                        "rgba(160, 174, 192, 0.6)",
                        "rgba(160, 174, 192, 1)",
                      )}
                      options={chartOptions}
                    />
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
