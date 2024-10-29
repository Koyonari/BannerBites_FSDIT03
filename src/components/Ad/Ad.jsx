import layout from "../../layout";
import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import AdCanvas from "../AdCanvas/AdCanvas";
import AdViewer from "../AdViewer/AdViewer";
import LayoutViewer from "../AdViewer/LayoutViewer";
import LocationSelector from "../LocationSelector";
import TVSelector from "../TVSelector";
import EditModal from "../AdCanvas/EditModal";
import ScheduleModal from "../AdCanvas/ScheduleModal";
import AssignLayoutTab from "../AssignLayoutTab";
import LayoutSelector from "../AdViewer/LayoutSelector";
import ErrorBoundary from "../ErrorBoundary";
import SaveLayoutModal from "../AdCanvas/SaveLayoutModal";
import Navbar from "../Navbar";
import { Check, MoveLeft, Merge } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const Ad = () => {
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedTVId, setSelectedTVId] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [currentScheduleAd, setCurrentScheduleAd] = useState(null);
  const [isNamingLayout, setIsNamingLayout] = useState(false);
  const [rows] = useState(2);
  const [columns] = useState(3);
  const totalCells = rows * columns;
  const [gridItems, setGridItems] = useState(
    Array.from({ length: totalCells }, () => ({
      scheduledAds: [],
      isMerged: false,
      hidden: false,
      rowSpan: 1,
      colSpan: 1,
    }))
  );
  const navigate = useNavigate();

  // Handle selecting a location
  const handleSelectLocation = (locationId) => {
    setSelectedLocationId(locationId);
    setSelectedTVId(null); // Reset TV selection when a new location is selected
    navigate("/tvs");
  };

  // Handle selecting a TV
  const handleSelectTV = (tvId) => {
    setSelectedTVId(tvId);
    navigate("/assign-layout");
  };

  // Handle selecting a layout
  const handleSelectLayout = (layoutId) => {
    setSelectedLayoutId(layoutId);
    setIsSelectorOpen(false);
    navigate("/layout-viewer");
  };

  // Handle going to the previous page
  const handleMoveLeft = () => {
    navigate(-1);
  };

  // In handleScheduleSave function
  const handleScheduleSave = (adItem, scheduledTime, index) => {
    const updatedGrid = [...gridItems];
    const scheduledAd = {
      id: uuidv4(),
      ad: { ...adItem, id: uuidv4() },
      scheduledTime, // Store time only
    };
    updatedGrid[index].scheduledAds.push(scheduledAd);
    setGridItems(updatedGrid);
    setIsScheduling(false);
    setCurrentScheduleAd(null);
  };

  // Handles saving an updated ad from the modal
  const handleSave = (updatedAdData, updatedScheduledDateTime) => {
    const updatedGrid = [...gridItems];
    const scheduledAds = updatedGrid[currentAd.index].scheduledAds;
    const adIndex = scheduledAds.findIndex(
      (ad) => ad.id === currentAd.scheduledAd.id
    );
    if (adIndex !== -1) {
      scheduledAds[adIndex] = {
        ...scheduledAds[adIndex],
        ad: {
          ...scheduledAds[adIndex].ad,
          content: updatedAdData.content,
          styles: updatedAdData.styles,
        },
        scheduledDateTime: updatedScheduledDateTime, // Update scheduled time
      };
      updatedGrid[currentAd.index].scheduledAds = scheduledAds;
      setGridItems(updatedGrid);
    }
    setIsEditing(false);
    setCurrentAd(null);
  };

  // New function to handle the actual save after name is entered
  const handleOpenSelector = async () => {
    setIsNamingLayout(true);
  };

  // Modified handleLayoutNameSave to navigate after successful save
  const handleLayoutNameSave = async (name) => {
    try {
      const layoutId = uuidv4();
      const layout = { rows, columns, gridItems, layoutId, name };
      const cleanedLayout = cleanLayoutJSON(layout);

      const response = await axios.post(
        "http://localhost:5000/api/saveLayout",
        cleanedLayout,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Layout saved successfully:", response.data);
      setIsNamingLayout(false);
      setSelectedLayoutId(layoutId); // Store the new layout ID
      setIsSelectorOpen(true); // Open layout selector after saving
      navigate("/ad-viewer"); // Navigate to ad-viewer
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Failed to save layout. Please try again.");
    }
  };

  const cleanLayoutJSON = (layout) => {
    const { rows, columns, gridItems } = layout;

    const filteredItems = gridItems
      .map((item, index) => {
        if (!item || item.hidden) return null;

        const row = Math.floor(index / columns);
        const column = index % columns;

        return {
          index,
          row,
          column,
          scheduledAds: item.scheduledAds.map((scheduledAd) => {
            const ad = scheduledAd.ad;
            const adData = {
              id: ad.id,
              type: ad.type,
              content: { ...ad.content },
              styles: { ...ad.styles },
            };
            return {
              id: scheduledAd.id,
              scheduledTime: scheduledAd.scheduledTime,
              ad: adData,
            };
          }),
          isMerged: item.isMerged,
          rowSpan: item.rowSpan,
          colSpan: item.colSpan,
          mergeDirection: item.mergeDirection,
          selectedCells: item.selectedCells,
        };
      })
      .filter((item) => item !== null);

    return {
      layoutId: layout.layoutId,
      name: layout.name,
      rows,
      columns,
      gridItems: filteredItems,
    };
  };

  return (
    <div>
      <Navbar />
      <div className="px-8 pt-8">
        <ErrorBoundary>
          <DndProvider backend={HTML5Backend}>
            <div>
              <Routes>
                <Route path="/" element={<AdCanvas />} />
                <Route path="ad-canvas" element={<AdCanvas />} />
                <Route
                  path="ad-viewer"
                  element={<AdViewer layout={layout} />}
                />
                <Route
                  path="/locations"
                  element={
                    <LocationSelector onSelectLocation={handleSelectLocation} />
                  }
                />
                <Route
                  path="/tvs"
                  element={
                    selectedLocationId ? (
                      <TVSelector
                        locationId={selectedLocationId}
                        onSelectTV={handleSelectTV}
                      />
                    ) : (
                      <h2>Please select a location first</h2>
                    )
                  }
                />
                <Route
                  path="/assign-layout"
                  element={
                    selectedTVId ? (
                      <AssignLayoutTab tvId={selectedTVId} />
                    ) : (
                      <h2>Please select a TV first</h2>
                    )
                  }
                />
                <Route
                  path="/layout-viewer"
                  element={<LayoutViewer layoutId={selectedLayoutId} />}
                />
                <Route path="/ad-viewer" element={<AdViewer />} />
              </Routes>
            </div>
            {isSelectorOpen && (
              <LayoutSelector
                onSelect={handleSelectLayout}
                onClose={() => setIsSelectorOpen(false)}
              />
            )}
          </DndProvider>
        </ErrorBoundary>
        <div className="flex flex-row justify-between py-4 lg:py-8 w-4/5 mx-auto">
          <MoveLeft
            onClick={handleMoveLeft}
            className="h-8 text-white bg-orange-500 rounded-lg py-1 w-24 hover:cursor-pointer"
          />
          <Merge className="h-8 text-white bg-orange-500 rounded-lg py-2 w-24 hover:cursor-pointer" />
          <Link to="ad-viewer" onClick={handleOpenSelector}>
            <Check className="h-8 text-white bg-orange-500 rounded-lg py-1.5 w-24" />
          </Link>
        </div>
      </div>

      <div>
        {/* Include the SaveLayoutModal */}
        {isNamingLayout && (
          <SaveLayoutModal
            onSave={handleLayoutNameSave}
            onClose={() => setIsNamingLayout(false)}
          />
        )}
        {isEditing && currentAd && currentAd.scheduledAd && (
          <EditModal
            ad={currentAd.scheduledAd.ad}
            onSave={handleSave}
            onClose={() => {
              setIsEditing(false);
              setCurrentAd(null);
            }}
          />
        )}
        {isScheduling && currentScheduleAd && (
          <ScheduleModal
            ad={currentScheduleAd.item}
            onSave={(scheduledDateTime) =>
              handleScheduleSave(
                currentScheduleAd.item,
                scheduledDateTime,
                currentScheduleAd.index
              )
            }
            onClose={() => {
              setIsScheduling(false);
              setCurrentScheduleAd(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Ad;
