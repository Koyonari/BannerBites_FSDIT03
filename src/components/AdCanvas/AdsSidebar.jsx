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
      className={`flex cursor-move items-center gap-3 rounded-lg border p-4 shadow-sm transition-all duration-200 primary-border light-bg hover:shadow-md dark:secondary-border dark:dark-bg ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
        {ad.type.toLowerCase() === "image" ? (
          <img
            src={ad.content?.src}
            alt={ad.content?.title || "Untitled"}
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center neutral-bg dark:bg-gray-800">
            {ad.type.toLowerCase() === "image" ? (
              <ImageIcon className="h-8 w-8 neutral-text" />
            ) : (
              <VideoIcon className="h-8 w-8 neutral-text" />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col space-y-1">
        <h3 className="font-medium primary-text dark:secondary-text">
          {ad.content?.title || "Untitled"}
        </h3>
        <p className="text-sm neutral-text">
          {ad.content?.description || "No description"}
        </p>
        <span className="inline-flex w-fit items-center rounded-full bg-bg-accent/10 px-2.5 py-0.5 text-xs font-medium accent-text">
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
        setAds(
          data.filter(
            (ad) =>
              ad.type && ["image", "video"].includes(ad.type.toLowerCase()),
          ),
        );
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  const filteredAds = ads.filter((ad) =>
    ad.content?.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center primary-text dark:secondary-text">
        <div className="animate-pulse text-center">
          <div className="mb-2 text-lg font-medium">Loading ads...</div>
          <div className="text-sm neutral-text">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="sticky top-0 z-10 bg-bg-light pb-4 dark:bg-bg-dark">
        <div className="relative">
          <input
            type="text"
            placeholder="Search media"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 pl-10 text-sm transition-colors primary-border primary-text placeholder-primary ring-primary focus:outline-none focus:ring-2 dark:bg-bg-dark dark:secondary-border dark:secondary-text dark:placeholder-secondary"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform neutral-text" />
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto">
        {filteredAds.length > 0 ? (
          filteredAds.map((ad) => <DraggableAd key={ad.adId} ad={ad} />)
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm neutral-text">No media found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsSidebar;
