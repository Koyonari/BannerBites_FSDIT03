<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useState, useEffect, useRef } from "react";
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import CollapsibleSidebar from "./CollapsibleSidebar";
import GridCell from "./GridCell";
import EditModal from "./EditModal";
import ScheduleModal from "./ScheduleModal";
import SaveLayoutModal from "./SaveLayoutModal";
import SelectionModePopup from "./SelectionModePopup";
import { MoveLeft, Merge, Check, CircleHelp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
<<<<<<< HEAD
=======
import DeleteConfirmationModal from "../Modal/DeleteConfirmationModal";
const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b

// Main AdCanvas component, responsible for facilitating CRUD operations on ad layouts
const AdCanvas = () => {
<<<<<<< HEAD
  const [showHelp, setShowHelp] = useState(false);
  const [rows, setRows] = useState(2);
  const [columns, setColumns] = useState(3);
  const totalCells = rows * columns;
=======
  // Layout Selection State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [layouts, setLayouts] = useState([]); // List of available layouts
  // eslint-disable-next-line
  const [isSelectingLayout, setIsSelectingLayout] = useState(true); // Flag for layout selection mode
  const [selectedLayout, setSelectedLayout] = useState(null); // Currently selected layout
  // eslint-disable-next-line
  const [isSavedLayout, setIsSavedLayout] = useState(false); // Tracks if the layout is saved
  // New state to hold ad details
  const [adDetailsMap, setAdDetailsMap] = useState({});
  const [removedAds, setRemovedAds] = useState([]);
  // Hint and Help State
  const [showHelp, setShowHelp] = useState(false); // Toggle for displaying help hints

  // Grid Layout Configuration State
  const [rows, setRows] = useState(2); // Number of rows in the grid
  const [columns, setColumns] = useState(3); // Number of columns in the grid
  const totalCells = rows * columns; // Total cells in grid based on rows & columns
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
  const [gridItems, setGridItems] = useState(
    // Array representing each grid cell's data
    Array.from({ length: totalCells }, () => ({
      scheduledAds: [],
      isMerged: false,
      hidden: false,
      rowSpan: 1,
      colSpan: 1,
    })),
  );
<<<<<<< HEAD
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [selectedMergedCells, setSelectedMergedCells] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [currentScheduleAd, setCurrentScheduleAd] = useState(null);
  const [isNamingLayout, setIsNamingLayout] = useState(false);
  const navigate = useNavigate();

=======

  // Sidebar
  const handleSidebarStateChange = (isOpen) => {
    setSidebarOpen(isOpen);
  };

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Controls delete modal visibility
  const [layoutToDelete, setLayoutToDelete] = useState(null); // Layout currently selected for deletion
  const deleteButtonRef = useRef(null); // Reference to the delete button element

  // Editing State for Layouts
  const [isEditing, setIsEditing] = useState(false); // Toggles layout editing mode
  const [currentAd, setCurrentAd] = useState(null); // Currently selected ad for editing
  const [selectedCells, setSelectedCells] = useState([]); // List of selected cells for actions
  const [selectedMergedCells, setSelectedMergedCells] = useState([]); // Merged cells selection
  const [isSelectionMode, setIsSelectionMode] = useState(false); // Toggles cell selection mode

  // Ad Scheduling State
  const [isScheduling, setIsScheduling] = useState(false); // Toggles ad scheduling mode
  const [currentScheduleAd, setCurrentScheduleAd] = useState(null); // Currently selected ad for scheduling

  // Layout Naming State
  const [isNamingLayout, setIsNamingLayout] = useState(false); // Toggles layout naming mode

  // Alert Configuration State
  const [alertConfig, setAlertConfig] = useState({
    // Configuration for alerts
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Function to show an alert message
  const showAlert = (message, title = "Alert", type = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  // Function to close the alert message
  const navigate = useNavigate();

  // Use Effect to handle the selection of a layout
  useEffect(() => {
    if (selectedLayout) {
      console.log("Retrieved Layout:", selectedLayout);

      const totalCells = selectedLayout.rows * selectedLayout.columns;

      const newGridItems = Array.from({ length: totalCells }, (_, index) => {
        const item = selectedLayout.gridItems.find((gi) => gi.index === index);

        if (item) {
          // Process scheduledAds to ensure they have adId
          const scheduledAds = (item.scheduledAds || []).map((scheduledAd) => ({
            ...scheduledAd,
            id: scheduledAd.id || uuidv4(),
            adId: scheduledAd.adId, // Ensure adId is set
            // Remove nested ad object if present
          }));

          return {
            ...item,
            scheduledAds,
            isMerged: item.isMerged || false,
            hidden: item.hidden || false,
            rowSpan: item.rowSpan || 1,
            colSpan: item.colSpan || 1,
            mergeDirection: item.mergeDirection || null,
            selectedCells: item.selectedCells || [],
          };
        } else {
          return {
            index,
            row: Math.floor(index / selectedLayout.columns),
            column: index % selectedLayout.columns,
            scheduledAds: [],
            isMerged: false,
            hidden: false,
            rowSpan: 1,
            colSpan: 1,
            mergeDirection: null,
            selectedCells: [],
          };
        }
      });

      setRows(selectedLayout.rows);
      setColumns(selectedLayout.columns);
      setGridItems(newGridItems);
      console.log("Updated Grid Items State:", newGridItems);
      setIsSelectingLayout(false);

      // Move fetchAdDetails inside useEffect
      const fetchAdDetails = async (gridItems) => {
        try {
          // Collect all unique adIds from scheduledAds
          const adIdsSet = new Set();
          gridItems.forEach((item) => {
            item.scheduledAds.forEach((scheduledAd) => {
              if (scheduledAd.adId) {
                adIdsSet.add(scheduledAd.adId);
              }
            });
          });
          const adIds = Array.from(adIdsSet);

          if (adIds.length === 0) {
            return;
          }

          // Fetch ad details from the backend
          const response = await axios.post(`${apiUrl}/api/ads/batchGet`, {
            adIds,
          });
          const ads = response.data;

          // Create a map of adId to ad details
          const adsMap = {};
          ads.forEach((ad) => {
            adsMap[ad.adId] = ad;
          });

          setAdDetailsMap(adsMap);

          // Attach ad details to scheduledAds
          const updatedGridItems = gridItems.map((item) => {
            const updatedScheduledAds = item.scheduledAds.map(
              (scheduledAd) => ({
                ...scheduledAd,
                ad: adsMap[scheduledAd.adId] || null,
              }),
            );
            return {
              ...item,
              scheduledAds: updatedScheduledAds,
            };
          });

          setGridItems(updatedGridItems);
        } catch (error) {
          console.error("Error fetching ad details:", error);
          showAlert("Failed to load ad details. Please try again.");
        }
      };

      fetchAdDetails(newGridItems);
    }
  }, [selectedLayout]);

  // Use Effect to fetch layouts from the server
  useEffect(() => {
    fetchLayouts(); // Initial fetch when the component mounts
  }, []);

  // Function to fetch layouts from the server
  const fetchLayouts = async () => {
    try {
      // Fetch layouts from the server
      const response = await axios.get("http://localhost:5000/api/layouts");
      // Filter out duplicate layouts based on layoutId
      const uniqueLayouts = response.data.filter(
        (layout, index, self) =>
          index === self.findIndex((l) => l.layoutId === layout.layoutId),
      );
      // Update the state with the fetched layouts
      setLayouts(uniqueLayouts);
    } catch (error) {
      console.error("Error fetching layouts:", error);
    }
  };

  // Function to handle the selection of a layout
  const handleSelectLayout = async (layoutId) => {
    try {
      // Fetch the layout details from the server
      const response = await axios.get(`${apiUrl}/api/layouts/${layoutId}`);
      if (response.status === 200) {
        // Update the state with the selected layout
        setSelectedLayout(response.data);
        setIsSavedLayout(true); // Set isSavedLayout to true for saved layouts
      }
    } catch (error) {
      console.error("Error fetching layout details:", error);
      showAlert("Failed to load the layout. Please try again.");
    }
  };
  // Function to handle the creation of a new layout
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
  const handleMoveLeft = () => {
    navigate(-1);
  };
  // Function to handle the creation of a new layout
  const handleOpenSelector = async () => {
    setIsNamingLayout(true);
  };

  const handleSelectCell = (index, checked) => {
    if (checked) {
      setSelectedCells((prev) => [...prev, index]);
    } else {
      setSelectedCells((prev) => prev.filter((i) => i !== index));
    }

    // Update selection mode based on current selections
    if (checked) {
      setIsSelectionMode(true);
    } else if (selectedCells.length === 1 && selectedMergedCells.length === 0) {
      setIsSelectionMode(false);
    }
  };

  // Function to handle the selection of merged cells
  const handleSelectMerged = (index, checked) => {
    if (checked) {
      setSelectedMergedCells((prev) => [...prev, index]);
    } else {
      setSelectedMergedCells((prev) => prev.filter((i) => i !== index));
    }

    // Update selection mode based on current selections
    if (checked) {
      setIsSelectionMode(true);
    } else if (selectedMergedCells.length === 1 && selectedCells.length === 0) {
      setIsSelectionMode(false);
    }
  };

  // Function to handle the creation of a new layout
  const resizeGrid = (newRows, newColumns) => {
    // Calculate the new total number of cells
    const newTotalCells = newRows * newColumns;

    // Create a new grid with the updated number of cells
    const updatedGrid = Array.from({ length: newTotalCells }, (_, index) => ({
      scheduledAds: [],
      isMerged: false,
      hidden: false,
      rowSpan: 1,
      colSpan: 1,
      index, // Include the index property to keep track of each cell position
    }));

    // Loop through the existing grid and map each cell to the new grid
    for (let i = 0; i < gridItems.length; i++) {
      const currentItem = gridItems[i];
      const currentRow = Math.floor(i / columns);
      const currentCol = i % columns;

      // Map the old position to the new grid layout if it fits
      if (currentRow < newRows && currentCol < newColumns) {
        const newIndex = currentRow * newColumns + currentCol;

        // Copy over the properties from the existing item
        updatedGrid[newIndex] = {
          ...updatedGrid[newIndex], // Keep new properties if any (e.g., default scheduledAds)
          ...currentItem, // Overwrite with current item properties
          index: newIndex, // Update the index
        };

        // Handle merged cells
        if (currentItem.isMerged && !currentItem.hidden) {
          // Calculate the dimensions of the merged cell (rowSpan)
          const newRowSpan = Math.min(
            currentItem.rowSpan,
            newRows - currentRow,
          );
          // Calculate the dimensions of the merged cell (colSpan)
          const newColSpan = Math.min(
            currentItem.colSpan,
            newColumns - currentCol,
          );
          // Update the merged cell with new dimensions
          updatedGrid[newIndex] = {
            ...updatedGrid[newIndex],
            rowSpan: newRowSpan,
            colSpan: newColSpan,
            isMerged: true,
            hidden: false,
          };

          // Update hidden cells that are part of the merged group
          // 1st loop for rows
          for (let r = 0; r < newRowSpan; r++) {
            // 2nd loop for columns
            for (let c = 0; c < newColSpan; c++) {
              if (r !== 0 || c !== 0) {
                // Skip the first cell (already updated)
                const hiddenIndex =
                  (currentRow + r) * newColumns + (currentCol + c);
                // Check if the hidden cell is within the new grid bounds
                if (hiddenIndex < newTotalCells) {
                  updatedGrid[hiddenIndex] = {
                    ...updatedGrid[hiddenIndex],
                    isMerged: true,
                    hidden: true,
                    rowSpan: 1,
                    colSpan: 1,
                  };
                }
              }
            }
          }
        }

        // Update the selectedCells for merged cells to reflect new indices
        if (currentItem.selectedCells && currentItem.isMerged) {
          // Update the selectedCells with new indices
          updatedGrid[newIndex].selectedCells = currentItem.selectedCells
            .map((idx) => {
              // Calculate the old row and column of the cell
              const oldRow = Math.floor(idx / columns);
              const oldCol = idx % columns;
              // Check if the old cell is within the new grid bounds
              if (oldRow < newRows && oldCol < newColumns) {
                return oldRow * newColumns + oldCol;
              }
              return null;
            })
            .filter((idx) => idx !== null);
        }
      }
    }

    // Update the state with the newly calculated grid
    setRows(newRows);
    setColumns(newColumns);
    setGridItems(updatedGrid);
  };

  // Function to handle the resizing of the grid
  const increaseRows = () => {
    const newRows = rows + 1;
    resizeGrid(newRows, columns);
  };

  // Function to handle the resizing of the grid
  const decreaseRows = () => {
    if (rows > 1) {
      const newRows = rows - 1;
      resizeGrid(newRows, columns);
    }
  };

  // Function to handle the resizing of the grid
  const increaseColumns = () => {
    const newColumns = columns + 1;
    resizeGrid(rows, newColumns);
  };

  // Function to handle the resizing of the grid
  const decreaseColumns = () => {
    if (columns > 1) {
      const newColumns = columns - 1;
      resizeGrid(rows, newColumns);
    }
  };

  // Function to handle the merging of cells
  const validateMerge = (selectedCells) => {
    if (selectedCells.length <= 1) {
      return false;
    }
    // Get the dimensions of the selection
    const rows = selectedCells.map((index) => Math.floor(index / columns));
    const cols = selectedCells.map((index) => index % columns);
    // Get the min and max row and column values
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    // Check for merged cells in selection
    const containsMergedCells = selectedCells.some(
      (index) => gridItems[index].isMerged && !gridItems[index].hidden,
    );

    // If trying to merge with an existing merged cell
    if (containsMergedCells) {
      // Get all merged cells involved
      const mergedCellsInSelection = selectedCells.filter(
        (index) => gridItems[index].isMerged && !gridItems[index].hidden,
      );

      // For each merged cell, get its dimensions
      for (const mergedIndex of mergedCellsInSelection) {
        const mergedCell = gridItems[mergedIndex];
        const mergedMinRow = Math.floor(mergedIndex / columns);
        const mergedMaxRow = mergedMinRow + (mergedCell.rowSpan - 1);
        const mergedMinCol = mergedIndex % columns;
        const mergedMaxCol = mergedMinCol + (mergedCell.colSpan - 1);

        // Check if the merged cell aligns with the selection
        if (
          (mergedMinRow === minRow && mergedMaxRow === maxRow) || // Vertical alignment
          (mergedMinCol === minCol && mergedMaxCol === maxCol) // Horizontal alignment
        ) {
          continue;
        } else {
          return false;
        }
      }
    }

    // Check if selection forms a valid rectangle
    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;

    // For selections that include merged cells, we need to account for their spans
    const expectedCellCount = width * height;
    const actualCellCount = selectedCells.length;

    // The actual cell count might be less than expected due to hidden cells
    if (actualCellCount > expectedCellCount) {
      return false;
    }

    // Validate that all visible cells in the rectangle are selected
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const index = row * columns + col;
        const cell = gridItems[index];

        if (cell.hidden) {
          continue; // Skip hidden cells (part of existing merged cells)
        }

        if (!selectedCells.includes(index)) {
          return false; // Missing a visible cell in the rectangle
        }
      }
    }

    return true;
  };

  // Function to handle the merging of cells
  const handleMerge = (index, direction, selectedCells = []) => {
    const updatedGrid = [...gridItems];
    // Check if the selected cell is valid
    if (!updatedGrid[index]) {
      alert("Invalid cell selection!");
      return;
    }
    // Empty array to store the indices of cells to merge
    let indicesToMerge = [];
    // Check if there are selected cells to merge
    if (selectedCells.length > 0) {
      if (!validateMerge(selectedCells)) {
        alert("Invalid merge selection. Please check your selection.");
        return;
      }
      // If the selection is valid, set the indices to merge
      indicesToMerge = selectedCells;
    } else if (direction === "horizontal" || direction === "vertical") {
      // Check if the selected cell is at the edge of the grid
      if (direction === "horizontal") {
        // Check if the cell is at the right edge
        if ((index + 1) % columns === 0) {
          alert("Cannot merge horizontally. No adjacent cell to the right.");
          return;
        }
        // Check if the cell is at the left edge
        const rightIndex = index + 1;
        if (
          // Check if the cell to the right is valid for merging
          updatedGrid[rightIndex] &&
          !updatedGrid[rightIndex].isMerged &&
          !updatedGrid[rightIndex].hidden
        ) {
          // Set the indices to merge
          indicesToMerge = [index, rightIndex];
        } else {
          alert("Cannot merge horizontally. Adjacent cell is invalid.");
          return;
        }
      } else if (direction === "vertical") {
        const bottomIndex = index + columns;
        // Check if the cell is at the bottom edge
        if (bottomIndex >= totalCells) {
          alert("Cannot merge vertically. No adjacent cell below.");
          return;
        }
        // Check if the cell is at the top edge
        if (
          // Check if the cell below is valid for merging
          updatedGrid[bottomIndex] &&
          !updatedGrid[bottomIndex].isMerged &&
          !updatedGrid[bottomIndex].hidden
        ) {
          // Set the indices to merge
          indicesToMerge = [index, bottomIndex];
        } else {
          alert("Cannot merge vertically. Adjacent cell is invalid.");
          return;
        }
      }
    }

    if (indicesToMerge.length > 0) {
      // Calculate the dimensions of the merged cell
      const rows = indicesToMerge.map((idx) => Math.floor(idx / columns));
      const cols = indicesToMerge.map((idx) => idx % columns);
      // Get the min and max row and column values
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);

      // Check if the merged cell is valid
      const mergedScheduledAds = indicesToMerge.reduce((ads, idx) => {
        return ads.concat(updatedGrid[idx].scheduledAds || []);
      }, []);
      // Create the merged cell object
      const mergedItem = {
        scheduledAds: mergedScheduledAds,
        isMerged: true,
        hidden: false,
        rowSpan: maxRow - minRow + 1,
        colSpan: maxCol - minCol + 1,
        mergeDirection: direction || "selection",
        selectedCells: indicesToMerge,
      };

      // Update the first cell with merged properties
      updatedGrid[indicesToMerge[0]] = mergedItem;

      // Hide other cells involved in the merge
      indicesToMerge.slice(1).forEach((cellIndex) => {
        updatedGrid[cellIndex] = {
          scheduledAds: [],
          isMerged: true,
          hidden: true,
          rowSpan: 1,
          colSpan: 1,
        };
      });
      // Update the state with the new grid configuration
      setGridItems(updatedGrid);
    } else {
      alert("Cannot merge the selected cells.");
    }
  };

  // Function to handle the merging of selected cells
  const handleMergeSelected = () => {
    // Case 1: Single merged cell selected - unmerge it
    if (selectedMergedCells.length === 1 && selectedCells.length === 0) {
      // Unmerge the selected merged cell
      handleUnmerge(selectedMergedCells[0]);
      setSelectedMergedCells([]);
      setIsSelectionMode(false);
      return;
    }

    // Case 2: Multiple cells selected including merged cells
    if (selectedMergedCells.length > 0) {
      const unmergedCells = selectedMergedCells.reduce((acc, index) => {
        const cell = gridItems[index];
        if (cell.selectedCells) {
          return [...acc, ...cell.selectedCells];
        }
        return [...acc, index];
      }, []);

      const allCellsToMerge = [
        ...new Set([...unmergedCells, ...selectedCells]),
      ];
      // Check if the selection forms a valid rectangle or square
      if (validateMerge(allCellsToMerge)) {
        selectedMergedCells.forEach((index) => {
          handleUnmerge(index);
        });
        // Sort the cells to merge in ascending order
        const sortedCells = [...allCellsToMerge].sort((a, b) => a - b);
        handleMerge(sortedCells[0], "selection", sortedCells);
      } else {
        alert("Selected cells must form a valid rectangle or square.");
      }
      // Reset the selection state
      setSelectedMergedCells([]);
      setSelectedCells([]);
      setIsSelectionMode(false);
      return;
    }

    // Case 3: Regular merge operation for non-merged cells
    if (selectedCells.length < 2) {
      alert("Please select at least 2 cells to merge.");
      return;
    }
    // Check if the selection forms a valid rectangle or square
    if (!validateMerge(selectedCells)) {
      alert("Selected cells must form a valid rectangle or square.");
      setSelectedCells([]);
      setIsSelectionMode(false);
      return;
    }
    // Sort the cells to merge in ascending order
    const sortedCells = [...selectedCells].sort((a, b) => a - b);
    handleMerge(sortedCells[0], "selection", sortedCells);
    setSelectedCells([]);
    setIsSelectionMode(false);
  };

  // Function to handle the unmerging of cells
  const handleUnmerge = (index) => {
    const updatedGrid = [...gridItems];
    const cell = updatedGrid[index];
    // Check if the cell is merged
    if (cell.isMerged) {
      const cellsToUnmerge = cell.selectedCells || [index];

      // Restore all hidden cells to individual cells
      cellsToUnmerge.forEach((idx) => {
        if (updatedGrid[idx]) {
          // Ensure the cell exists in the updated grid
          updatedGrid[idx] = {
            scheduledAds: [],
            isMerged: false,
            hidden: false,
            rowSpan: 1,
            colSpan: 1,
            index: idx, // Maintain correct indexing
          };
        }
      });
    }

    // Update the state
    setGridItems(updatedGrid);
  };

  // Function to handle the unmerging of selected cells
  const handleDrop = (item, index, rowIndex, colIndex) => {
    // Define the normalized item object
    const normalizedItem = {
      id: item.id || uuidv4(),
<<<<<<< HEAD
=======
      adId: item.adId || uuidv4(),
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
      type: item.type || "default",
      content: item.content || item,
      styles: item.styles || {},
    };
    // Define the scheduled ad object
    const scheduledAd = {
      item: normalizedItem,
      index,
      scheduledTime: item.scheduledTime || "00:00", // Default to "00:00"
    };
    // Create a deep copy of the gridItems state to prevent accidental state mutation
    setCurrentScheduleAd(scheduledAd);
    setIsScheduling(true);
  };

  // Function to handle the scheduling of ads
  const handleScheduleSave = (adItem, scheduledTime, index) => {
<<<<<<< HEAD
    // Validate that adItem has a content property
    if (!adItem.content) {
      console.error("AdItem is missing the 'content' property:", adItem);
      alert("Failed to schedule the ad. Missing content information.");
=======
    if (!adItem.adId) {
      console.error("AdItem is missing the 'adId' property:", adItem);
      showAlert("Failed to schedule the ad. Missing adId.");
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
      return;
    }
    const updatedGrid = [...gridItems];
    const scheduledAd = {
      id: uuidv4(),
<<<<<<< HEAD
      ad: { ...adItem, id: uuidv4() },
=======
      adId: adItem.adId,
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
      scheduledTime,
      ad: adItem, // Optionally include ad details for local use
    };
    updatedGrid[index].scheduledAds.push(scheduledAd);
    setGridItems(updatedGrid);

    // Update adDetailsMap
    setAdDetailsMap((prevMap) => ({
      ...prevMap,
      [adItem.adId]: adItem,
    }));

    setIsScheduling(false);
    setCurrentScheduleAd(null);
  };

  // Handles removing ads from a grid cell
  const handleRemove = (index, scheduledAd) => {
    const updatedGrid = [...gridItems];
    const cell = updatedGrid[index];
<<<<<<< HEAD
    // Remove the scheduled ad
=======

    // Update scheduledAds within the local grid state
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
    if (cell.scheduledAds && cell.scheduledAds.length > 0) {
      updatedGrid[index].scheduledAds = cell.scheduledAds.filter(
        (ad) => ad.id !== scheduledAd.id,
      );
    }
<<<<<<< HEAD
    if (updatedGrid[index].scheduledAds.length === 0 && cell.isMerged) {
      const cellsToUnmerge =
        cell.selectedCells && cell.selectedCells.length > 0
          ? cell.selectedCells
          : [index];
      cellsToUnmerge.forEach((idx) => {
        updatedGrid[idx] = {
          scheduledAds: [],
          isMerged: false,
          hidden: false,
          rowSpan: 1,
          colSpan: 1,
        };
      });
    }
=======

    // Add the removed ad to removedAds to track it for future deletion upon save
    setRemovedAds((prev) => [...prev, scheduledAd]);

    // Update the gridItems state
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
    setGridItems(updatedGrid);
  };

  // New function to handle the actual save after name is entered
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
<<<<<<< HEAD
        },
      );

      console.log("Layout saved successfully:", response.data);
      alert("Layout saved successfully!");
=======
        });

        // Delete scheduledAds that were marked for removal
        for (const removedAd of removedAds) {
          try {
            await axios.delete(`${apiUrl}/api/scheduledAds`, {
              data: {
                gridItemId: removedAd.gridItemId,
                scheduledTime: removedAd.scheduledTime,
              },
            });
          } catch (error) {
            console.error("Error deleting scheduled ad:", error);
          }
        }

        // Reset the removedAds state after successfully saving
        setRemovedAds([]);

        showAlert("Layout updated successfully!");
      } else {
        // Save a new layout
        await axios.post(`${apiUrl}/api/layouts/save`, cleanedLayout, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        showAlert("Layout saved successfully!");
      }

>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
      setIsNamingLayout(false);
      fetchLayouts();
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Failed to save layout. Please try again.");
    }
  };

  // Function to clean up the layout JSON before saving
  const cleanLayoutJSON = (layout) => {
    const { rows, columns, gridItems } = layout;
<<<<<<< HEAD

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
              type: ad.type.toLowerCase(),
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
      .filter((item) => item !== null); // Remove null entries

=======
    const totalCells = rows * columns;
    const cleanedGridItems = [];
    for (let index = 0; index < totalCells; index++) {
      const item = gridItems[index] || {
        index,
        row: Math.floor(index / columns),
        column: index % columns,
        scheduledAds: [],
        isMerged: false,
        hidden: false,
        rowSpan: 1,
        colSpan: 1,
        mergeDirection: null,
        selectedCells: [],
      };
      const cleanedItem = {
        index,
        row: item.row,
        column: item.column,
        scheduledAds: (item.scheduledAds || []).map((scheduledAd) => ({
          id: scheduledAd.id,
          scheduledTime: scheduledAd.scheduledTime,
          adId: scheduledAd.adId,
          ad: scheduledAd.ad, // Include the ad object
        })),
        isMerged: item.isMerged,
        rowSpan: item.rowSpan,
        colSpan: item.colSpan,
        mergeDirection: item.mergeDirection,
        selectedCells: item.selectedCells,
        hidden: item.hidden,
      };
      cleanedGridItems.push(cleanedItem);
    }
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
    return {
      layoutId: layout.layoutId,
      name: layout.name,
      rows,
      columns,
      gridItems: cleanedGridItems,
    };
  };

  // Function to handle the editing of ads
  const handleEdit = (index, scheduledAd) => {
    // Ensure ad details are present
    const adDetails = scheduledAd.ad || adDetailsMap[scheduledAd.adId];
    if (!adDetails) {
      showAlert("Ad details not found for editing.");
      return;
    }
    setCurrentAd({
      index,
      scheduledAd: {
        ...scheduledAd,
        ad: adDetails,
      },
    });
    setIsEditing(true);
  };

  // Function to find the main cell index for a hidden cell
  const getMainCellIndex = (hiddenCellIndex) => {
    return gridItems.findIndex((item) => {
      return (
        !item.hidden &&
        item.isMerged &&
        item.selectedCells &&
        item.selectedCells.includes(hiddenCellIndex)
      );
    });
  };

  // Function to handle saving the edited ad
  const handleSave = (updatedAdData, updatedScheduledTime) => {
<<<<<<< HEAD
    const updatedGrid = [...gridItems];
    const scheduledAds = updatedGrid[currentAd.index].scheduledAds;
    const adIndex = scheduledAds.findIndex(
      (ad) => ad.id === currentAd.scheduledAd.id,
    );
    if (adIndex !== -1) {
      scheduledAds[adIndex] = {
        ...scheduledAds[adIndex],
        ad: {
          ...scheduledAds[adIndex].ad,
          content: updatedAdData.content,
          styles: updatedAdData.styles,
        },
        scheduledDateTime: updatedScheduledTime,
      };
      updatedGrid[currentAd.index].scheduledAds = scheduledAds;
      setGridItems(updatedGrid);
    }
=======
    setGridItems((prevGridItems) => {
      const updatedGrid = [...prevGridItems];
      let mainIndex = currentAd.index;
      if (updatedGrid[mainIndex].hidden) {
        mainIndex = getMainCellIndex(mainIndex);
        if (mainIndex === -1) {
          showAlert("Could not find the main cell for saving.");
          return prevGridItems;
        }
      }
      const cellToUpdate = { ...updatedGrid[mainIndex] };
      const scheduledAds = cellToUpdate.scheduledAds.map((ad) =>
        ad.id === currentAd.scheduledAd.id
          ? {
              ...ad,
              scheduledTime: updatedScheduledTime,
              ad: {
                ...ad.ad,
                ...updatedAdData,
              },
            }
          : ad,
      );
      cellToUpdate.scheduledAds = scheduledAds;
      updatedGrid[mainIndex] = cellToUpdate;

      // Update adDetailsMap
      setAdDetailsMap((prevMap) => ({
        ...prevMap,
        [updatedAdData.adId]: updatedAdData,
      }));

      return updatedGrid;
    });
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
    setIsEditing(false);
    setCurrentAd(null);
  };

