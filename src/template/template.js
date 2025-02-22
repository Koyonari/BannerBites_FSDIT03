import { v4 as uuidv4 } from "uuid";

// Generate grid items with proper merging and cell properties
const generateGridItems = (rows, columns, mergedCells = []) => {
  const totalCells = rows * columns;
  const gridItems = Array.from({ length: totalCells }, (_, index) => ({
    index,
    scheduledAds: [],
    isMerged: false,
    rowSpan: 1,
    colSpan: 1,
    hidden: false,
    mergeDirection: null,
    selectedCells: [],
  }));

  // Apply merged cells configurations
  mergedCells.forEach(({ startIndex, rowSpan, colSpan, selectedCells }) => {
    if (startIndex >= totalCells) return;

    // Configure the main merged cell
    gridItems[startIndex] = {
      ...gridItems[startIndex],
      isMerged: true,
      hidden: false,
      rowSpan,
      colSpan,
      mergeDirection: "selection",
      selectedCells: selectedCells || [],
    };

    // Hide cells that are part of the merge
    if (selectedCells) {
      selectedCells.forEach((cellIndex) => {
        if (cellIndex !== startIndex && cellIndex < totalCells) {
          gridItems[cellIndex] = {
            ...gridItems[cellIndex],
            isMerged: true,
            hidden: true,
            rowSpan: 1,
            colSpan: 1,
          };
        }
      });
    }
  });

  return gridItems;
};

// Preset templates with predefined layouts
const PRESET_TEMPLATES = {
  // Default
  default16x9: {
    layoutId: uuidv4(),
    name: "Default (16:9)",
    description:
      "Perfect for sports arena displays and large outdoor billboards",
    rows: 2,
    columns: 3,
    mergedCells: [],
  },

  // Ultra-wide formats
  ultrawide32x9: {
    layoutId: uuidv4(),
    name: "Stadium Display (32:9)",
    description:
      "Perfect for sports arena displays and large outdoor billboards",
    rows: 2,
    columns: 6,
    mergedCells: [
      {
        startIndex: 0,
        rowSpan: 2,
        colSpan: 2,
        selectedCells: [0, 1, 6, 7],
      },
      {
        startIndex: 4,
        rowSpan: 2,
        colSpan: 2,
        selectedCells: [4, 5, 10, 11],
      },
    ],
  },
  ultrawide21x9: {
    layoutId: uuidv4(),
    name: "Cinema Display (21:9)",
    description:
      "Ideal for movie theater pre-show ads and ultra-wide digital signage",
    rows: 2,
    columns: 4,
    mergedCells: [
      {
        startIndex: 0,
        rowSpan: 2,
        colSpan: 2,
        selectedCells: [0, 1, 4, 5],
      },
    ],
  },

  // Standard widescreen formats
  widescreen16x9: {
    layoutId: uuidv4(),
    name: "Digital Billboard (16:9)",
    description:
      "Standard HDTV format, perfect for digital outdoor advertising",
    rows: 2,
    columns: 3,
    mergedCells: [
      {
        startIndex: 0,
        rowSpan: 2,
        colSpan: 2,
        selectedCells: [0, 1, 3, 4],
      },
      {
        startIndex: 8,
        rowSpan: 1,
        colSpan: 1,
        selectedCells: [8],
      },
    ],
  },

  // Vertical formats
  vertical9x16: {
    layoutId: uuidv4(),
    name: "Story Display (9:16)",
    description:
      "Optimized for social media stories and vertical digital signage",
    rows: 3,
    columns: 2,
    mergedCells: [
      {
        startIndex: 0,
        rowSpan: 2,
        colSpan: 1,
        selectedCells: [0, 3],
      },
    ],
  },
  dualScreen: {
    layoutId: uuidv4(),
    name: "Split Display (32:9)",
    description:
      "Designed for dual-screen installations and stretched displays",
    rows: 2,
    columns: 6,
    mergedCells: [
      {
        startIndex: 0,
        rowSpan: 2,
        colSpan: 3,
        selectedCells: [0, 1, 2, 6, 7, 8],
      },
      {
        startIndex: 3,
        rowSpan: 2,
        colSpan: 3,
        selectedCells: [3, 4, 5, 9, 10, 11],
      },
    ],
  },
  tripleScreen: {
    layoutId: uuidv4(),
    name: "Triple Display (46:9)",
    description:
      "Designed for triple-screen installations and ultra-wide displays",
    rows: 2,
    columns: 9,
    mergedCells: [
      {
        startIndex: 0,
        rowSpan: 2,
        colSpan: 3,
        selectedCells: [0, 1, 2, 9, 10, 11],
      },
      {
        startIndex: 3,
        rowSpan: 2,
        colSpan: 3,
        selectedCells: [3, 4, 5, 12, 13, 14],
      },
      {
        startIndex: 6,
        rowSpan: 2,
        colSpan: 3,
        selectedCells: [6, 7, 8, 15, 16, 17],
      },
    ],
  },
};

