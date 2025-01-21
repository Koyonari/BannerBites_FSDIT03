import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../Navbar";
import { Upload, Search, Trash2 } from "lucide-react"; // Import icons

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
  const [isUploadPopupVisible, setIsUploadPopupVisible] = useState(false); // For upload popup
  const [isDeletePopupVisible, setIsDeletePopupVisible] = useState(false); // For delete confirmation popup
  const [adToDelete, setAdToDelete] = useState(null); // Store the ad to delete

  // Fetch ads from the backend
  const fetchAds = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/ads/all`);
      const mediaAds = response.data.filter(
        (ad) =>
          ad.type &&
          (ad.type.toLowerCase() === "image" || ad.type.toLowerCase() === "video")
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
        headers: { "Content-Type": mediaFile.type },
      });

      // Step 3: Refresh ads after upload
      setIsUploadPopupVisible(false); // Close the upload popup
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

  // Delete an ad
  const handleDeleteAd = async () => {
    try {
      await axios.delete(`${apiUrl}/api/ads/delete/${adToDelete}`);
      setIsDeletePopupVisible(false); // Close the delete popup
      fetchAds(); // Refresh ads
      alert("Ad deleted successfully!");
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Failed to delete ad.");
    }
  };

  // Initialize ads on component mount
  useEffect(() => {
    fetchAds();
  }, []);

  // Filter ads based on search term
  useEffect(() => {
    const results = ads.filter((ad) =>
      (ad.content?.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
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
          onClick={() => setIsUploadPopupVisible(true)}
          className="h-10 w-full rounded-lg text-sm font-bold transition-all duration-300 ease-in-out primary-bg secondary-text hover:secondary-bg sm:w-1/4 lg:h-16 lg:text-lg xl:h-20 xl:text-2xl"
        >
          Upload Media
        </button>
      </div>

      {/* Upload Media Popup */}
      {isUploadPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Upload Media</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Media Type:</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Description:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Media File:</label>
                <input
                  type="file"
                  accept={mediaType === "image" ? "image/*" : "video/*"}
                  onChange={(e) => setMediaFile(e.target.files[0])}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsUploadPopupVisible(false)}
                  className="px-4 py-2 bg-gray-300 text-black rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {isDeletePopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this ad?</p>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={handleDeleteAd}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setIsDeletePopupVisible(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Ads Grid */}
      <div className="px-8 py-8 lg:px-16 xl:px-24 2xl:px-32">
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => (
              <div
                key={ad.adId}
                className="group relative overflow-hidden rounded-xl border-2 bg-white p-4 shadow-lg transition-all duration-300 ease-in-out primary-border hover:-translate-y-2 hover:shadow-xl dark:bg-gray-800"
              >
                {/* Trash Icon for Delete */}
                <button
                  onClick={() => {
                    setAdToDelete(ad.adId);
                    setIsDeletePopupVisible(true);
                  }}
                  className="absolute top-2 right-2 bg-red-500 p-2 rounded-full text-white"
                >
                  <Trash2 />
                </button>
                {/* Media Display */}
                <div className="aspect-video overflow-hidden rounded-lg">
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
                <div className="mt-4">
                  <h3 className="text-lg font-bold">
                    {ad.content?.title || "Untitled"}
                  </h3>
                  <p className="text-sm text-gray-500">Media ID: {ad.adId}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">No ads found.</p>
        )}
      </div>
    </div>
  );
};

export default AdUnit;
