// src/WebGazerSingleton.js

class WebGazerSingleton {
  static instance = null;

  static async initialize(onGazeListener = null) {
    if (this.instance) {
      console.log("[WebGazerSingleton] Already initialized.");
      // Optionally update the listener
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data);
        });
      }
      return this.instance;
    }

    try {
      const webgazerModule = await import("webgazer");
      const webgazer = webgazerModule.default;

      webgazer
        .setRegression("ridge")
        .setTracker("TFFacemesh")
        .saveDataAcrossSessions(true);

      // If you provide a listener, attach it.
      if (onGazeListener) {
        webgazer.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data);
        });
      }

      await webgazer.begin();
      console.log("[WebGazerSingleton] Initialized successfully.");

      this.instance = webgazer;
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
      console.log("[WebGazerSingleton] Ended successfully.");
    } else {
      console.warn("[WebGazerSingleton] No active instance to end.");
    }
  }
}

export default WebGazerSingleton;
