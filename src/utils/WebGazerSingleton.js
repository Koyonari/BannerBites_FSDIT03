// src/utils/WebGazerSingleton.js
import Cookies from "js-cookie";

class WebGazerSingleton {
  static instance = null;
  static modelPreloaded = false;
  static trackingStarted = false;

  /**
   * Preloads the WebGazer model.
   * - Loads calibration data from a cookie (if present) into localStorage
   * - Then loads the WebGazer script and configures baseline settings.
   */
  static async preload() {
    if (this.modelPreloaded) {
      console.log("Model already preloaded.");
      return;
    }

    // 1) Attempt to restore calibration data from cookie before WebGazer loads
    const cookieData = Cookies.get("webgazerCalib");
    if (cookieData) {
      // Write to localStorage so WebGazer sees it
      localStorage.setItem("webgazerGlobalData", cookieData);
      console.log("Restored calibration data from cookie to localStorage");
    } else {
      console.log("No calibration data found in cookies");
    }

    // 2) Now load the WebGazer script
    try {
      const { default: webgazer } = await import("webgazer");
      webgazer
        .setRegression("weightedRidge") // e.g., "ridge" or "weightedRidge"
        .setTracker("TFFacemesh")       // or other tracker
        .saveDataAcrossSessions(true);  // ensures WebGazer uses localStorage
      this.instance = webgazer;
      this.modelPreloaded = true;
      console.log("WebGazer model preloaded.");
    } catch (error) {
      console.error("Preload error:", error);
      throw new Error("Failed to preload WebGazer model.");
    }
  }

  /**
   * Initializes the WebGazer instance, starts the camera, and begins tracking.
   * @param {function} onGazeListener - A callback that receives (data, elapsedTime).
   */
  static async initialize(onGazeListener = null) {
    // If we already have an instance and have started tracking, just update the gaze listener
    if (this.instance && this.trackingStarted) {
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data, elapsedTime);
        });
      }
      return this.instance;
    }

    // Make sure the model is preloaded before initialization
    if (!this.modelPreloaded) {
      await this.preload();
    }

    try {
      const { default: webgazer } = await import("webgazer");
      if (!this.instance) {
        // Create a new WebGazer instance
        this.instance = webgazer;
        this.instance
          .setRegression("weightedRidge")
          .setTracker("TFFacemesh")
          .saveDataAcrossSessions(true);
      }

      // If provided, attach the user's gaze listener
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data, elapsedTime);
        });
      }

      // Begin the WebGazer tracking
      await this.instance.begin();
      this.trackingStarted = true;
      console.log("WebGazer tracking started.");
      return this.instance;
    } catch (error) {
      console.error("Initialization error:", error);
      throw new Error("Failed to initialize WebGazer.");
    }
  }

  /**
   * Ends the tracking session, clears the gaze listener, and resets the instance.
   */
  static end() {
    if (this.instance) {
      this.instance.clearGazeListener();
      this.instance.end();
      this.instance = null;
      this.trackingStarted = false;
      console.log("WebGazer tracking ended successfully.");
    } else {
      console.warn("No active WebGazer instance to end.");
    }
  }

  /**
   * Checks if calibration data exists in localStorage
   * (the default place where WebGazer stores data).
   */
  static hasSavedCalibration() {
    return !!window.localStorage.getItem("webgazerGlobalData");
  }

  /**
   * Clears calibration data from localStorage and cookies.
   * Useful for a "Recalibrate" flow.
   */
  static resetCalibrationData() {
    if (window.localStorage.getItem("webgazerGlobalData")) {
      window.localStorage.removeItem("webgazerGlobalData");
      console.log("Cleared saved calibration data from localStorage.");
    }

    // Also remove cookie if you want to fully discard old data
    Cookies.remove("webgazerCalib");
    console.log("Removed 'webgazerCalib' cookie as well.");

    // If a WebGazer instance is active, clear the model's in-memory data
    if (this.instance) {
      if (typeof this.instance.clearData === "function") {
        this.instance.clearData();
      }
      console.log("Cleared in-memory calibration data from WebGazer instance.");
    }
  }

  /**
   * Copies the calibration data from localStorage into a cookie
   * so it can be reloaded on future visits or other pages.
   */
  static saveCalibrationDataToCookie() {
    const data = localStorage.getItem("webgazerGlobalData");
    if (data) {
      Cookies.set("webgazerCalib", data, { expires: 365, path: "/" });
      console.log("Calibration data saved to cookie (webgazerCalib).");
    } else {
      console.log("No calibration data in localStorage to save to cookie.");
    }
  }

  /**
   * Show/hide the camera feed and face overlay.
   * Call this any time after WebGazer has begun tracking.
   * @param {boolean} visible - Whether to show or hide the camera.
   */
  static setCameraVisibility(visible) {
    if (!this.instance) {
      console.warn("No WebGazer instance to set camera visibility on.");
      return;
    }
    console.log(`Setting camera visibility to ${visible}`);
    this.instance.showVideo(visible);
    this.instance.showFaceOverlay(visible);
  }
}

export default WebGazerSingleton;