<<<<<<< HEAD
=======
  // Function to handle opening the delete confirmation modal
  const handleDeleteLayoutClick = (layoutId, buttonRef) => {
    // Set the layout to delete and open the modal
    setLayoutToDelete(layoutId);
    setIsDeleteModalOpen(true);
    deleteButtonRef.current = buttonRef;
  };

  // Function to confirm deletion
  const handleConfirmDelete = async () => {
    if (layoutToDelete) {
      try {
        // Use axios to send a DELETE request
        const response = await axios.delete(
          `http://localhost:5000/api/layouts/${layoutToDelete}`,
        );

        // Check if the request was successful
        if (response.status === 200) {
          // Remove the deleted layout from the state
          setLayouts((prevLayouts) =>
            prevLayouts.filter((layout) => layout.layoutId !== layoutToDelete),
          );

          // Clear the canvas if the deleted layout was the currently selected one
          if (selectedLayout && selectedLayout.layoutId === layoutToDelete) {
            setSelectedLayout(null);
            setRows(2); // Reset to initial value of rows
            setColumns(3); // Reset to initial value of columns
            setGridItems(
              Array.from({ length: 2 * 3 }, () => ({
                scheduledAds: [],
                isMerged: false,
                hidden: false,
                rowSpan: 1,
                colSpan: 1,
              })),
            ); // Create a new empty 2x3 grid
          }

          // Close the delete modal and clear layoutToDelete state
          setIsDeleteModalOpen(false);
          setLayoutToDelete(null);
        }
      } catch (error) {
        console.error("Error deleting layout:", error);
      }
    }
  };

  // Function to cancel deletion
  const handleCancelDelete = () => {
    // Close the delete modal and clear layoutToDelete state
    setIsDeleteModalOpen(false);
    // Clear the layoutToDelete state
    setLayoutToDelete(null);
  };

