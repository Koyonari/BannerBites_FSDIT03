import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../Navbar";
import { Upload, Search } from "lucide-react";

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
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Fetch ads from the backend
  const fetchAds = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/ads/all`);
      const mediaAds = response.data.filter(
        (ad) =>
          ad.type &&
          (ad.type.toLowerCase() === "image" ||
            ad.type.toLowerCase() === "video")
      );
      setAds(mediaAds);
      setFilteredAds(mediaAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  // Upload media file and metadata
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!mediaFile) {
      alert("Please select a valid media file.");
      return;
    }

    try {
      setUploading(true);

      // Step 1: Request pre-signed URL for S3 upload
      const presignedResponse = await axios.post(`${apiUrl}/api/ads/upload`, {
        fileName: mediaFile.name,
        contentType: mediaFile.type,
        title,
        description,
        type: mediaType,
      });

      const { s3Url } = presignedResponse.data;

      // Step 2: Upload file to S3
      await axios.put(s3Url, mediaFile, {
        headers: {
          "Content-Type": mediaFile.type,
        },
      });

      // Step 3: Refresh ads after upload
      setIsFormVisible(false);
      setMediaFile(null);
      setTitle("");
      setDescription("");
      fetchAds();
      alert("Media uploaded successfully!");
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Failed to upload media.");
    } finally {
      setUploading(false);
    }
  };

  // Initialize ads on component mount
  useEffect(() => {
    fetchAds();
  }, []);

  // Filter ads based on search term
  useEffect(() => {
    const results = ads.filter((ad) => {
      const adTitle = ad.content?.title || "";
      return adTitle.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredAds(results);
  }, [searchTerm, ads]);

  return (
    <div className="min-h-screen light-bg dark:dark-bg">
      <Navbar />

      {/* Header Section */}
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
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="h-10 w-full rounded-lg text-sm font-bold transition-all duration-300 ease-in-out primary-bg secondary-text hover:secondary-bg sm:w-1/4 lg:h-16 lg:text-lg xl:h-20 xl:text-2xl"
        >
          {isFormVisible ? "Close Form" : "Upload Media"}
        </button>
      </div>

      {/* Upload Form */}
      {isFormVisible && (
        <div className="mx-auto max-w-2xl px-4 py-6">
          <form
            onSubmit={handleUpload}
            className="space-y-4 rounded-xl bg-white p-6 shadow-lg transition-all duration-300 ease-in-out dark:bg-gray-800"
          >
            <div>
              <label className="block text-sm font-bold primary-text dark:secondary-text">
                Media Type:
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 secondary-border primary-text dark:secondary-text"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold primary-text dark:secondary-text">
                Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full rounded-lg border bg-transparent px-3 py-2 secondary-border primary-text dark:secondary-text"
              />
            </div>
            <div>
              <label className="block text-sm font-bold primary-text dark:secondary-text">
                Description:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                className="w-full rounded-lg border bg-transparent px-3 py-2 secondary-border primary-text dark:secondary-text"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold primary-text dark:secondary-text">
                Media File:
              </label>
              <input
                type="file"
                accept={mediaType === "image" ? "image/*" : "video/*"}
                onChange={(e) => setMediaFile(e.target.files[0])}
                className="w-full cursor-pointer rounded-lg border bg-transparent px-3 py-2 secondary-border primary-text dark:secondary-text"
              />
              <Upload className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full transform rounded-lg py-2 font-bold text-white transition-all duration-300 ease-in-out primary-bg hover:-translate-y-1 hover:secondary-bg"
            >
              {uploading ? "Uploading..." : "Upload Media"}
            </button>
          </form>
        </div>
      )}

      {/* Display Ads Grid */}
      <div className="px-8 py-8 lg:px-16 xl:px-24 2xl:px-32">
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => {
              const adTitle = ad.content?.title || "Untitled";
              const mediaName = ad.content?.s3Key || "Unknown";
              const mediaSrc = ad.content?.src || "";
              const mediaType = ad.type.toLowerCase();

              return (
                <div
                  key={ad.adId}
                  className="group relative overflow-hidden rounded-xl border-2 bg-white p-4 shadow-lg transition-all duration-300 ease-in-out primary-border hover:-translate-y-2 hover:shadow-xl dark:bg-gray-800"
                >
                  <div className="aspect-video overflow-hidden rounded-lg">
                    {mediaType === "image" ? (
                      <img
                        src={mediaSrc}
                        alt={adTitle}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <video
                        controls
                        src={mediaSrc}
                        className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-lg font-bold primary-text dark:secondary-text">
                      {adTitle}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Media Name: {mediaName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ad ID: {ad.adId}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-lg primary-text dark:secondary-text">
            No media ads found.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdUnit;
