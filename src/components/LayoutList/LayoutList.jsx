import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";

const LayoutList = () => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllLayouts, setShowAllLayouts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const MOBILE_DISPLAY_LIMIT = 3;

  useEffect(() => {
    fetchLayouts();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:5000/api/layouts");
      if (!response.ok) {
        throw new Error("Failed to fetch layouts");
      }
      const data = await response.json();
      const uniqueLayouts = data.filter(
        (layout, index, self) =>
          index === self.findIndex((l) => l.layoutId === layout.layoutId),
      );
      setLayouts(uniqueLayouts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLayoutDetails = async (layoutId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:5000/api/layouts/${layoutId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch layout details");
      }
      const data = await response.json();
      setSelectedLayout(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const AdComponent = ({ type, content, styles }) => {
    let mediaUrl = content.mediaUrl || content.src;

    if (!mediaUrl && content.s3Bucket && content.s3Key) {
      const s3Region = content.s3Region || "ap-southeast-1";
      const encodeS3Key = (key) => {
        return key
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/");
      };
      const encodedS3Key = encodeS3Key(content.s3Key);
      mediaUrl = `https://${content.s3Bucket}.s3.${s3Region}.amazonaws.com/${encodedS3Key}`;
    }

    return (
      <div className="h-full overflow-hidden" style={styles}>
        {type === "text" && (
          <div className="p-4">
            <h3 className="text-lg font-semibold">{content.title}</h3>
            <p className="text-gray-600">{content.description}</p>
          </div>
        )}
        {type === "image" && (
          <div>
            <img
              src={mediaUrl}
              alt={content.title}
              className="h-auto w-full object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{content.title}</h3>
              <p className="text-gray-600">{content.description}</p>
            </div>
          </div>
        )}
        {type === "video" && (
          <div>
            <video autoPlay loop muted playsInline className="w-full">
              <source src={mediaUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{content.title}</h3>
              <p className="text-gray-600">{content.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AdViewer = ({ layout }) => {
    if (!layout) {
      return <div>No layout provided</div>;
    }

    const { rows, columns, gridItems } = layout;

    return (
      <div
        className="grid h-full w-full gap-4"
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {gridItems.map((item) => {
          if (!item || item.hidden) return null;

          const { index, row, column, scheduledAds, rowSpan, colSpan } = item;

          let adToDisplay = null;

          if (scheduledAds?.length > 0) {
            const now = new Date();
            const currentTimeString = `${now
              .getHours()
              .toString()
              .padStart(2, "0")}:${now
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;

            const availableAds = scheduledAds.filter(
              (scheduledAd) => scheduledAd.scheduledTime <= currentTimeString,
            );

            if (availableAds.length > 0) {
              adToDisplay = availableAds.reduce((latestAd, currentAd) =>
                currentAd.scheduledTime > latestAd.scheduledTime
                  ? currentAd
                  : latestAd,
              );
            } else {
              adToDisplay = scheduledAds.reduce((nextAd, currentAd) =>
                currentAd.scheduledTime < nextAd.scheduledTime
                  ? currentAd
                  : nextAd,
              );
            }
          }

          if (!adToDisplay) return null;

          const ad = adToDisplay.ad;
          const { type, content, styles } = ad;

          const gridRowStart = row + 1;
          const gridColumnStart = column + 1;
          const gridRowEnd = gridRowStart + (rowSpan || 1);
          const gridColumnEnd = gridColumnStart + (colSpan || 1);

          return (
            <div
              key={index}
              className="rounded-lg bg-white"
              style={{
                gridRow: `${gridRowStart} / ${gridRowEnd}`,
                gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
              }}
            >
              <AdComponent type={type} content={content} styles={styles} />
            </div>
          );
        })}
      </div>
    );
  };

  const visibleLayouts =
    isMobile && !showAllLayouts
      ? layouts.slice(0, MOBILE_DISPLAY_LIMIT)
      : layouts;

  const hasMoreLayouts = isMobile && layouts.length > MOBILE_DISPLAY_LIMIT;

  return (
    <div className="min-h-screen dark:bg-black">
      <Navbar />
      <div className="container mx-auto w-full p-4 md:p-12">
        <div className="flex flex-col md:min-h-[600px] md:flex-row">
          <div className="w-full md:w-[300px] md:flex-shrink-0">
            <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-black dark:text-white md:mb-0">
              <h2 className="mb-4 text-xl font-bold">Available Layouts</h2>
              {loading && !selectedLayout && (
                <div className="flex items-center justify-center p-4 text-gray-600">
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading layouts...
                </div>
              )}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
                  Error: {error}
                </div>
              )}
              <div className="space-y-2">
                {visibleLayouts.map((layout) => (
                  <button
                    key={layout.layoutId}
                    className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                      selectedLayout?.layoutId === layout.layoutId
                        ? "bg-orange-600 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => fetchLayoutDetails(layout.layoutId)}
                  >
                    {layout.name || `Layout ${layout.layoutId}`}
                  </button>
                ))}

                {hasMoreLayouts && (
                  <button
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                    onClick={() => setShowAllLayouts(!showAllLayouts)}
                  >
                    <span>
                      {showAllLayouts
                        ? "Show Less"
                        : `Show ${layouts.length - MOBILE_DISPLAY_LIMIT} More`}
                    </span>
                    <svg
                      className={`h-4 w-4 transform transition-transform ${showAllLayouts ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 md:ml-8">
            <div className="flex h-[500px] items-center justify-center rounded-lg border-8 border-gray-800 bg-black p-4 shadow-lg md:h-full md:min-h-[600px]">
              <div className="h-full w-full overflow-hidden rounded-lg bg-white shadow-inner">
                {loading && selectedLayout && (
                  <div className="flex h-full items-center justify-center p-4 text-gray-600">
                    <svg
                      className="mr-2 h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading layout preview...
                  </div>
                )}
                {selectedLayout && !loading && (
                  <AdViewer layout={selectedLayout} />
                )}
                {!selectedLayout && !loading && (
                  <div className="flex h-full items-center justify-center p-4 text-gray-500">
                    Select a layout to preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutList;
