// controllers/tvController.js
const TVLayoutModel = require("../models/TVLayoutModel");

// Function to assign a layout to a TV
const assignLayoutToTV = async (req, res) => {
  const { tvId } = req.params;
  const { layoutId, assignedDate } = req.body;

  if (!layoutId || !assignedDate) {
    return res.status(400).json({ message: "LayoutId and assignedDate are required." });
  }

  try {
    await TVLayoutModel.assignLayoutToTV(tvId, layoutId, assignedDate);
    res.status(200).json({ message: "Layout assigned to TV successfully." });
  } catch (error) {
    console.error("Error assigning layout to TV:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  assignLayoutToTV,
};
