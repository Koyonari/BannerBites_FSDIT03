// src/utils/WebGazerSingleton.js

import webgazer from "webgazer";

class WebGazerSingleton {
  static instance = null;

  static initialize(onGazeListener) {
    if (this.instance) return; // Prevent reinitialization

    webgazer
      .setRegression("ridge")
      .setTracker("TFFacemesh")
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
