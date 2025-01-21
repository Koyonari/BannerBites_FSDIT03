import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../Navbar";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdUnit = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  // Function to fetch ads from the backend
  const fetchAds = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/ads/all`);
      const allAds = response.data;

      // Filter ads to include only images and videos
      const mediaAds = allAds.filter(
        (ad) =>
          ad.type &&
          (ad.type.toLowerCase() === "image" ||
            ad.type.toLowerCase() === "video"),
      );

      setAds(mediaAds);
      setFilteredAds(mediaAds); // Initialize filtered ads
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  // Function to handle media upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!mediaFile || (mediaType !== "image" && mediaType !== "video")) {
      alert("Please select a valid media file.");
      return;
    }

    try {
      setUploading(true);

      // Create FormData for the upload
      const formData = new FormData();
      formData.append("file", mediaFile);
      formData.append("type", mediaType);
      formData.append("title", title);
      formData.append("description", description);

      // Make the API call to the create endpoint
      // eslint-disable-next-line
      const response = await axios.post(`${apiUrl}/api/ads/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Media uploaded successfully!");
      setMediaFile(null);
      setTitle("");
      setDescription("");
      fetchAds(); // Refresh the ads list
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Failed to upload media.");
    } finally {
      setUploading(false);
    }
  };

  // Effect to fetch ads on component mount
  useEffect(() => {
    fetchAds();
  }, []);

  // Effect to filter ads based on the search term
  useEffect(() => {
    const results = ads.filter((ad) => {
      const title = ad.content?.title || ""; // Handle undefined title
      return title.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredAds(results);
  }, [searchTerm, ads]);

  return (
    <div className="min-h-screen light-bg dark:dark-bg">
      <Navbar />
      <div className="mx-auto flex w-full flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-12 lg:px-16 lg:text-lg xl:h-20 xl:px-24 2xl:px-32">
        {/* Search Bar */}
        <div className="w-full sm:w-3/4">
          <div className="relative h-10 rounded-lg border secondary-border lg:h-16 xl:h-20">
            <input
              type="text"
              placeholder="Search advertisements"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-full w-full rounded-lg bg-transparent px-3 text-sm primary-text placeholder-primary focus:outline-none dark:secondary-text dark:placeholder-secondary sm:text-base lg:text-lg xl:text-2xl"
            />
          </div>
        </div>
      </div>

      {/* Media Upload Form */}
      <div className="px-4 py-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-bold">Media Type:</label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold">Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-bold">Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="w-full rounded-lg border px-3 py-2"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold">Media File:</label>
            <input
              type="file"
              accept={mediaType === "image" ? "image/*" : "video/*"}
              onChange={(e) => setMediaFile(e.target.files[0])}
              className="w-full"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-lg py-2 font-bold text-white primary-bg hover:secondary-bg"
            >
              {uploading ? "Uploading..." : "Upload Media"}
            </button>
          </div>
        </form>
      </div>

      {/* Display Ads */}
      <div className="px-4 py-6">
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => {
              const adTitle = ad.content?.title || "Untitled";
              const mediaName = ad.content?.s3Key || "Unknown";
              const mediaSrc = ad.content?.src || "";
              const mediaType = ad.type.toLowerCase();

              return (
                <div
                  key={ad.adId}
                  className="dark:bg-dark-bg-light rounded-lg p-4 shadow-lg"
                >
                  {mediaType === "image" ? (
                    <img
                      src={mediaSrc}
                      alt={adTitle}
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <video
                      controls
                      src={mediaSrc}
                      className="h-48 w-full rounded-lg"
                    />
                  )}
                  <div className="mt-4">
                    <h3 className="text-primary text-lg font-bold">
                      {adTitle}
                    </h3>
                    <p className="text-secondary text-sm">
                      Media Name: {mediaName}
                    </p>
                    <p className="text-secondary text-sm">Ad ID: {ad.adId}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-secondary text-center">No media ads found.</p>
        )}
      </div>
    </div>
  );
};

export default AdUnit;
