// src/utils/WebGazerSingleton.js

class WebGazerSingleton {
  static instance = null;
  static modelPreloaded = false;
  static trackingStarted = false;

  static async preload() {
    if (this.modelPreloaded) {
      console.log("[WebGazerSingleton] Model already preloaded.");
      return;
    }
    try {
      console.log("[WebGazerSingleton] Preloading model...");
      const { default: webgazer } = await import("webgazer");

      webgazer
        .setRegression("weightedRidge") // or "threadedRidge"
        .setTracker("TFFacemesh")
        .saveDataAcrossSessions(true);

      this.modelPreloaded = true;
      console.log("[WebGazerSingleton] Model preloaded.");
    } catch (error) {
      console.error("[WebGazerSingleton] Preload error:", error);
      throw new Error("Failed to preload WebGazer model.");
    }
  }

  static async initialize(onGazeListener = null) {
    // If already tracking, just update the listener
    if (this.instance && this.trackingStarted) {
      console.log("[WebGazerSingleton] Already tracking. Updating listener if provided.");
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data);
        });
      }
      return this.instance;
    }

    if (!this.modelPreloaded) {
      await this.preload();
    }

    try {
      const { default: webgazer } = await import("webgazer");

      if (!this.instance) {
        this.instance = webgazer;
        // Re-apply config
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

      // Catch any errors from .begin()
      await this.instance.begin().catch((err) => {
        console.error("[WebGazerSingleton] webgazer.begin() error:", err);
        throw err;
      });

      this.trackingStarted = true;
      console.log("[WebGazerSingleton] Tracking started successfully.");
      return this.instance;
    } catch (error) {
      console.error("[WebGazerSingleton] Initialization error:", error);
      throw new Error("Failed to initialize WebGazer.");
    }
  }

  static end() {
    if (this.instance) {
      this.instance.clearGazeListener();
      this.instance.end();
      this.instance = null;
      this.trackingStarted = false;
      console.log("[WebGazerSingleton] Ended successfully.");
    } else {
      console.warn("[WebGazerSingleton] No active instance to end.");
    }
  }
}

export default WebGazerSingleton;
