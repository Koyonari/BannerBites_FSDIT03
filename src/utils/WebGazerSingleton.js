
import webgazer from "webgazer";
class WebGazerSingleton {
  static instance = null;

  static async initialize(onGazeListener) {
    if (this.instance) {
      console.log("[WebGazerSingleton] Already initialized.");
      return this.instance;
    }

    try {
      const webgazer = await import("webgazer").then((module) => module.default);

      webgazer
        .setRegression("ridge")
        .setTracker("TFFacemesh")
        .setGazeListener((data, elapsedTime) => {
          if (data) {
            onGazeListener(data);
          }
        })
        .saveDataAcrossSessions(true);

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
      this.instance.end();
      this.instance = null;
      console.log("[WebGazerSingleton] Ended successfully.");
    } else {
      console.warn("[WebGazerSingleton] No active instance to end.");
    }
  }
}

export default WebGazerSingleton;
