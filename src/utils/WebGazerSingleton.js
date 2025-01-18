// src/utils/WebGazerSingleton.js
class WebGazerSingleton {
  static instance = null;
  static modelPreloaded = false;
  static trackingStarted = false;

  static async preload() {
    if (this.modelPreloaded) {
      console.log("Model already preloaded.");
      return;
    }
    try {
      const { default: webgazer } = await import("webgazer");
      // Set options as recommended by WebGazer
      webgazer
        .setRegression("weightedRidge") // or try "ridge"
        .setTracker("TFFacemesh")        // experiment with available tracker options
        .saveDataAcrossSessions(true);
      this.modelPreloaded = true;
      console.log("Model preloaded.");
    } catch (error) {
      console.error("Preload error:", error);
      throw new Error("Failed to preload WebGazer model.");
    }
  }

  static async initialize(onGazeListener = null) {
    if (this.instance && this.trackingStarted) {
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data);
        });
      }
      return this.instance;
    }

    if (!this.modelPreloaded) await this.preload();

    try {
      const { default: webgazer } = await import("webgazer");
      if (!this.instance) {
        this.instance = webgazer;
        this.instance
          .setRegression("weightedRidge")
          .setTracker("TFFacemesh")
          .saveDataAcrossSessions(true);
      }
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data);
        });
      }
      await this.instance.begin();
      this.trackingStarted = true;
      console.log("Tracking started.");
      return this.instance;
    } catch (error) {
      console.error("Initialization error:", error);
      throw new Error("Failed to initialize WebGazer.");
    }
  }

  static end() {
    if (this.instance) {
      this.instance.clearGazeListener();
      this.instance.end();
      this.instance = null;
      this.trackingStarted = false;
      console.log("Tracking ended successfully.");
    } else {
      console.warn("No active instance to end.");
    }
  }
}

export default WebGazerSingleton;
