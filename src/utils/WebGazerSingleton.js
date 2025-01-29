// utils/WebGazerSingleton.js
import Cookies from "js-cookie";

class WebGazerSingleton {
  static instance = null;
  static modelPreloaded = false;
  static trackingStarted = false;

  /**
   * Preloads the WebGazer model. 
   * Pull any calibration data from the cookie => localStorage => used by WebGazer.
   */
  static async preload() {
    if (this.modelPreloaded) {
      return;
    }
    // 1) Read cookie data, if any, and copy to localStorage
    const cookieData = Cookies.get("webgazerCalib");
    if (cookieData) {
      localStorage.setItem("webgazerGlobalData", cookieData);
      console.log("[WebGazer] Restored calibration from cookie → localStorage");
    }

    // 2) Load WebGazer script
    const { default: webgazer } = await import("webgazer");
    webgazer
      .setRegression("weightedRidge")
      .setTracker("TFFacemesh")
      .saveDataAcrossSessions(true); // Store calibration in localStorage

    this.instance = webgazer;
    this.modelPreloaded = true;
    console.log("[WebGazer] Model preloaded.");
  }

  /**
   * Initialize WebGazer, start camera, attach a gaze listener if provided
   */
  static async initialize(onGazeListener = null) {
    if (!this.modelPreloaded) {
      await this.preload();
    }
    if (this.instance && this.trackingStarted) {
      // Just update the gaze listener if you want
      if (onGazeListener) {
        this.instance.setGazeListener((data, elapsedTime) => {
          if (data) onGazeListener(data, elapsedTime);
        });
      }
      return this.instance;
    }
    // Create or reuse instance
    const { default: webgazer } = await import("webgazer");
    if (!this.instance) {
      this.instance = webgazer
        .setRegression("weightedRidge")
        .setTracker("TFFacemesh")
        .saveDataAcrossSessions(true);
    }
    // Gaze listener
    if (onGazeListener) {
      this.instance.setGazeListener((data, elapsedTime) => {
        if (data) onGazeListener(data, elapsedTime);
      });
    }
    // Begin
    await this.instance.begin();
    this.trackingStarted = true;
    console.log("[WebGazer] Tracking started");
    return this.instance;
  }

  /**
   * End tracking session
   */
  static end() {
    if (this.instance) {
      this.instance.clearGazeListener();
      this.instance.end();
      this.instance = null;
      this.trackingStarted = false;
      console.log("[WebGazer] Tracking ended.");
    }
  }

  /**
   * Check if localStorage has calibration data
   */
  static hasSavedCalibration() {
    return !!localStorage.getItem("webgazerGlobalData");
  }

  /**
   * Reset localStorage & cookie, clearing calibration
   */
  static resetCalibrationData() {
    localStorage.removeItem("webgazerGlobalData");
    Cookies.remove("webgazerCalib");
    console.log("[WebGazer] Calibration data reset.");
  }

  /**
   * Copy the calibration data from localStorage into a cookie (webgazerCalib).
   */
  static saveCalibrationDataToCookie() {
    const data = localStorage.getItem("webgazerGlobalData");
    if (!data) {
      console.log("[WebGazer] No calibration data in localStorage to save.");
      return;
    }
    Cookies.set("webgazerCalib", data, {
      path: "/",
      sameSite: "lax",
      // secure: true, // only if you're on https
      expires: 365,
    });
    console.log("[WebGazer] Calibration data saved to cookie.");
  }

  /**
   * Show/hide the camera feed
   */
  static setCameraVisibility(visible) {
    if (!this.instance) return;
    this.instance.showVideo(visible);
    this.instance.showFaceOverlay(visible);
  }
}

export default WebGazerSingleton;
