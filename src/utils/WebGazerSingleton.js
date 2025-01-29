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
      console.log("[WebGazerSingleton] Model is already preloaded.");
      return;
    }

    // 1) Attempt to restore calibration data from cookie before WebGazer loads
    const cookieData = Cookies.get("webgazerCalib");
    if (cookieData) {
      localStorage.setItem("webgazerGlobalData", cookieData);
      console.log("[WebGazerSingleton] Restored calibration from cookie → localStorage");
    } else {
      console.log("[WebGazerSingleton] No calibration cookie found.");
    }

    // 2) Now load the WebGazer script & configure baseline settings
    try {
      const { default: webgazer } = await import("webgazer");
      webgazer
        .setRegression("weightedRidge")
        .setTracker("TFFacemesh")
        .saveDataAcrossSessions(true)   // Store to localStorage automatically
        .showVideo(true)                // You can override visibility later
        .showFaceOverlay(true);

      this.instance = webgazer;
      this.modelPreloaded = true;

      console.log("[WebGazerSingleton] WebGazer script loaded & configured.");
    } catch (error) {
      console.error("[WebGazerSingleton] Preload error:", error);
      throw new Error("Failed to preload WebGazer model.");
    }
  }

  /**
   * Initializes the WebGazer instance, starts the camera, and begins tracking.
   * @param {function} onGazeListener - A callback that receives (data, elapsedTime).
   */
  static async initialize(onGazeListener = null) {
    // If already active, just update the gaze listener
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

      // Create or reuse the instance
      if (!this.instance) {
        this.instance = webgazer
          .setRegression("weightedRidge")
          .setTracker("TFFacemesh")
          .saveDataAcrossSessions(true);
      }

      // Add your gaze callback
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data, elapsedTime);
        });
      }

      // Start streaming and tracking
      await this.instance.begin();
      this.trackingStarted = true;
      console.log("[WebGazerSingleton] Tracking has begun.");

      return this.instance;
    } catch (error) {
      console.error("[WebGazerSingleton] Initialization error:", error);
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
      console.log("[WebGazerSingleton] Tracking ended.");
    } else {
      console.warn("[WebGazerSingleton] No active instance to end.");
    }
  }

  /**
   * Checks if calibration data exists in localStorage (the default place
   * where WebGazer stores data).
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
      console.log("[WebGazerSingleton] Cleared calibration from localStorage.");
    }
    Cookies.remove("webgazerCalib");
    console.log("[WebGazerSingleton] Removed 'webgazerCalib' cookie.");

    // Also clear in-memory data, if possible
    if (this.instance && typeof this.instance.clearData === "function") {
      this.instance.clearData();
      console.log("[WebGazerSingleton] Cleared in-memory calibration data.");
    }
  }

  /**
   * Copies the calibration data from localStorage into a cookie
   * so it can be reloaded on future visits or other pages.
   */
  static saveCalibrationDataToCookie() {
    const data = localStorage.getItem("webgazerGlobalData");
    if (data) {
      // sameSite: "lax" (or "none" with secure: true if you’re on HTTPS)
      Cookies.set("webgazerCalib", data, {
        expires: 365,
        path: "/",
        sameSite: "lax",  
      });
      console.log("[WebGazerSingleton] Saved calibration to cookie (webgazerCalib).");
    } else {
      console.log("[WebGazerSingleton] No calibration data in localStorage.");
    }
  }

  /**
   * Show/hide the camera feed and face overlay.
   */
  static setCameraVisibility(visible) {
    if (!this.instance) {
      console.warn("[WebGazerSingleton] No instance to set camera visibility on.");
      return;
    }
    this.instance.showVideo(visible);
    this.instance.showFaceOverlay(visible);
    console.log(`[WebGazerSingleton] Camera visibility set to: ${visible}`);
  }
}

export default WebGazerSingleton;
