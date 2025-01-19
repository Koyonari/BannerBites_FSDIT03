// Define the boundaries of your advertisements
const adsBoundaries = [
    {
      id: "ad1",
      topLeftX: 300,
      topLeftY: 400,
      width: 500,
      height: 300,
    },
    {
      id: "ad2",
      topLeftX: 1200,
      topLeftY: 200,
      width: 400,
      height: 200,
    },
  ];
  
  // Function to determine if a gaze point is within any ad boundary
  const isGazeWithinAd = (gazeData) => {
    const { x, y } = gazeData;
    let gazedAdId = null;
  
    for (let ad of adsBoundaries) {
      const adLeft = ad.topLeftX;
      const adRight = adLeft + ad.width;
      const adTop = ad.topLeftY;
      const adBottom = adTop + ad.height;
  
      if (x >= adLeft && x <= adRight && y >= adTop && y <= adBottom) {
        gazedAdId = ad.id;
        break; // Stop as soon as we find the ad being gazed at
      }
    }
  
    return gazedAdId;
  };
  
  // Example of how you might use this function when gaze data is received
  const processGazeData = (gazeData) => {
    const gazedAdId = isGazeWithinAd(gazeData);
  
    if (gazedAdId) {
      console.log(`User is viewing advertisement with ID: ${gazedAdId}`);
    } else {
      console.log("User is not viewing any advertisement");
    }
  };
  
  // Example gaze data
  const gazeData = { x: 499, y: 500 }; // Replace this with the actual gaze data received
  processGazeData(gazeData);
  