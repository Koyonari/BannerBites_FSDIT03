import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../Navbar";
import { Search, Trash2, Upload, X } from "lucide-react";

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
  const [isUploadPopupVisible, setIsUploadPopupVisible] = useState(false);
  const [isDeletePopupVisible, setIsDeletePopupVisible] = useState(false);
  const [adToDelete, setAdToDelete] = useState(null);

  // Existing fetch, upload, and delete functions remain unchanged
  const fetchAds = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/ads/all`);
      const mediaAds = response.data.filter(
        (ad) =>
          ad.type &&
          (ad.type.toLowerCase() === "image" ||
            ad.type.toLowerCase() === "video"),
      );
      setAds(mediaAds);
      setFilteredAds(mediaAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!mediaFile) {
      alert("Please select a valid media file.");
      return;
    }
    try {
      setUploading(true);
      const presignedResponse = await axios.post(`${apiUrl}/api/ads/upload`, {
        fileName: mediaFile.name,
        contentType: mediaFile.type,
        title,
        description,
        type: mediaType,
      });
      const { s3Url } = presignedResponse.data;
      await axios.put(s3Url, mediaFile, {
        headers: { "Content-Type": mediaFile.type },
      });
      setIsUploadPopupVisible(false);
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

  const handleDeleteAd = async () => {
    try {
      await axios.delete(`${apiUrl}/api/ads/delete/${adToDelete}`);
      setIsDeletePopupVisible(false);
      fetchAds();
      alert("Ad deleted successfully!");
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Failed to delete ad.");
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    const results = ads.filter((ad) =>
      (ad.content?.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
    setFilteredAds(results);
  }, [searchTerm, ads]);

  return (
    <div className="min-h-screen light-bg dark:dark-bg">
      <Navbar />

      {/* Header Section */}
      <div className="mx-auto flex w-full flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-8">
        {/* Search Bar */}
        <div className="w-full sm:w-3/4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search advertisements"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-lg border px-4 pl-10 text-sm transition-colors primary-border primary-text placeholder-primary ring-primary focus:outline-none focus:ring-2 dark:bg-bg-dark dark:secondary-border dark:secondary-text dark:placeholder-secondary lg:h-14 lg:text-base"
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform neutral-text" />
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setIsUploadPopupVisible(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-300 primary-bg secondary-text hover:secondary-bg focus:ring-2 focus:ring-offset-2 sm:w-1/4 lg:h-14 lg:text-base"
        >
          <Upload className="h-5 w-5" />
          Upload Media
        </button>
      </div>

      {/* Upload Media Popup */}
      {isUploadPopupVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 rounded-lg p-6 shadow-xl light-bg dark:dark-bg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold primary-text dark:secondary-text">
                Upload Media
              </h2>
              <button
                onClick={() => setIsUploadPopupVisible(false)}
                className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 neutral-text" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium primary-text dark:secondary-text">
                  Media Type
                </label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm primary-border primary-text dark:bg-bg-dark dark:secondary-border dark:secondary-text"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium primary-text dark:secondary-text">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm primary-border primary-text dark:bg-bg-dark dark:secondary-border dark:secondary-text"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium primary-text dark:secondary-text">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm primary-border primary-text dark:bg-bg-dark dark:secondary-border dark:secondary-text"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium primary-text dark:secondary-text">
                  Media File
                </label>
                <input
                  type="file"
                  accept={mediaType === "image" ? "image/*" : "video/*"}
                  onChange={(e) => setMediaFile(e.target.files[0])}
                  className="w-full rounded-lg border px-3 py-2 text-sm primary-border primary-text dark:bg-bg-dark dark:secondary-border dark:secondary-text"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadPopupVisible(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium neutral-bg neutral-text hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg px-4 py-2 text-sm font-medium primary-bg secondary-text hover:secondary-bg disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {isDeletePopupVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 rounded-lg p-6 shadow-xl light-bg dark:dark-bg">
            <h2 className="mb-2 text-xl font-bold primary-text dark:secondary-text">
              Confirm Delete
            </h2>
            <p className="mb-6 neutral-text">
              Are you sure you want to delete this ad? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeletePopupVisible(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium neutral-bg neutral-text hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAd}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Ads Grid */}
      <div className="p-4 sm:p-6 lg:p-8">
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => (
              <div
                key={ad.adId}
                className="group relative overflow-hidden rounded-lg border shadow-sm transition-all duration-300 primary-border light-bg hover:-translate-y-1 hover:shadow-lg dark:secondary-border dark:dark-bg"
              >
                <button
                  onClick={() => {
                    setAdToDelete(ad.adId);
                    setIsDeletePopupVisible(true);
                  }}
                  className="absolute right-3 top-3 rounded-full bg-red-500 p-2 text-white opacity-0 shadow-sm transition-opacity duration-200 hover:bg-red-600 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="aspect-video overflow-hidden">
                  {ad.type.toLowerCase() === "image" ? (
                    <img
                      src={ad.content?.src}
                      alt={ad.content?.title || "Untitled"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      controls
                      src={ad.content?.src}
                      className="h-full w-full"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-lg font-semibold primary-text dark:secondary-text">
                    {ad.content?.title || "Untitled"}
                  </h3>
                  <p className="mb-2 text-sm neutral-text">
                    {ad.content?.description || "No description provided."}
                  </p>
                  <p className="text-xs neutral-text">ID: {ad.adId}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-center neutral-text">No advertisements found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdUnit;