// Calculate selected cells for merging based on dimensions
const calculateSelectedCells = (startIndex, rowSpan, colSpan, columns) => {
  const selectedCells = [];
  const startRow = Math.floor(startIndex / columns);
  const startCol = startIndex % columns;

  for (let r = 0; r < rowSpan; r++) {
    for (let c = 0; c < colSpan; c++) {
      const currentIndex = (startRow + r) * columns + (startCol + c);
      selectedCells.push(currentIndex);
    }
  }

  return selectedCells;
};

// Resize grid while maintaining merged cells
const resizeGrid = (currentTemplate, newRows, newColumns) => {
  // eslint-disable-next-line
  const { rows: oldRows, columns: oldColumns, mergedCells } = currentTemplate;

  // Adjust merged cells for new dimensions
  const adjustedMergedCells = mergedCells
    .map((cell) => {
      const startRow = Math.floor(cell.startIndex / oldColumns);
      const startCol = cell.startIndex % oldColumns;

      // Calculate new start index based on new dimensions
      const newStartIndex = startRow * newColumns + startCol;

      // Adjust spans if they exceed new dimensions
      const adjustedRowSpan = Math.min(cell.rowSpan, newRows - startRow);
      const adjustedColSpan = Math.min(cell.colSpan, newColumns - startCol);

      // Only include merged cell if it still fits in new grid
      if (startRow < newRows && startCol < newColumns) {
        return {
          startIndex: newStartIndex,
          rowSpan: adjustedRowSpan,
          colSpan: adjustedColSpan,
          selectedCells: calculateSelectedCells(
            newStartIndex,
            adjustedRowSpan,
            adjustedColSpan,
            newColumns,
          ),
        };
      }
      return null;
    })
    .filter((cell) => cell !== null);

  return {
    ...currentTemplate,
    rows: newRows,
    columns: newColumns,
    mergedCells: adjustedMergedCells,
    gridItems: generateGridItems(newRows, newColumns, adjustedMergedCells),
  };
};

// Grid manipulation functions
const increaseRows = (template) => {
  return resizeGrid(template, template.rows + 1, template.columns);
};

const decreaseRows = (template) => {
  if (template.rows <= 1) return template;
  return resizeGrid(template, template.rows - 1, template.columns);
};

const increaseColumns = (template) => {
  return resizeGrid(template, template.rows, template.columns + 1);
};

const decreaseColumns = (template) => {
  if (template.columns <= 1) return template;
  return resizeGrid(template, template.rows, template.columns - 1);
};

// Load a preset template
const loadPresetTemplate = (templateName) => {
  const template = PRESET_TEMPLATES[templateName];
  if (!template) {
    console.error(`Template "${templateName}" not found`);
    return null;
  }

  return {
    ...template,
    gridItems: generateGridItems(
      template.rows,
      template.columns,
      template.mergedCells,
    ),
  };
};

export {
  PRESET_TEMPLATES,
  loadPresetTemplate,
  generateGridItems,
  calculateSelectedCells,
  increaseRows,
  decreaseRows,
  increaseColumns,
  decreaseColumns,
  resizeGrid,
};
