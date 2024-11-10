import webgazer from "webgazer";

class WebGazerSingleton {
  static instance = null;

  static initialize(onGazeListener) {
    if (this.instance) return; // Prevent reinitialization

    // You may need to customize the initialization options based on the fork
    webgazer
      .setRegression("ridge") // Example: using ridge regression (verify if options differ)
      .setTracker("TFFacemesh") // Example: using TFFacemesh as the tracker
      .showPredictionPoints(true) // Assuming there might be a modified prediction point feature
      .setGazeListener((data, elapsedTime) => {
        if (data) {
          onGazeListener(data);
        }
      })
      .begin()
      .then(() => {
        console.log("[WebGazerSingleton] Initialized successfully.");
        this.instance = webgazer;
      })
      .catch((err) => {
        console.error("[WebGazerSingleton] Initialization error:", err);
      });
  }

  static end() {
    if (this.instance) {
      webgazer.end();
      console.log("[WebGazerSingleton] Ended successfully.");
      this.instance = null;
    }
  }
}

export default WebGazerSingleton;
