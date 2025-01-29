import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import Navbar from "../Navbar";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [adAggregates, setAdAggregates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

        const [adAggregatesData] = await Promise.all([
          adAggregatesRes.json(),
        ]);

        setAdAggregates(adAggregatesData.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)));
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
    datasets: [{
      label: label,
      data: data,
      backgroundColor: bgColor,
      borderColor: borderColor,
      borderWidth: 1,
    }],
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Dashboard</h1>
        {!isAuthenticated && <p className="text-center text-red-500 mb-6">You must be logged in to view the dashboard.</p>}
        { loading ? (
          <p className="text-center text-gray-600">Loading data...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <>
            <section className="bg-white p-6 rounded-xl shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Advertisement Performance</h2>
              <p className="text-gray-600 text-sm mb-4">This table is sorted by the latest updated advertisements. The labels 'Ad 1', 'Ad 2', etc., are used to help correlate the data between the table and the charts.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Ad #</th>
                      <th className="border border-gray-300 px-4 py-2">Ad ID</th>
                      <th className="border border-gray-300 px-4 py-2">Avg Dwell Time (ms)</th>
                      <th className="border border-gray-300 px-4 py-2">Total Gaze Samples</th>
                      <th className="border border-gray-300 px-4 py-2">Total Sessions</th>
                      <th className="border border-gray-300 px-4 py-2">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adAggregates.map((ad, index) => (
                      <tr key={ad.adId} className="text-center border border-gray-300">
                        <td className="border border-gray-300 px-4 py-2">Ad {index + 1}</td>
                        <td className="border border-gray-300 px-4 py-2">{ad.adId}</td>
                        <td className="border border-gray-300 px-4 py-2">{ad.totalDwellTime}</td>
                        <td className="border border-gray-300 px-4 py-2">{ad.totalGazeSamples}</td>
                        <td className="border border-gray-300 px-4 py-2">{ad.totalSessions}</td>
                        <td className="border border-gray-300 px-4 py-2">{formatDate(ad.lastUpdated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Chart: Avg Dwell Time */}
            <section className="bg-white p-6 rounded-xl shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Avg Dwell Time (ms) Bar Chart</h2>
              <div className="w-full h-96">
                <Bar data={createChartData("Avg Dwell Time (ms)", adAggregates.map(ad => ad.totalDwellTime), "rgba(255, 99, 132, 0.6)", "rgba(255, 99, 132, 1)")} />
              </div>
            </section>

            {/* Chart: Total Gaze Samples */}
            <section className="bg-white p-6 rounded-xl shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Total Gaze Samples Bar Chart</h2>
              <div className="w-full h-96">
                <Bar data={createChartData("Total Gaze Samples", adAggregates.map(ad => ad.totalGazeSamples), "rgba(75, 192, 192, 0.6)", "rgba(75, 192, 192, 1)")} />
              </div>
            </section>

            {/* Chart: Total Sessions */}
            <section className="bg-white p-6 rounded-xl shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Total Sessions Bar Chart</h2>
              <div className="w-full h-96">
                <Bar data={createChartData("Total Sessions", adAggregates.map(ad => ad.totalSessions), "rgba(54, 162, 235, 0.6)", "rgba(54, 162, 235, 1)")} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