>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
  // Tooltip styles
  const tooltipStyle = {
    backgroundColor: "rgb(255, 255, 255)",
    color: "black",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 1), 0 2px 4px -1px rgba(0, 0, 0, 1)",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "14px",
    zIndex: 1000,
  };

  const tooltipPropsRight = {
    className: "custom-tooltip",
    style: tooltipStyle,
    isOpen: showHelp,
    place: "right",
  };
  const tooltipPropsTop = {
    className: "custom-tooltip",
    style: tooltipStyle,
    isOpen: showHelp,
    place: "top",
  };

  // Tooltip information
  const tooltips = {
    addRows: "Click + to add rows",
    remRows: "Click - to remove rows",
    addCols: "Click + to add columns",
    remCols: "Click - to remove columns",
    sidebar: "Drag & drop element to add to grid",
    merge: "Click while selecting multiple cells to merge",
  };

  const isMergeButtonActive =
    selectedCells.length >= 2 || selectedMergedCells.length >= 1;

  const mergeButtonTooltip =
    selectedMergedCells.length === 1
      ? "Click to merge/unmerge selected cells"
      : "Click to merge/unmerge selected cells";

  let aspectRatio = "";
  const difference = columns - rows;

  if (difference === 0) {
    aspectRatio = "1:1";
  } else {
    // Calculate the base aspect ratio and increment/decrement by 5 for each step away from 1:1
    const widthRatio = 16 + (Math.abs(difference) - 1) * 5;
    const heightRatio = 9;

    if (difference > 0) {
      // If columns > rows, we use width:height format (e.g., 16:9, 21:9)
      aspectRatio = `${widthRatio}:${heightRatio}`;
    } else {
      // If rows > columns, we use height:width format (e.g., 9:16, 9:21)
      aspectRatio = `${heightRatio}:${widthRatio}`;
    }
  }

  // Responsive Ad Canvas with Sidebar
  useEffect(() => {
    const updateDimensions = () => {
      setRatio(window.innerHeight / window.innerWidth);
    };
    window.addEventListener("resize", updateDimensions);
    updateDimensions();
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const isVertical = ratio > 1;

  return (
<<<<<<< HEAD
    <div className="ad-canvas flex w-full flex-col items-center justify-center text-center">
      <div className="absolute right-4 top-[calc(6rem+1rem)] z-10">
        <CircleHelp
          className={`z-0 h-6 w-6 cursor-pointer transition-colors duration-200 ${
            showHelp ? "text-orange-500" : "text-gray-600"
          }`}
          fill={showHelp ? "#FFFFFF" : "#D9D9D9"}
          strokeWidth={2}
          onClick={() => setShowHelp(!showHelp)}
        />
      </div>
      <div className="flex w-full max-w-[80vw] flex-row items-stretch justify-center gap-2">
        {/* Decrease Columns button */}
        <div className="group flex flex-col justify-center">
          <div
            id="remCols"
            data-tooltip-id="remCols-tooltip"
            data-tooltip-content={tooltips.remCols}
            onClick={decreaseColumns}
            className="flex h-5/6 w-4 items-center justify-center rounded-lg bg-gray-300 text-center transition-all duration-200 hover:cursor-pointer hover:bg-gray-400 md:w-2 md:overflow-hidden md:group-hover:w-8 lg:w-1"
          >
            <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
              -
            </span>
          </div>
        </div>

        {/* Grid Container with aspect ratio wrapper */}
        <div className="flex w-80 flex-1 flex-col">
          {/* Decrease Rows button */}
          <div className="group py-2">
            <div
              id="remRows"
              data-tooltip-id="remRows-tooltip"
              data-tooltip-content={tooltips.remRows}
              onClick={decreaseRows}
              className="flex h-4 w-full items-center justify-center rounded-lg bg-gray-300 text-center transition-all duration-200 hover:cursor-pointer hover:bg-gray-400 md:h-2 md:overflow-hidden md:group-hover:h-8 lg:h-1"
            >
              <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                -
              </span>
            </div>
          </div>

          {/* Aspect ratio container */}
          <div className="relative h-full w-full pb-[56.5%] md:pb-[30%] lg:pb-[45%] 2xl:pb-[50%]">
            {/* Grid cells container */}
            <div
              className="absolute left-0 top-0 grid h-full w-full auto-rows-fr gap-2.5"
              style={{
                gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows || 3}, minmax(0, 1fr))`,
                gridAutoFlow: "dense",
                "--rows": rows,
                "--columns": columns,
              }}
            >
              {gridItems.map((item, index) => {
                const rowIndex = Math.floor(index / columns);
                const colIndex = index % columns;
                return (
                  <GridCell
                    key={index}
                    index={index}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    item={item}
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                    onEdit={handleEdit}
                    onMerge={handleMerge}
                    isSelected={selectedCells.includes(index)}
                    onSelect={handleCellSelection}
                    isSelectionMode={isSelectionMode}
                    setIsSelectionMode={setIsSelectionMode}
                    columns={columns}
                    totalCells={totalCells}
                    onUnmerge={handleUnmerge}
                    showHelp={showHelp}
                  />
                );
              })}
            </div>
          </div>

          {/* Increase Rows button */}
          <div className="group py-2">
            <div
              id="addRows"
              data-tooltip-id="addRows-tooltip"
              data-tooltip-content={tooltips.addRows}
              onClick={increaseRows}
              className="flex h-4 w-full items-center justify-center rounded-lg bg-gray-300 text-center transition-all duration-200 hover:cursor-pointer hover:bg-gray-400 md:h-2 md:overflow-hidden md:group-hover:h-8 lg:h-1"
            >
              <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                +
              </span>
            </div>
          </div>
        </div>

        {/* Increase Columns button */}
        <div className="group flex flex-col justify-center">
          <div
            id="addCols"
            data-tooltip-id="addCols-tooltip"
            data-tooltip-content={tooltips.addCols}
            onClick={increaseColumns}
            className="flex h-5/6 w-4 items-center justify-center rounded-lg bg-gray-300 text-center transition-all duration-200 hover:cursor-pointer hover:bg-gray-400 md:w-2 md:overflow-hidden md:group-hover:w-8 lg:w-1"
          >
            <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
              +
            </span>
          </div>
        </div>
      </div>

      {/* Popup when in selection mode */}
      <SelectionModePopup isVisible={isSelectionMode} />

      {/* Sidebar */}
      <Sidebar />

      {/* Navigation buttons */}
      <div className="mx-auto flex w-4/5 flex-row justify-between py-4 lg:py-8">
        <MoveLeft
          onClick={handleMoveLeft}
          className="h-8 w-16 rounded-lg bg-orange-500 py-1 text-white hover:cursor-pointer sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-2"
        />

=======
    <div className="flex h-full max-w-[100vw] flex-col overflow-y-auto overflow-x-hidden light-bg dark:dark-bg">
      <div
        className={`flex ${isVertical ? "flex-col" : "flex-row"} min-h-full w-full`}
      >
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
        <div
          className={`flex flex-col ${
            isVertical
              ? `${sidebarOpen ? "h-[50vh]" : "h-[66.666667%]"} w-full transition-all duration-300`
              : "h-full w-full"
          }`}
        >
<<<<<<< HEAD
          <Merge
            onClick={handleMergeSelected}
            disabled={!isMergeButtonActive}
            className={`h-8 w-16 rounded-lg py-2 text-white transition-colors duration-300 sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-3.5 ${
              !isMergeButtonActive
                ? "cursor-not-allowed bg-gray-400"
                : "bg-orange-500 hover:cursor-pointer"
            }`}
          />
        </div>

        <Check
          onClick={handleOpenSelector}
          className="h-8 w-16 rounded-lg bg-orange-500 py-1.5 text-white hover:cursor-pointer sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-3"
        />
      </div>

      {/* Hint/tooltip components */}
=======
          <div
            className={`transition-all duration-300 ${
              isVertical
                ? "mx-auto w-[90vw]"
                : sidebarOpen
                  ? "ml-[27vw] w-[65vw] px-4"
                  : "ml-[5vw] w-[90vw]"
            } flex min-h-full flex-col items-center overflow-hidden`}
          >
            {/* Aspect Ratio */}
            <div className="mt-24 text-3xl font-bold primary-text dark:secondary-text md:mt-28">
              Current Aspect Ratio: {aspectRatio}
            </div>

            {/* Help Icon */}
            <div className="absolute right-4 top-[calc(9rem+1rem)] z-10 xl:top-[calc(9rem+3rem)]">
              <CircleHelp
                className={`z-0 h-6 w-6 cursor-pointer transition-colors duration-200 xl:h-12 xl:w-12 ${
                  showHelp ? "accent-text" : "neutral-text"
                }`}
                fill={showHelp ? "#FFFFFF" : "#D9D9D9"}
                strokeWidth={2}
                onClick={() => setShowHelp(!showHelp)}
              />
            </div>

            {/* Grid cells */}
            <div className="relative flex w-full max-w-[75vw] flex-col items-center">
              <div className="flex w-full flex-row items-stretch justify-center gap-2">
                {/* Decrease Columns button */}
                <div className="group flex flex-col justify-center">
                  <div
                    id="remCols"
                    data-tooltip-id="remCols-tooltip"
                    data-tooltip-content={tooltips.remCols}
                    onClick={decreaseColumns}
                    className="flex h-5/6 w-4 items-center justify-center rounded-lg text-center transition-all duration-200 neutral-bg hover:cursor-pointer hover:neutralalt-bg md:w-2 md:overflow-hidden md:group-hover:w-8 lg:w-1"
                  >
                    <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                      -
                    </span>
                  </div>
                </div>

                {/* Grid Container */}
                <div className="flex w-80 flex-1 flex-col">
                  {/* Decrease Rows button */}
                  <div className="group py-2">
                    <div
                      id="remRows"
                      data-tooltip-id="remRows-tooltip"
                      data-tooltip-content={tooltips.remRows}
                      onClick={decreaseRows}
                      className="flex h-4 w-full items-center justify-center rounded-lg text-center transition-all duration-200 neutral-bg hover:cursor-pointer hover:neutralalt-bg md:h-2 md:overflow-hidden md:group-hover:h-8 lg:h-1"
                    >
                      <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                        -
                      </span>
                    </div>
                  </div>

                  {/* Aspect ratio container */}
                  <div className="relative h-full w-full pb-[56.5%] md:pb-[45%] lg:pb-[50%]">
                    {/* Grid cells container */}
                    <div
                      className="absolute left-0 top-0 grid h-full w-full auto-rows-fr gap-2.5"
                      style={{
                        gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${rows || 3}, minmax(0, 1fr))`,
                        gridAutoFlow: "dense",
                        "--rows": rows,
                        "--columns": columns,
                      }}
                    >
                      {gridItems.map((item, index) => {
                        const rowIndex = Math.floor(index / columns);
                        const colIndex = index % columns;
                        return (
                          <GridCell
                            key={index}
                            index={index}
                            rowIndex={rowIndex}
                            colIndex={colIndex}
                            item={item}
                            onDrop={handleDrop}
                            onRemove={handleRemove}
                            onEdit={handleEdit}
                            onMerge={handleMerge}
                            onUnmerge={handleUnmerge}
                            onSelect={handleSelectCell} // For individual cells
                            onSelectMerged={handleSelectMerged} // For merged cells
                            isSelectionMode={isSelectionMode}
                            setIsSelectionMode={setIsSelectionMode}
                            selectedCells={selectedCells}
                            selectedMergedCells={selectedMergedCells} // Pass selectedMergedCells
                            columns={columns}
                            totalCells={totalCells}
                            showHelp={showHelp}
                            getMainCellIndex={getMainCellIndex}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Increase Rows button */}
                  <div className="group py-2">
                    <div
                      id="addRows"
                      data-tooltip-id="addRows-tooltip"
                      data-tooltip-content={tooltips.addRows}
                      onClick={increaseRows}
                      className="flex h-4 w-full items-center justify-center rounded-lg text-center transition-all duration-200 neutral-bg hover:cursor-pointer hover:neutralalt-bg md:h-2 md:overflow-hidden md:group-hover:h-8 lg:h-1"
                    >
                      <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                        +
                      </span>
                    </div>
                  </div>
                </div>

                {/* Increase Columns button */}
                <div className="group flex flex-col justify-center">
                  <div
                    id="addCols"
                    data-tooltip-id="addCols-tooltip"
                    data-tooltip-content={tooltips.addCols}
                    onClick={increaseColumns}
                    className="flex h-5/6 w-4 items-center justify-center rounded-lg text-center transition-all duration-200 neutral-bg hover:cursor-pointer hover:neutralalt-bg md:w-2 md:overflow-hidden md:group-hover:w-8 lg:w-1"
                  >
                    <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                      +
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="mb-[5vh] mt-[5vh] flex w-11/12 flex-row justify-between">
                <MoveLeft
                  onClick={handleMoveLeft}
                  className="h-8 w-16 rounded-lg py-1 primary-bg secondary-text hover:cursor-pointer hover:secondary-bg sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-2"
                />

                <div
                  id="merge"
                  data-tooltip-id="merge-tooltip"
                  data-tooltip-content={mergeButtonTooltip}
                >
                  <Merge
                    onClick={handleMergeSelected}
                    disabled={!isMergeButtonActive}
                    className={`h-8 w-16 rounded-lg py-2 transition-colors duration-300 secondary-text sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-3.5 ${
                      !isMergeButtonActive
                        ? "cursor-not-allowed neutralalt-bg"
                        : "primary-bg hover:cursor-pointer hover:secondary-bg"
                    }`}
                  />
                </div>

                <Check
                  onClick={handleOpenSelector}
                  className="h-8 w-16 rounded-lg py-1.5 primary-bg secondary-text hover:cursor-pointer hover:secondary-bg sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-3"
                />
              </div>
            </div>

            {/* Selection mode popup */}
            <SelectionModePopup isVisible={isSelectionMode} />
          </div>

          <div
            className={`flex ${
              isVertical
                ? `${sidebarOpen ? "h-[50vh]" : "h-[33.333333%]"} w-full`
                : "h-full"
            } transition-all duration-300`}
          >
            <CollapsibleSidebar
              layouts={layouts}
              onSelectLayout={handleSelectLayout}
              onDeleteLayoutClick={handleDeleteLayoutClick}
              onStateChange={handleSidebarStateChange}
              isVertical={isVertical}
            />
          </div>
        </div>
      </div>

      {/* Tooltips */}
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
      <Tooltip id="sidebar-tooltip" {...tooltipPropsRight} />
      <Tooltip id="merge-tooltip" {...tooltipPropsRight} />
      <Tooltip id="addRows-tooltip" {...tooltipPropsRight} />
      <Tooltip id="remRows-tooltip" {...tooltipPropsTop} />
      <Tooltip id="addCols-tooltip" {...tooltipPropsRight} />
      <Tooltip id="remCols-tooltip" {...tooltipPropsRight} />

      {/* Modals */}
      {isNamingLayout && (
        <SaveLayoutModal
          onSave={handleLayoutNameSave}
          onClose={() => setIsNamingLayout(false)}
        />
      )}
      {isEditing && currentAd && currentAd.scheduledAd && (
        <EditModal
          ad={currentAd.scheduledAd.ad}
          scheduledTime={currentAd.scheduledAd.scheduledTime}
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
          scheduledTime={currentScheduleAd.scheduledTime}
          onSave={(scheduledDateTime) =>
            handleScheduleSave(
              currentScheduleAd.item,
              scheduledDateTime,
              currentScheduleAd.index,
            )
          }
          onClose={() => {
            setIsScheduling(false);
            setCurrentScheduleAd(null);
          }}
          existingScheduledTimes={
            gridItems[currentScheduleAd.index]?.scheduledAds.map(
              (ad) => ad.scheduledTime,
            ) || []
          }
        />
      )}
<<<<<<< HEAD
=======
      {/* Alert component */}
      <StyledAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
    </div>
  );
};

export default AdCanvas;
