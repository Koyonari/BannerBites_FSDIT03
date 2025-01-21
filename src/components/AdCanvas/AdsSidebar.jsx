import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { Search, Image as ImageIcon, Video as VideoIcon } from "lucide-react";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DraggableAd = ({ ad }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "AD_ITEM",
    item: { ad },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleImageError = () => {
    console.error(`Error loading image for ad: ${ad.adId}`);
  };

  return (
    <div
      ref={drag}
      className={`flex items-center gap-2 rounded-lg bg-bg-light p-3 dark:bg-bg-dark ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="relative h-16 w-16 flex-shrink-0">
        {ad.type.toLowerCase() === "image" ? (
          <img
            src={ad.content?.src}
            alt={ad.content?.title || "Untitled"}
            className="h-16 w-16 rounded-md object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
            {ad.type.toLowerCase() === "image" ? (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            ) : (
              <VideoIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className="text-sm font-medium">{ad.content?.title || "Untitled"}</h3>
        <p className="text-xs text-gray-500">{ad.content?.description}</p>
        <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {ad.type}
        </span>
      </div>
    </div>
  );
};

const AdsSidebar = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/ads/all`);
        const data = await response.json();
        setAds(data.filter((ad) => ad.type && ["image", "video"].includes(ad.type.toLowerCase())));
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  const filteredAds = ads.filter((ad) =>
    ad.content?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search advertisements"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 pl-10 text-sm"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      </div>

      <div className="flex flex-col gap-2">
        {filteredAds.map((ad) => (
          <DraggableAd key={ad.adId} ad={ad} />
        ))}
      </div>
    </div>
  );
};

export default AdsSidebar;
